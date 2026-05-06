(() => {
  "use strict";

  const GLOBAL_PATCH_FLAG = "__CGPT_LONG_CHAT_LOADER_FETCH_PATCHED__";
  const SETTINGS_KEY = "cgptLongChatLoader.settings";
  const SETTINGS_ATTR = "data-cgpt-lb-settings";
  const TRIMMED_ATTR = "data-cgpt-lb-api-trimmed";
  const KEPT_ATTR = "data-cgpt-lb-api-kept";
  const BYPASS_KEY = "cgptLongChatLoader.bypassOnce";
  const DEBUG_PREFIX = "[ChatGPT Long Chat Loader]";

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    apiTrimEnabled: true,
    visibleTurns: 6,
    loadMoreBatch: 6,
    prefetchBatches: 10,
    showStatus: true,
    debug: false
  });

  const RESPONSE_CACHE_MAX = 5;
  const responseCache = new Map();
  let settingsFromBridge = null;

  if (window[GLOBAL_PATCH_FLAG]) return;
  window[GLOBAL_PATCH_FLAG] = true;

  window.addEventListener("cgpt-lb-settings", (event) => {
    const raw = event && typeof event.detail === "string" ? event.detail : null;
    if (!raw) return;
    try {
      settingsFromBridge = normalizeSettings(JSON.parse(raw));
    } catch {
      settingsFromBridge = null;
    }
  });

  const originalFetch = window.fetch;
  if (typeof originalFetch !== "function") return;

  window.fetch = async function patchedFetch(input, init) {
    const requestUrl = getRequestUrl(input);
    const requestMethod = getRequestMethod(input, init);

    if (!isConversationGet(requestUrl, requestMethod)) {
      return originalFetch.call(this, input, init);
    }

    const settings = readSettings();
    if (!settings.enabled || !settings.apiTrimEnabled) {
      return originalFetch.call(this, input, init);
    }

    if (consumeBypassFlag()) {
      responseCache.clear();
      clearTrimSignal();
      debug(settings, "bypass once: full conversation load", requestUrl);
      return originalFetch.call(this, input, init);
    }

    const keepVisibleMessages = calculateKeepVisibleMessages(settings);
    const cacheKey = `${requestUrl}::keep=${keepVisibleMessages}`;
    const cached = getCached(cacheKey);
    if (cached) {
      debug(settings, "cache hit", cacheKey);
      signalTrim(cached.trimmed, cached.keptVisibleMessages);
      return buildResponseFromCache(cached);
    }

    const response = await originalFetch.call(this, input, init);
    if (!response || !response.ok) return response;

    try {
      const clone = response.clone();
      let text = await clone.text();
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

      const data = JSON.parse(text);
      const trimResult = trimChatGptConversation(data, keepVisibleMessages);

      if (!trimResult.trimmed) {
        putCached(cacheKey, {
          body: text,
          trimmed: false,
          keptVisibleMessages: trimResult.totalVisibleMessages,
          status: response.status,
          statusText: response.statusText,
          headers: Array.from(new Headers(response.headers).entries()),
          url: response.url
        });
        signalTrim(false, trimResult.totalVisibleMessages);
        debug(settings, "no trim needed", trimResult.totalVisibleMessages);
        return response;
      }

      const body = JSON.stringify(trimResult.data);
      putCached(cacheKey, {
        body,
        trimmed: true,
        keptVisibleMessages: trimResult.keptVisibleMessages,
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(new Headers(response.headers).entries()),
        url: response.url
      });

      signalTrim(true, trimResult.keptVisibleMessages);
      debug(
        settings,
        `trimmed visible messages ${trimResult.totalVisibleMessages} -> ${trimResult.keptVisibleMessages}`,
        requestUrl
      );
      return buildJsonResponse(response, body);
    } catch (error) {
      debug(settings, "trim failed; returning original response", error);
      return response;
    }
  };

  function getRequestUrl(input) {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.toString();
    if (input && typeof input.url === "string") return input.url;
    return "";
  }

  function getRequestMethod(input, init) {
    const method =
      (init && init.method) ||
      (input && typeof input === "object" && "method" in input ? input.method : null) ||
      "GET";
    return String(method).toUpperCase();
  }

  function isConversationGet(url, method) {
    if (method !== "GET") return false;
    if (!url || !url.includes("/backend-api/conversation/")) return false;
    if (url.includes("/backend-api/conversations")) return false;
    return location.hostname === "chatgpt.com" || location.hostname.endsWith(".chatgpt.com") || location.hostname === "chat.openai.com";
  }

  function normalizeSettings(value) {
    const merged = { ...DEFAULT_SETTINGS, ...(value && typeof value === "object" ? value : {}) };
    return {
      enabled: Boolean(merged.enabled),
      apiTrimEnabled: Boolean(merged.apiTrimEnabled),
      visibleTurns: clampInt(merged.visibleTurns, 1, 100, DEFAULT_SETTINGS.visibleTurns),
      loadMoreBatch: clampInt(merged.loadMoreBatch, 1, 100, DEFAULT_SETTINGS.loadMoreBatch),
      prefetchBatches: clampInt(merged.prefetchBatches, 0, 30, DEFAULT_SETTINGS.prefetchBatches),
      showStatus: Boolean(merged.showStatus),
      debug: Boolean(merged.debug)
    };
  }

  function readSettings() {
    if (settingsFromBridge) return settingsFromBridge;

    const attr = document.documentElement && document.documentElement.getAttribute(SETTINGS_ATTR);
    if (attr) {
      try {
        settingsFromBridge = normalizeSettings(JSON.parse(attr));
        return settingsFromBridge;
      } catch {
        // Continue to localStorage/defaults.
      }
    }

    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return normalizeSettings(JSON.parse(raw));
    } catch {
      // Ignore blocked or corrupted storage.
    }
    return { ...DEFAULT_SETTINGS };
  }

  function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function calculateKeepVisibleMessages(settings) {
    // ChatGPT usually renders one DOM turn per message; a user/assistant exchange is roughly two messages.
    const visible = settings.visibleTurns * 2;
    const buffered = settings.loadMoreBatch * settings.prefetchBatches * 2;
    return Math.max(2, visible + buffered);
  }

  function consumeBypassFlag() {
    try {
      if (localStorage.getItem(BYPASS_KEY) === "true") {
        localStorage.removeItem(BYPASS_KEY);
        return true;
      }
    } catch {
      // Ignore storage failures.
    }
    return false;
  }

  function signalTrim(trimmed, keptVisibleMessages) {
    if (!document.documentElement) return;
    if (trimmed) {
      document.documentElement.setAttribute(TRIMMED_ATTR, "true");
      document.documentElement.setAttribute(KEPT_ATTR, String(keptVisibleMessages || ""));
    } else {
      clearTrimSignal();
    }
  }

  function clearTrimSignal() {
    if (!document.documentElement) return;
    document.documentElement.removeAttribute(TRIMMED_ATTR);
    document.documentElement.removeAttribute(KEPT_ATTR);
  }

  function putCached(key, value) {
    responseCache.delete(key);
    responseCache.set(key, value);
    while (responseCache.size > RESPONSE_CACHE_MAX) {
      const oldestKey = responseCache.keys().next().value;
      responseCache.delete(oldestKey);
    }
  }

  function getCached(key) {
    const entry = responseCache.get(key);
    if (!entry) return null;
    responseCache.delete(key);
    responseCache.set(key, entry);
    return entry;
  }

  function buildResponseFromCache(entry) {
    const headers = new Headers(entry.headers || []);
    const response = new Response(entry.body, {
      status: entry.status,
      statusText: entry.statusText,
      headers
    });
    defineResponseUrl(response, entry.url);
    return response;
  }

  function buildJsonResponse(original, body) {
    const headers = new Headers(original.headers);
    headers.set("content-type", "application/json; charset=utf-8");
    headers.delete("content-length");
    headers.delete("content-encoding");

    const response = new Response(body, {
      status: original.status,
      statusText: original.statusText,
      headers
    });
    defineResponseUrl(response, original.url);
    return response;
  }

  function defineResponseUrl(response, url) {
    try {
      Object.defineProperty(response, "url", { value: url || location.href });
    } catch {
      // Non-critical. Some engines may expose url as non-configurable.
    }
  }

  function trimChatGptConversation(data, keepVisibleMessages) {
    if (!data || typeof data !== "object") {
      return { trimmed: false, data, totalVisibleMessages: 0, keptVisibleMessages: 0 };
    }

    const mapping = data.mapping;
    const currentNode = data.current_node;
    if (!mapping || typeof mapping !== "object" || !currentNode || !mapping[currentNode]) {
      return { trimmed: false, data, totalVisibleMessages: 0, keptVisibleMessages: 0 };
    }

    const chain = buildCurrentChain(mapping, currentNode);
    if (chain.length === 0) {
      return { trimmed: false, data, totalVisibleMessages: 0, keptVisibleMessages: 0 };
    }

    const visibleIds = chain.filter((id) => isVisibleChatNode(mapping[id]));
    const totalVisibleMessages = visibleIds.length;
    if (totalVisibleMessages <= keepVisibleMessages) {
      return { trimmed: false, data, totalVisibleMessages, keptVisibleMessages: totalVisibleMessages };
    }

    const cutoffVisibleId = visibleIds[visibleIds.length - keepVisibleMessages];
    const cutoffIndex = Math.max(0, chain.indexOf(cutoffVisibleId));
    const keptIds = new Set();

    // Keep root/system/non-visible metadata before the cutoff. Drop old visible user/assistant/tool nodes.
    for (let i = 0; i < cutoffIndex; i += 1) {
      const id = chain[i];
      if (i === 0 || !isVisibleChatNode(mapping[id])) keptIds.add(id);
    }

    for (let i = cutoffIndex; i < chain.length; i += 1) {
      keptIds.add(chain[i]);
    }

    const keptChain = chain.filter((id) => keptIds.has(id));
    if (keptChain.length === chain.length) {
      return { trimmed: false, data, totalVisibleMessages, keptVisibleMessages: totalVisibleMessages };
    }

    const newMapping = {};
    for (let i = 0; i < keptChain.length; i += 1) {
      const id = keptChain[i];
      const clonedNode = deepClone(mapping[id]);
      clonedNode.parent = i > 0 ? keptChain[i - 1] : null;
      clonedNode.children = i < keptChain.length - 1 ? [keptChain[i + 1]] : [];
      newMapping[id] = clonedNode;
    }

    const result = { ...data, mapping: newMapping };
    if ("root" in result) result.root = keptChain[0] || data.root || currentNode;

    return {
      trimmed: true,
      data: result,
      totalVisibleMessages,
      keptVisibleMessages: keptChain.filter((id) => isVisibleChatNode(newMapping[id])).length
    };
  }

  function buildCurrentChain(mapping, currentNode) {
    const reversed = [];
    const visited = new Set();
    let id = currentNode;

    while (id && mapping[id] && !visited.has(id)) {
      visited.add(id);
      reversed.push(id);
      id = mapping[id].parent || null;
    }

    return reversed.reverse();
  }

  function isVisibleChatNode(node) {
    if (!node || typeof node !== "object") return false;
    const message = node.message;
    if (!message || typeof message !== "object") return false;
    const role = message.author && message.author.role;
    return role === "user" || role === "assistant" || role === "tool";
  }

  function deepClone(value) {
    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch {
        // Fall through.
      }
    }
    return JSON.parse(JSON.stringify(value));
  }

  function debug(settings, ...args) {
    if (!settings || !settings.debug) return;
    try {
      console.debug(DEBUG_PREFIX, ...args);
    } catch {
      // Ignore console failures.
    }
  }
})();
