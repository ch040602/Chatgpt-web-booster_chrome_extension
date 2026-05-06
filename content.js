(() => {
  "use strict";

  const SETTINGS_KEY = "cgptLongChatLoader.settings";
  const SETTINGS_ATTR = "data-cgpt-lb-settings";
  const TRIMMED_ATTR = "data-cgpt-lb-api-trimmed";
  const KEPT_ATTR = "data-cgpt-lb-api-kept";
  const BYPASS_KEY = "cgptLongChatLoader.bypassOnce";
  const HIDDEN_CLASS = "cgpt-lb-hidden";
  const LOAD_MORE_ID = "cgpt-lb-load-more";
  const STATUS_ID = "cgpt-lb-status";

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    apiTrimEnabled: true,
    visibleTurns: 6,
    loadMoreBatch: 6,
    prefetchBatches: 10,
    showStatus: true,
    debug: false
  });

  let settings = { ...DEFAULT_SETTINGS };
  let messageElements = [];
  let extraVisibleMessages = 0;
  let apiTrimmedCurrentConversation = false;
  let lastUrl = location.href;
  let scanScheduled = false;
  let loadMoreButton = null;
  let statusBadge = null;
  let observer = null;

  boot();

  async function boot() {
    settings = await loadSettings();
    writeSettingsBridge();
    ensureUi();
    scanAndApply();
    startObserver();
    startNavigationWatcher();
    listenForSettingsChanges();
  }

  function loadSettings() {
    return new Promise((resolve) => {
      if (!hasChromeStorage()) {
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }
      chrome.storage.local.get(DEFAULT_SETTINGS, (value) => {
        resolve(normalizeSettings(value));
      });
    });
  }

  function hasChromeStorage() {
    return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
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

  function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function writeSettingsBridge() {
    const raw = JSON.stringify(settings);
    try {
      localStorage.setItem(SETTINGS_KEY, raw);
    } catch {
      // Ignore blocked storage.
    }
    if (document.documentElement) {
      document.documentElement.setAttribute(SETTINGS_ATTR, raw);
    }
    try {
      window.dispatchEvent(new CustomEvent("cgpt-lb-settings", { detail: raw }));
    } catch {
      // Ignore event bridge failures.
    }
  }

  function listenForSettingsChanges() {
    if (!hasChromeStorage() || !chrome.storage.onChanged) return;
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      const next = { ...settings };
      let changed = false;
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        if (Object.prototype.hasOwnProperty.call(changes, key)) {
          next[key] = changes[key].newValue;
          changed = true;
        }
      }
      if (!changed) return;
      settings = normalizeSettings(next);
      writeSettingsBridge();
      scanAndApply();
    });
  }

  function startObserver() {
    const target = document.body || document.documentElement;
    if (!target) return;
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && (mutation.addedNodes.length || mutation.removedNodes.length)) {
          scheduleScan();
          return;
        }
      }
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  function startNavigationWatcher() {
    window.addEventListener("popstate", checkNavigation, { passive: true });
    setInterval(checkNavigation, 700);
  }

  function checkNavigation() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    extraVisibleMessages = 0;
    apiTrimmedCurrentConversation = false;
    messageElements = [];
    hideLoadMore();
    scheduleScan();
  }

  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    const run = () => {
      scanScheduled = false;
      scanAndApply();
    };
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 500 });
    } else {
      setTimeout(run, 120);
    }
  }

  function scanAndApply() {
    consumeApiTrimSignal();
    messageElements = queryMessageTurns();
    applyVisibility();
  }

  function consumeApiTrimSignal() {
    const root = document.documentElement;
    if (!root) return;
    if (root.hasAttribute(TRIMMED_ATTR)) {
      apiTrimmedCurrentConversation = true;
      root.removeAttribute(TRIMMED_ATTR);
    }
  }

  function queryMessageTurns() {
    const candidates = [];
    collectAll(candidates, '[data-testid^="conversation-turn-"]');
    collectAll(candidates, 'article:has([data-message-author-role])');
    collectAll(candidates, 'section:has([data-message-author-role])');

    const roleNodes = safeQueryAll('[data-message-author-role]');
    for (const node of roleNodes) {
      const turn = node.closest('[data-testid^="conversation-turn-"], article, section');
      if (turn instanceof HTMLElement) candidates.push(turn);
    }

    return dedupeAndSort(candidates).filter((el) => isAttached(el) && !isExtensionUi(el));
  }

  function collectAll(target, selector) {
    const found = safeQueryAll(selector);
    for (const el of found) {
      if (el instanceof HTMLElement) target.push(el);
    }
  }

  function safeQueryAll(selector) {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch {
      return [];
    }
  }

  function dedupeAndSort(elements) {
    const set = new Set(elements.filter((el) => el instanceof HTMLElement));
    const ordered = Array.from(set);

    // Remove nested duplicates. Prefer the outer conversation-turn/article/section wrapper.
    const withoutNested = ordered.filter((el) => {
      for (const other of ordered) {
        if (el !== other && other.contains(el)) return false;
      }
      return true;
    });

    withoutNested.sort((a, b) => {
      if (a === b) return 0;
      const pos = a.compareDocumentPosition(b);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    return withoutNested;
  }

  function isAttached(el) {
    return document.documentElement && document.documentElement.contains(el);
  }

  function isExtensionUi(el) {
    return Boolean(el.closest(`#${LOAD_MORE_ID}, #${STATUS_ID}`));
  }

  function applyVisibility() {
    ensureUi();
    const total = messageElements.length;

    if (!settings.enabled || total === 0) {
      for (const el of messageElements) showElement(el);
      hideLoadMore();
      updateStatus(0, total);
      return;
    }

    const baseVisibleMessages = settings.visibleTurns * 2;
    const visibleLimit = Math.max(2, baseVisibleMessages + extraVisibleMessages);
    const hiddenCount = Math.max(0, total - visibleLimit);

    for (let i = 0; i < total; i += 1) {
      const el = messageElements[i];
      if (i < hiddenCount) hideElement(el);
      else showElement(el);
    }

    updateLoadMore(hiddenCount);
    updateStatus(hiddenCount, total);
  }

  function hideElement(el) {
    if (el.classList.contains(HIDDEN_CLASS)) return;
    el.classList.add(HIDDEN_CLASS);
    el.setAttribute("aria-hidden", "true");
  }

  function showElement(el) {
    if (!el.classList.contains(HIDDEN_CLASS)) return;
    el.classList.remove(HIDDEN_CLASS);
    el.removeAttribute("aria-hidden");
  }

  function ensureUi() {
    if (!loadMoreButton || !document.documentElement.contains(loadMoreButton)) {
      loadMoreButton = document.createElement("button");
      loadMoreButton.id = LOAD_MORE_ID;
      loadMoreButton.type = "button";
    }
    if (!statusBadge || !document.documentElement.contains(statusBadge)) {
      statusBadge = document.createElement("div");
      statusBadge.id = STATUS_ID;
      statusBadge.setAttribute("role", "status");
      statusBadge.setAttribute("aria-live", "polite");
      (document.body || document.documentElement).appendChild(statusBadge);
    }
  }

  function updateLoadMore(hiddenCount) {
    if (!loadMoreButton) return;

    const firstVisible = messageElements.find((el) => !el.classList.contains(HIDDEN_CLASS));
    const container = firstVisible && firstVisible.parentElement;

    if (hiddenCount > 0) {
      loadMoreButton.dataset.mode = "more";
      loadMoreButton.textContent = `이전 메시지 ${Math.min(hiddenCount, settings.loadMoreBatch * 2)}개 더 보기 · 숨김 ${hiddenCount}개`;
      loadMoreButton.onclick = () => {
        extraVisibleMessages += settings.loadMoreBatch * 2;
        applyVisibility();
        requestAnimationFrame(() => loadMoreButton.scrollIntoView({ block: "center", behavior: "smooth" }));
      };
      showLoadMore(container, firstVisible);
      return;
    }

    if (apiTrimmedCurrentConversation && settings.apiTrimEnabled) {
      loadMoreButton.dataset.mode = "full";
      loadMoreButton.textContent = "전체 대화 로드하기 · 느려질 수 있음";
      loadMoreButton.onclick = () => {
        try {
          localStorage.setItem(BYPASS_KEY, "true");
        } catch {
          // Ignore storage failures.
        }
        location.reload();
      };
      showLoadMore(container, firstVisible);
      return;
    }

    hideLoadMore();
  }

  function showLoadMore(container, beforeNode) {
    if (!container) {
      const fallback = document.querySelector("main") || document.body || document.documentElement;
      if (fallback && loadMoreButton.parentElement !== fallback) fallback.prepend(loadMoreButton);
      loadMoreButton.hidden = false;
      return;
    }
    if (loadMoreButton.parentElement !== container || loadMoreButton.nextSibling !== beforeNode) {
      container.insertBefore(loadMoreButton, beforeNode || container.firstChild);
    }
    loadMoreButton.hidden = false;
  }

  function hideLoadMore() {
    if (loadMoreButton) loadMoreButton.hidden = true;
  }

  function updateStatus(hiddenCount, total) {
    if (!statusBadge) return;
    if (!settings.enabled || !settings.showStatus || total === 0) {
      statusBadge.hidden = true;
      return;
    }

    const visible = total - hiddenCount;
    const trimText = apiTrimmedCurrentConversation ? " · API trim" : "";
    const kept = document.documentElement ? document.documentElement.getAttribute(KEPT_ATTR) : null;
    statusBadge.textContent = `표시 ${visible}/${total} · 숨김 ${hiddenCount}${kept ? ` · API ${kept}` : trimText}`;
    statusBadge.hidden = false;
  }

  function debug(...args) {
    if (!settings.debug) return;
    try {
      console.debug("[ChatGPT Long Chat Loader]", ...args);
    } catch {
      // Ignore console failures.
    }
  }

  window.addEventListener("beforeunload", () => {
    if (observer) observer.disconnect();
    observer = null;
  });
})();
