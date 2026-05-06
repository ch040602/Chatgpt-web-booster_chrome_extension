(() => {
  "use strict";

  const SETTINGS_KEY = "cgptLongChatLoader.settings";
  const SETTINGS_ATTR = "data-cgpt-lb-settings";
  const TRIMMED_ATTR = "data-cgpt-lb-api-trimmed";
  const KEPT_ATTR = "data-cgpt-lb-api-kept";
  const STATS_ATTR = "data-cgpt-lb-api-stats";
  const BYPASS_KEY = "cgptLongChatLoader.bypassOnce";
  const SETTINGS_EVENT = "cgpt-lb-settings";
  const STATS_EVENT = "cgpt-lb-trim-stats";
  const LOCATION_EVENT = "cgpt-lb-locationchange";
  const HIDDEN_CLASS = "cgpt-lb-hidden";
  const CONTAINED_CLASS = "cgpt-lb-contained";
  const LOAD_MORE_ID = "cgpt-lb-load-more";
  const STATUS_ID = "cgpt-lb-status";
  const TURN_SELECTOR = '[data-testid^="conversation-turn-"]';
  const ROLE_SELECTOR = "[data-message-author-role]";

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    apiTrimEnabled: true,
    visibleTurns: 4,
    loadMoreBatch: 4,
    prefetchBatches: 2,
    apiCacheEntries: 0,
    cssContainmentEnabled: true,
    showStatus: false,
    debug: false
  });

  let settings = { ...DEFAULT_SETTINGS };
  let extraVisibleMessages = 0;
  let apiTrimmedCurrentConversation = false;
  let lastApiStats = null;
  let lastUrl = location.href;
  let lastDomMetrics = { total: 0, hidden: 0, visible: 0 };
  let scanScheduled = false;
  let scanTimer = 0;
  let lastScanAt = 0;
  let loadMoreButton = null;
  let statusBadge = null;
  let observer = null;
  let observerTarget = null;
  let navigationTimer = 0;

  boot();

  async function boot() {
    settings = await loadSettings();
    writeSettingsBridge();
    listenForSettingsChanges();
    listenForPopupMetrics();
    listenForTrimStats();
    startNavigationWatcher();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        ensureObserverTarget();
        scheduleScan(true);
      }, { once: true });
    }

    ensureObserverTarget();
    scheduleScan(true);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) scheduleScan();
    }, { passive: true });
  }

  function loadSettings() {
    return new Promise((resolve) => {
      if (!hasChromeStorage()) {
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }
      chrome.storage.local.get(null, (value) => {
        resolve(normalizeSettings(value || {}));
      });
    });
  }

  function hasChromeStorage() {
    return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
  }

  function normalizeSettings(value) {
    const merged = { ...DEFAULT_SETTINGS, ...(value && typeof value === "object" ? value : {}) };
    const cacheValue = Object.prototype.hasOwnProperty.call(merged, "apiCacheEntries")
      ? merged.apiCacheEntries
      : merged.responseCacheMax;
    return {
      enabled: Boolean(merged.enabled),
      apiTrimEnabled: Boolean(merged.apiTrimEnabled),
      visibleTurns: clampInt(merged.visibleTurns, 1, 100, DEFAULT_SETTINGS.visibleTurns),
      loadMoreBatch: clampInt(merged.loadMoreBatch, 1, 100, DEFAULT_SETTINGS.loadMoreBatch),
      prefetchBatches: clampInt(merged.prefetchBatches, 0, 30, DEFAULT_SETTINGS.prefetchBatches),
      apiCacheEntries: clampInt(cacheValue, 0, 3, DEFAULT_SETTINGS.apiCacheEntries),
      cssContainmentEnabled: Boolean(merged.cssContainmentEnabled ?? merged.contentVisibilityEnabled),
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
      window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: raw }));
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
      if (Object.prototype.hasOwnProperty.call(changes, "responseCacheMax")) {
        next.apiCacheEntries = changes.responseCacheMax.newValue;
        changed = true;
      }
      if (!changed) return;
      settings = normalizeSettings(next);
      writeSettingsBridge();
      ensureObserverTarget();
      scanAndApply();
    });
  }

  function listenForPopupMetrics() {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.onMessage) return;
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || message.type !== "cgpt-lb-get-metrics") return false;
      try {
        scanAndApply();
        sendResponse(collectMetricsForPopup());
      } catch (error) {
        sendResponse({ ok: false, error: String(error && error.message ? error.message : error) });
      }
      return true;
    });
  }

  function listenForTrimStats() {
    window.addEventListener(STATS_EVENT, (event) => {
      const raw = event && typeof event.detail === "string" ? event.detail : "";
      const parsed = parseStats(raw);
      if (!statsApplyToThisPage(parsed)) return;
      lastApiStats = parsed;
      apiTrimmedCurrentConversation = Boolean(parsed && parsed.trimmed);
      scheduleScan();
    });
  }

  function startNavigationWatcher() {
    window.addEventListener(LOCATION_EVENT, checkNavigation, { passive: true });
    window.addEventListener("popstate", checkNavigation, { passive: true });
    window.addEventListener("hashchange", checkNavigation, { passive: true });
    navigationTimer = window.setInterval(checkNavigation, 3000);
  }

  function checkNavigation() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    extraVisibleMessages = 0;
    apiTrimmedCurrentConversation = false;
    lastApiStats = null;
    lastDomMetrics = { total: 0, hidden: 0, visible: 0 };
    hideLoadMore();
    ensureObserverTarget();
    scheduleScan(true);
  }

  function isLikelyChatSurface() {
    const path = location.pathname || "/";
    return path === "/" || path.startsWith("/c/") || path.includes("/c/") || path.startsWith("/share/") || path.startsWith("/g/");
  }

  function ensureObserverTarget() {
    if (!isLikelyChatSurface()) {
      showAllKnownTurns();
      stopObserver();
      removeStatusBadge();
      return;
    }

    const target = getMessageScope() || document.body || document.documentElement;
    if (!target || observerTarget === target) return;

    stopObserver();
    observerTarget = target;
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (isRelevantMutation(mutation)) {
          scheduleScan();
          return;
        }
      }
    });
    observer.observe(target, { childList: true, subtree: true });
    debug("observer target", target.tagName || target.nodeName);
  }

  function stopObserver() {
    if (observer) observer.disconnect();
    observer = null;
    observerTarget = null;
  }

  function isRelevantMutation(mutation) {
    if (mutation.type !== "childList") return false;
    if (mutation.target instanceof Element && isExtensionUi(mutation.target)) return false;

    for (const node of mutation.addedNodes) {
      if (isRelevantNode(node)) return true;
    }
    for (const node of mutation.removedNodes) {
      if (isRelevantNode(node)) return true;
    }
    return false;
  }

  function isRelevantNode(node) {
    if (!(node instanceof Element)) return false;
    if (isExtensionUi(node)) return false;
    if (node.matches && (node.matches(TURN_SELECTOR) || node.matches(ROLE_SELECTOR))) return true;
    return Boolean(node.querySelector && node.querySelector(`${TURN_SELECTOR}, ${ROLE_SELECTOR}`));
  }

  function scheduleScan(immediate) {
    if (!isLikelyChatSurface()) {
      showAllKnownTurns();
      stopObserver();
      return;
    }

    if (scanScheduled && !immediate) return;
    if (scanTimer) clearTimeout(scanTimer);

    scanScheduled = true;
    const now = Date.now();
    const delay = immediate ? 0 : Math.max(0, 550 - (now - lastScanAt));

    scanTimer = window.setTimeout(() => {
      scanTimer = 0;
      const run = () => {
        scanScheduled = false;
        lastScanAt = Date.now();
        scanAndApply();
        ensureObserverTarget();
      };
      if (!immediate && typeof requestIdleCallback === "function") {
        requestIdleCallback(run, { timeout: 800 });
      } else {
        run();
      }
    }, delay);
  }

  function scanAndApply() {
    consumeApiTrimSignal();
    const turns = queryMessageTurns();
    applyVisibility(turns);
  }

  function consumeApiTrimSignal() {
    const root = document.documentElement;
    if (!root) return;

    const stats = readApiStatsFromRoot();
    if (statsApplyToThisPage(stats)) {
      lastApiStats = stats || lastApiStats;
      if (stats && stats.trimmed === false) apiTrimmedCurrentConversation = false;
    }

    if (root.hasAttribute(TRIMMED_ATTR)) {
      apiTrimmedCurrentConversation = true;
      root.removeAttribute(TRIMMED_ATTR);
    }
  }

  function readApiStatsFromRoot() {
    const root = document.documentElement;
    if (!root) return null;
    return parseStats(root.getAttribute(STATS_ATTR));
  }

  function readApiStats() {
    const fromRoot = readApiStatsFromRoot();
    if (statsApplyToThisPage(fromRoot)) {
      lastApiStats = fromRoot || lastApiStats;
    }
    return lastApiStats && statsApplyToThisPage(lastApiStats) ? { ...lastApiStats } : null;
  }

  function parseStats(raw) {
    if (!raw || typeof raw !== "string") return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function statsApplyToThisPage(stats) {
    return !stats || !stats.pageUrl || stats.pageUrl === location.href;
  }

  function getMessageScope() {
    return (
      document.querySelector("main") ||
      document.querySelector("[data-scroll-root]") ||
      document.querySelector('[role="main"]') ||
      document.body ||
      document.documentElement
    );
  }

  function queryMessageTurns() {
    const scope = getMessageScope();
    const primary = safeQueryAll(TURN_SELECTOR, scope);
    if (primary.length) return sortDocumentOrder(uniqueElements(primary)).filter((el) => isAttached(el) && !isExtensionUi(el));

    const candidates = [];
    const roleNodes = safeQueryAll(ROLE_SELECTOR, scope);
    for (const node of roleNodes) {
      const turn = node.closest(`${TURN_SELECTOR}, article, section, [role="article"]`);
      if (turn instanceof HTMLElement) candidates.push(turn);
    }

    return removeNested(sortDocumentOrder(uniqueElements(candidates))).filter((el) => isAttached(el) && !isExtensionUi(el));
  }

  function safeQueryAll(selector, scope) {
    try {
      const root = scope && typeof scope.querySelectorAll === "function" ? scope : document;
      return Array.from(root.querySelectorAll(selector)).filter((el) => el instanceof HTMLElement);
    } catch {
      return [];
    }
  }

  function uniqueElements(elements) {
    return Array.from(new Set(elements.filter((el) => el instanceof HTMLElement)));
  }

  function sortDocumentOrder(elements) {
    const ordered = elements.slice();
    ordered.sort((a, b) => {
      if (a === b) return 0;
      const pos = a.compareDocumentPosition(b);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    return ordered;
  }

  function removeNested(elements) {
    const result = [];
    for (const el of elements) {
      if (!result.some((parent) => parent.contains(el))) result.push(el);
    }
    return result;
  }

  function isAttached(el) {
    return Boolean(document.documentElement && document.documentElement.contains(el));
  }

  function isExtensionUi(el) {
    return Boolean(el && el.closest && el.closest(`#${LOAD_MORE_ID}, #${STATUS_ID}`));
  }

  function applyVisibility(turns) {
    ensureUi();
    const total = turns.length;

    if (!settings.enabled || total === 0) {
      for (const el of turns) {
        removeContainment(el);
        showElement(el);
      }
      hideLoadMore();
      updateStatus(0, total);
      lastDomMetrics = { total, hidden: 0, visible: total };
      return;
    }

    const baseVisibleMessages = settings.visibleTurns * 2;
    const visibleLimit = Math.max(2, baseVisibleMessages + extraVisibleMessages);
    const hiddenCount = Math.max(0, total - visibleLimit);

    for (let i = 0; i < total; i += 1) {
      const el = turns[i];
      if (settings.cssContainmentEnabled) applyContainment(el);
      else removeContainment(el);

      if (i < hiddenCount) hideElement(el);
      else showElement(el);
    }

    updateLoadMore(hiddenCount, turns);
    updateStatus(hiddenCount, total);
    lastDomMetrics = { total, hidden: hiddenCount, visible: Math.max(0, total - hiddenCount) };
  }

  function showAllKnownTurns() {
    const turns = queryMessageTurns();
    for (const el of turns) {
      removeContainment(el);
      showElement(el);
    }
    hideLoadMore();
    lastDomMetrics = { total: turns.length, hidden: 0, visible: turns.length };
  }

  function applyContainment(el) {
    if (!el.classList.contains(CONTAINED_CLASS)) el.classList.add(CONTAINED_CLASS);
  }

  function removeContainment(el) {
    if (el.classList.contains(CONTAINED_CLASS)) el.classList.remove(CONTAINED_CLASS);
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
      loadMoreButton.hidden = true;
    }

    if (!settings.showStatus) {
      removeStatusBadge();
      return;
    }

    if (!document.body) return;
    if (!statusBadge || !document.documentElement.contains(statusBadge)) {
      statusBadge = document.createElement("div");
      statusBadge.id = STATUS_ID;
      statusBadge.setAttribute("role", "status");
      statusBadge.setAttribute("aria-live", "polite");
      document.body.appendChild(statusBadge);
    }
  }

  function removeStatusBadge() {
    if (statusBadge && statusBadge.parentElement) statusBadge.remove();
    statusBadge = null;
  }

  function updateLoadMore(hiddenCount, turns) {
    if (!loadMoreButton) return;

    const firstVisible = turns.find((el) => !el.classList.contains(HIDDEN_CLASS));
    const container = firstVisible && firstVisible.parentElement;

    if (hiddenCount > 0) {
      loadMoreButton.dataset.mode = "more";
      loadMoreButton.textContent = `이전 메시지 ${Math.min(hiddenCount, settings.loadMoreBatch * 2)}개 더 보기 · 숨김 ${hiddenCount}개`;
      loadMoreButton.onclick = () => {
        extraVisibleMessages += settings.loadMoreBatch * 2;
        scanAndApply();
        requestAnimationFrame(() => {
          if (loadMoreButton && !loadMoreButton.hidden) loadMoreButton.scrollIntoView({ block: "center", behavior: "smooth" });
        });
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
    if (!loadMoreButton) return;
    if (!container) {
      const fallback = getMessageScope() || document.body || document.documentElement;
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
    const stats = readApiStats();
    const apiText = stats && stats.totalRenderableMessages
      ? ` · API ${stats.keptRenderableMessages}/${stats.totalRenderableMessages}`
      : apiTrimmedCurrentConversation
        ? " · API trim"
        : "";
    const kept = document.documentElement ? document.documentElement.getAttribute(KEPT_ATTR) : null;
    statusBadge.textContent = `표시 ${visible}/${total} · 숨김 ${hiddenCount}${apiText || (kept ? ` · API ${kept}` : "")}`;
    statusBadge.hidden = false;
  }

  function getMemorySnapshot() {
    const memory = typeof performance !== "undefined" && performance ? performance.memory : null;
    if (!memory) return null;
    return {
      usedJSHeapSize: numberOrNull(memory.usedJSHeapSize),
      totalJSHeapSize: numberOrNull(memory.totalJSHeapSize),
      jsHeapSizeLimit: numberOrNull(memory.jsHeapSizeLimit)
    };
  }

  function numberOrNull(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function collectMetricsForPopup() {
    const turns = queryMessageTurns();
    const total = turns.length;
    const hidden = turns.filter((el) => el.classList.contains(HIDDEN_CLASS)).length;
    const visible = Math.max(0, total - hidden);
    lastDomMetrics = { total, hidden, visible };
    return {
      ok: true,
      url: location.href,
      routeActive: isLikelyChatSurface(),
      enabled: settings.enabled,
      apiTrimmedCurrentConversation,
      settings: { ...settings },
      dom: { ...lastDomMetrics, nodes: countDomNodes() },
      api: readApiStats(),
      memory: getMemorySnapshot(),
      css: {
        contentVisibilitySupported: Boolean(window.CSS && CSS.supports && CSS.supports("content-visibility", "auto"))
      },
      timestamp: Date.now()
    };
  }

  function countDomNodes() {
    try {
      return document.getElementsByTagName("*").length;
    } catch {
      return null;
    }
  }

  function debug(...args) {
    if (!settings.debug) return;
    try {
      console.debug("[ChatGPT Long Chat Loader]", ...args);
    } catch {
      // Ignore console failures.
    }
  }

  window.addEventListener("pagehide", cleanup, { once: true });
  window.addEventListener("beforeunload", cleanup, { once: true });

  function cleanup() {
    stopObserver();
    if (navigationTimer) clearInterval(navigationTimer);
    if (scanTimer) clearTimeout(scanTimer);
    navigationTimer = 0;
    scanTimer = 0;
    lastDomMetrics = { total: 0, hidden: 0, visible: 0 };
  }
})();
