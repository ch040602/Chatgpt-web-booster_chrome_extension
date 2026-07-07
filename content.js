(() => {
  "use strict";

  const CONTENT_VERSION = "1.5.3";
  const CONTENT_BOOT_FLAG = "__CGPT_LONG_CHAT_LOADER_CONTENT_ACTIVE_V153__";
  if (window[CONTENT_BOOT_FLAG]) {
    try {
      window.dispatchEvent(new CustomEvent("cgpt-lb-force-scan", { detail: CONTENT_VERSION }));
    } catch {
      // Ignore duplicate-injection notification failures.
    }
    return;
  }
  window[CONTENT_BOOT_FLAG] = CONTENT_VERSION;

  const SETTINGS_KEY = "cgptLongChatLoader.settings";
  const SETTINGS_ATTR = "data-cgpt-lb-settings";
  const TRIMMED_ATTR = "data-cgpt-lb-api-trimmed";
  const KEPT_ATTR = "data-cgpt-lb-api-kept";
  const STATS_ATTR = "data-cgpt-lb-api-stats";
  const BYPASS_KEY = "cgptLongChatLoader.bypassOnce";
  const SETTINGS_EVENT = "cgpt-lb-settings";
  const STATS_EVENT = "cgpt-lb-trim-stats";
  const DEBUG_EVENT = "cgpt-lb-debug-log";
  const LOCATION_EVENT = "cgpt-lb-locationchange";
  const MAINTENANCE_EVENT = "cgpt-lb-maintenance";
  const ACTIVE_STATE_EVENT = "cgpt-lb-active-state";
  const CACHE_SUSPENDED_UNTIL_ATTR = "data-cgpt-lb-cache-suspended-until";
  const CACHE_SUSPENDED_REASON_ATTR = "data-cgpt-lb-cache-suspended-reason";
  const LIVE_TRIM_BYPASS_UNTIL_ATTR = "data-cgpt-lb-live-trim-bypass-until";
  const LIVE_TRIM_BYPASS_REASON_ATTR = "data-cgpt-lb-live-trim-bypass-reason";
  const SAFETY_LOCK_KEY = "cgptLongChatLoader.safetyLockUntil";
  const SAFETY_LOCK_ATTR = "data-cgpt-lb-safety-lock-until";
  const SAFE_BYPASS_REASON_ATTR = "data-cgpt-lb-safe-bypass-reason";
  const ACTIVE_REPLY_ATTR = "data-cgpt-lb-active-reply";
  const HIDDEN_CLASS = "cgpt-lb-hidden";
  const CONTAINED_CLASS = "cgpt-lb-contained";
  const LIVE_PROTECTED_CLASS = "cgpt-lb-live-protected";
  const LOAD_MORE_ID = "cgpt-lb-load-more-v152";
  const LEGACY_LOAD_MORE_ID = "cgpt-lb-load-more";
  const STATUS_ID = "cgpt-lb-status";
  const MATH_COPY_BUTTON_ID = "cgpt-lb-math-copy-v152";
  const MATH_COPY_TOAST_ID = "cgpt-lb-math-copy-toast-v152";
  const BRANCH_MAP_ID = "cgpt-lb-branch-map-v152";
  const BRANCH_TOGGLE_BUTTON_ID = "cgpt-lb-branch-toggle-v152";
  const NEXT_PROMPT_TOAST_ID = "cgpt-lb-next-prompt-toast-v152";
  const NEXT_PROMPT_PANEL_ID = "cgpt-lb-next-prompt-panel-v152";
  const NEXT_PROMPT_TOGGLE_BUTTON_ID = "cgpt-lb-next-prompt-toggle-v152";
  const RUNTIME_STYLE_ID = "cgpt-lb-runtime-style-v152";
  const TRIM_MARKER_KEY = "cgptLongChatLoader.trimMarkers.v1";
  const DEBUG_LOG_KEY = "cgptLongChatLoader.debugLog.v1";
  const BRANCH_PATH_KEY = "cgptLongChatLoader.branchPaths.v1";
  const BRANCH_PANEL_COLLAPSED_KEY = "cgptLongChatLoader.branchPanelCollapsed.v1";
  const NEXT_PROMPT_QUEUE_KEY = "cgptLongChatLoader.nextPromptQueue.v1";
  const NEXT_PROMPT_PANEL_COLLAPSED_KEY = "cgptLongChatLoader.nextPromptPanelCollapsed.v1";
  const TRIM_MARKER_TTL_MS = 6 * 60 * 60 * 1000;
  const MAX_TRIM_MARKERS = 20;
  const MAX_DEBUG_LOG_ENTRIES = 500;
  const MAX_DEBUG_ARG_LENGTH = 2000;
  const MAX_BRANCH_SNAPSHOTS = 24;
  const NEXT_PROMPT_CHECK_INTERVAL_MS = 1500;
  const ACTIVE_REPLY_PROTECTION_MS = 8 * 60 * 1000;
  const THINKING_PROTECTION_MS = 15 * 60 * 1000;
  const ACTIVE_REPLY_IDLE_GRACE_MS = 60 * 1000;
  const ACTIVE_REPLY_WATCHDOG_INTERVAL_MS = 2500;
  const ACTIVE_REPLY_MAX_SILENT_MS = 3 * 60 * 1000;
  const CHARACTER_DATA_SCAN_THROTTLE_MS = 1800;
  const SAFETY_LOCK_MS = 30 * 60 * 1000;
  const TURN_SELECTOR = [
    '[data-testid^="conversation-turn-"]',
    '[data-testid*="conversation-turn"]',
    '[class*="group/conversation-turn"]',
    '[data-turn-id]',
    '[data-message-id]'
  ].join(", ");
  const ROLE_SELECTOR = [
    "[data-message-author-role]",
    "[data-message-author]",
    "[data-author-role]"
  ].join(", ");
  const TURN_CLOSEST_SELECTOR = [
    '[data-testid^="conversation-turn-"]',
    '[data-testid*="conversation-turn"]',
    '[class*="group/conversation-turn"]',
    '[data-turn-id]',
    "article",
    '[role="article"]'
  ].join(", ");

  const MATH_NODE_SELECTOR = [
    ".katex-display",
    ".katex",
    "math",
    "mjx-container",
    ".MathJax",
    '[data-latex]',
    '[data-tex]',
    '[data-math]',
    '[data-testid*="math" i]',
    '[data-testid*="equation" i]',
    '[aria-label*="latex" i]',
    '[aria-label*="math" i]'
  ].join(", ");

  const LATEX_TEXT_PATTERN = /(?:\\\(|\\\[|\\begin\{|\$\$|(?<!\\)\$[^$\n]{1,500}(?<!\\)\$)/;

  const DEFAULT_SETTINGS = Object.freeze({
    languageMode: "ko",
    enabled: true,
    apiTrimEnabled: true,
    safeNetworkMode: true,
    visibleTurns: 2,
    loadMoreBatch: 2,
    prefetchBatches: 0,
    apiCacheEntries: 1,
    apiCacheMaxKb: 256,
    maintenanceEnabled: true,
    maintenanceIntervalSec: 60,
    autoCollapseLoadedMessages: true,
    cssContainmentEnabled: true,
    mathCopyEnabled: true,
    mathCopyAutoOnCopy: true,
    mathCopyShowSelectionButton: true,
    mathCopyPreferPngFallback: true,
    branchTrackerEnabled: true,
    branchTrackerShortcut: "Alt+B",
    nextPromptQueueEnabled: true,
    nextPromptQueueShortcut: "Tab",
    nextPromptQueuePanelShortcut: "Alt+Q",
    showStatus: false,
    debug: false
  });

  let settings = { ...DEFAULT_SETTINGS };
  let extraVisibleMessages = 0;
  let apiTrimmedCurrentConversation = false;
  let lastApiStats = null;
  let trimmedRouteKey = null;
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
  let maintenanceTimer = 0;
  let maintenanceScheduled = false;
  let lastMaintenanceAt = 0;
  let pendingRelevantMutations = 0;
  let lastObservedTurnTotal = 0;
  let lastCharacterDataScanAt = 0;
  let lastLoadMoreState = { visible: false, mode: "none", hiddenCount: 0, reason: "init", placement: "none" };
  let lastLoadMoreAt = 0;
  let liveReplyState = { active: false, reason: "init", lastSeenAt: 0, protectedCount: 0 };
  let lastActiveSignalAt = 0;
  let lastActiveSignalValue = false;
  let activeReplyWatchdogTimer = 0;
  let autoCollapseTimer = 0;
  let streamRecoverySince = 0;
  let debugLogWriteQueue = Promise.resolve();
  let mainWorldFallbackInjected = false;
  let mathCopyButton = null;
  let mathCopyToast = null;
  let mathSelectionTimer = 0;
  let lastMathSelectionInfo = null;
  let branchMapPanel = null;
  let branchToggleButton = null;
  let branchMapCollapsed = readBranchPanelCollapsed();
  let nextPromptToast = null;
  let nextPromptPanel = null;
  let nextPromptToggleButton = null;
  let nextPromptPanelCollapsed = readNextPromptPanelCollapsed();
  let nextPromptQueueTimer = 0;
  let nextPromptQueueState = readNextPromptQueueState();
  let nextPromptLastSentAt = 0;

  boot();

  async function boot() {
    settings = await loadSettings();
    hydrateTrimStateFromStorage();
    writeSettingsBridge();
    ensureMainWorldPatchFallback();
    listenForSettingsChanges();
    listenForPopupMetrics();
    listenForTrimStats();
    listenForDebugLogEvents();
    listenForComposerActivity();
    listenForBranchTrackerShortcut();
    listenForMathCopyEvents();
    startNextPromptQueueLoop();
    startNavigationWatcher();
    startMaintenanceLoop();
    window.addEventListener("cgpt-lb-force-scan", () => scheduleScan(true));

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        ensureObserverTarget();
        scheduleScan(true);
      }, { once: true });
    }

    ensureObserverTarget();
    scheduleScan(true);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        scheduleScan();
        scheduleMaintenance("visibility");
      }
    }, { passive: true });
    window.addEventListener("focus", () => scheduleMaintenance("focus"), { passive: true });
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
      languageMode: String(merged.languageMode || "").toLowerCase() === "en" ? "en" : "ko",
      enabled: Boolean(merged.enabled),
      apiTrimEnabled: Boolean(merged.apiTrimEnabled),
      safeNetworkMode: merged.safeNetworkMode === false ? false : true,
      visibleTurns: clampInt(merged.visibleTurns, 1, 20, DEFAULT_SETTINGS.visibleTurns),
      loadMoreBatch: clampInt(merged.loadMoreBatch, 1, 20, DEFAULT_SETTINGS.loadMoreBatch),
      prefetchBatches: clampInt(merged.prefetchBatches, 0, 30, DEFAULT_SETTINGS.prefetchBatches),
      apiCacheEntries: clampInt(cacheValue, 1, 2, DEFAULT_SETTINGS.apiCacheEntries),
      apiCacheMaxKb: clampInt(merged.apiCacheMaxKb, 128, 4096, DEFAULT_SETTINGS.apiCacheMaxKb),
      maintenanceEnabled: Boolean(merged.maintenanceEnabled),
      maintenanceIntervalSec: clampInt(merged.maintenanceIntervalSec, 10, 300, DEFAULT_SETTINGS.maintenanceIntervalSec),
      autoCollapseLoadedMessages: merged.autoCollapseLoadedMessages === false ? false : true,
      cssContainmentEnabled: Boolean(merged.cssContainmentEnabled ?? merged.contentVisibilityEnabled),
      mathCopyEnabled: merged.mathCopyEnabled === false ? false : true,
      mathCopyAutoOnCopy: merged.mathCopyAutoOnCopy === false ? false : true,
      mathCopyShowSelectionButton: merged.mathCopyShowSelectionButton === false ? false : true,
      mathCopyPreferPngFallback: merged.mathCopyPreferPngFallback === false ? false : true,
      branchTrackerEnabled: merged.branchTrackerEnabled === false ? false : true,
      branchTrackerShortcut: normalizeShortcut(merged.branchTrackerShortcut || DEFAULT_SETTINGS.branchTrackerShortcut),
      nextPromptQueueEnabled: merged.nextPromptQueueEnabled === false ? false : true,
      nextPromptQueueShortcut: normalizeShortcut(merged.nextPromptQueueShortcut || DEFAULT_SETTINGS.nextPromptQueueShortcut),
      nextPromptQueuePanelShortcut: normalizeShortcut(merged.nextPromptQueuePanelShortcut || DEFAULT_SETTINGS.nextPromptQueuePanelShortcut),
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

  function ensureMainWorldPatchFallback() {
    // Static MAIN-world injection at document_start is the primary path. If a tab was
    // already open when the extension was updated or Chrome skipped content scripts,
    // inject mainWorld.js as a page script so future conversation fetches are patched.
    const tryInject = () => {
      const root = document.documentElement;
      const detected = root && root.getAttribute("data-cgpt-lb-main-version");
      if (detected || mainWorldFallbackInjected || !settings.enabled || !settings.apiTrimEnabled) return;
      const runtime = typeof chrome !== "undefined" && chrome.runtime;
      if (!runtime || !runtime.getURL) return;
      try {
        const script = document.createElement("script");
        script.src = runtime.getURL("mainWorld.js");
        script.async = false;
        script.dataset.cgptLbFallbackMainWorld = CONTENT_VERSION;
        const target = document.documentElement || document.head || document.body;
        if (!target) return;
        target.appendChild(script);
        script.remove();
        mainWorldFallbackInjected = true;
        debugLog("content", "mainWorld fallback script injected");
      } catch (error) {
        debugLog("content", "mainWorld fallback injection failed", String(error && error.message ? error.message : error));
      }
    };
    setTimeout(tryInject, 80);
    setTimeout(tryInject, 800);
    setTimeout(tryInject, 2500);
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
      if (!settings.apiTrimEnabled) clearTrimMarkerForCurrentRoute();
      else hydrateTrimStateFromStorage();
      writeSettingsBridge();
      ensureObserverTarget();
      restartMaintenanceLoop();
      if (!settings.mathCopyEnabled || !settings.mathCopyShowSelectionButton) hideMathCopyButton();
      else scheduleMathSelectionCheck();
      if (!settings.branchTrackerEnabled) removeBranchMapPanel();
      else scheduleScan(true);
      if (!settings.nextPromptQueueEnabled) clearNextPromptQueue("disabled");
      scanAndApply();
    });
  }

  function listenForPopupMetrics() {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.onMessage) return;
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || typeof message.type !== "string") return false;

      if (message.type === "cgpt-lb-get-metrics") {
        try {
          scanAndApply();
          sendResponse(collectMetricsForPopup());
        } catch (error) {
          sendResponse({ ok: false, error: String(error && error.message ? error.message : error) });
        }
        return true;
      }

      if (message.type === "cgpt-lb-copy-selection-math") {
        copySelectedMathForOffice({ source: "popup", includePng: true })
          .then((result) => sendResponse(result))
          .catch((error) => sendResponse({ ok: false, error: String(error && error.message ? error.message : error) }));
        return true;
      }

      return false;
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

  function listenForDebugLogEvents() {
    window.addEventListener(DEBUG_EVENT, (event) => {
      if (!settings.debug) return;
      const detail = event && event.detail && typeof event.detail === "object" ? event.detail : {};
      const source = typeof detail.source === "string" && detail.source ? detail.source : "mainWorld";
      const args = Array.isArray(detail.args) ? detail.args : [detail.message || detail];
      persistDebugLog(source, args);
    });
  }

  function listenForComposerActivity() {
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target && target.closest ? target.closest("button") : null;
      if (!button) return;
      const testId = String(button.getAttribute("data-testid") || "").toLowerCase();
      const label = String(button.getAttribute("aria-label") || button.textContent || "").toLowerCase();
      if (testId.includes("send") || label.includes("send") || label.includes("전송") || label.includes("보내")) {
        markActiveReply("send-click", ACTIVE_REPLY_PROTECTION_MS);
        scheduleScan(true);
      }
      if (testId.includes("stop") || label.includes("stop") || label.includes("중지")) {
        markActiveReply("stop-control-visible", ACTIVE_REPLY_PROTECTION_MS);
        scheduleScan(true);
      }
    }, { passive: true, capture: true });

    document.addEventListener("keydown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || !target.closest) return;
      const composer = findComposerFromTarget(target);
      if (!composer) return;

      if (event.key === "Enter" && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
        markActiveReply("composer-enter", ACTIVE_REPLY_PROTECTION_MS);
      }

      if (settings.nextPromptQueueEnabled && eventMatchesShortcut(event, settings.nextPromptQueueShortcut)) {
        if (typeof event.preventDefault === "function") event.preventDefault();
        if (typeof event.stopPropagation === "function") event.stopPropagation();
        queueNextPromptFromComposer(composer, "shortcut");
      }
    }, { capture: true });
  }

  function listenForBranchTrackerShortcut() {
    document.addEventListener("keydown", (event) => {
      if (settings.branchTrackerEnabled && eventMatchesShortcut(event, settings.branchTrackerShortcut)) {
        if (typeof event.preventDefault === "function") event.preventDefault();
        if (typeof event.stopPropagation === "function") event.stopPropagation();
        toggleBranchMapPanel();
        return;
      }
      if (settings.nextPromptQueueEnabled && eventMatchesShortcut(event, settings.nextPromptQueuePanelShortcut)) {
        if (typeof event.preventDefault === "function") event.preventDefault();
        if (typeof event.stopPropagation === "function") event.stopPropagation();
        toggleNextPromptPanel();
      }
    }, { capture: true });
  }

  function toggleBranchMapPanel() {
    branchMapCollapsed = !branchMapCollapsed;
    writeBranchPanelCollapsed(branchMapCollapsed);
    scheduleScan(true);
    applyBranchMapCollapsedState();
  }

  function applyBranchMapCollapsedState() {
    if (branchMapPanel) {
      branchMapPanel.hidden = false;
      branchMapPanel.removeAttribute("hidden");
      if (branchMapCollapsed) {
        branchMapPanel.classList.add("cgpt-lb-branch-mini");
        branchMapPanel.setAttribute("role", "button");
        branchMapPanel.setAttribute("tabindex", "0");
      } else {
        branchMapPanel.classList.remove("cgpt-lb-branch-mini");
        branchMapPanel.removeAttribute("role");
        branchMapPanel.removeAttribute("tabindex");
      }
      branchMapPanel.setAttribute("aria-expanded", branchMapCollapsed ? "false" : "true");
    }
    if (branchToggleButton) {
      branchToggleButton.textContent = branchMapCollapsed ? "Graph" : "Hide branch";
      branchToggleButton.setAttribute("aria-expanded", branchMapCollapsed ? "false" : "true");
    }
  }

  function readBranchPanelCollapsed() {
    try {
      return sessionStorage.getItem(BRANCH_PANEL_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  }

  function writeBranchPanelCollapsed(collapsed) {
    try {
      sessionStorage.setItem(BRANCH_PANEL_COLLAPSED_KEY, collapsed ? "true" : "false");
    } catch {
      // Panel state is non-critical.
    }
  }

  function startNextPromptQueueLoop() {
    if (nextPromptQueueTimer) return;
    nextPromptQueueTimer = window.setInterval(() => processNextPromptQueue("interval"), NEXT_PROMPT_CHECK_INTERVAL_MS);
  }

  function stopNextPromptQueueLoop() {
    if (nextPromptQueueTimer) clearInterval(nextPromptQueueTimer);
    nextPromptQueueTimer = 0;
  }

  function startNavigationWatcher() {
    window.addEventListener(LOCATION_EVENT, checkNavigation, { passive: true });
    window.addEventListener("popstate", checkNavigation, { passive: true });
    window.addEventListener("hashchange", checkNavigation, { passive: true });
    navigationTimer = window.setInterval(checkNavigation, 3000);
  }

  function startMaintenanceLoop() {
    stopMaintenanceLoop();
    if (!settings.enabled || !settings.maintenanceEnabled) return;
    const intervalMs = settings.maintenanceIntervalSec * 1000;
    maintenanceTimer = window.setInterval(() => scheduleMaintenance("interval"), intervalMs);
  }

  function restartMaintenanceLoop() {
    startMaintenanceLoop();
    scheduleMaintenance("settings");
  }

  function stopMaintenanceLoop() {
    if (maintenanceTimer) clearInterval(maintenanceTimer);
    maintenanceTimer = 0;
    maintenanceScheduled = false;
  }

  function scheduleMaintenance(reason) {
    if (!settings.enabled || !settings.maintenanceEnabled || !isLikelyChatSurface() || document.hidden) return;
    if (maintenanceScheduled) return;
    maintenanceScheduled = true;

    const run = () => {
      maintenanceScheduled = false;
      runMaintenance(reason);
    };

    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 1500 });
    } else {
      window.setTimeout(run, 750);
    }
  }

  function runMaintenance(reason) {
    if (!settings.enabled || !settings.maintenanceEnabled || !isLikelyChatSurface()) return;
    lastMaintenanceAt = Date.now();

    if (isActiveReplyProtected()) {
      // Keep live cache/rewrite protection alive, but still re-apply DOM windowing.
      // A full conversation can be rendered while ChatGPT is streaming/recovering;
      // leaving maintenance disabled in that state makes every old message stay visible.
      dispatchActiveStateToMain(true, liveReplyState.reason || "active reply", ACTIVE_REPLY_PROTECTION_MS);
      compactVolatileState(reason);
      ensureObserverTarget();
      scanAndApply();
      return;
    }

    dispatchMaintenanceToMain(reason);
    compactVolatileState(reason);
    ensureObserverTarget();
    scanAndApply();
  }

  function dispatchMaintenanceToMain(reason) {
    try {
      window.dispatchEvent(new CustomEvent(MAINTENANCE_EVENT, {
        detail: JSON.stringify({ reason: String(reason || "interval"), timestamp: Date.now() })
      }));
    } catch {
      // Non-critical bridge failure.
    }
  }

  function compactVolatileState(reason) {
    if (!settings.apiTrimEnabled) {
      clearTrimMarkerForCurrentRoute();
    } else if (lastApiStats && !statsApplyToThisPage(lastApiStats)) {
      lastApiStats = null;
      apiTrimmedCurrentConversation = false;
      trimmedRouteKey = null;
    } else if (lastApiStats && isStaleTimestamp(lastApiStats.timestamp, 180_000)) {
      // Stale detailed stats should not drive popup estimates forever, but the
      // lightweight "this route was API-trimmed" marker must remain. Otherwise
      // the full-load button disappears a few minutes after cache/stat cleanup.
      lastApiStats = null;
      hydrateTrimStateFromStorage();
    } else if (!apiTrimmedCurrentConversation) {
      hydrateTrimStateFromStorage();
    }

    const currentTotal = lastDomMetrics.total || queryMessageTurns().length || 0;
    if (currentTotal < lastObservedTurnTotal) {
      extraVisibleMessages = Math.min(extraVisibleMessages, Math.max(0, currentTotal - settings.visibleTurns * 2));
    }
    if (settings.autoCollapseLoadedMessages && extraVisibleMessages > 0 && !isActiveReplyProtected()) {
      const collapseGraceMs = Math.max(30_000, settings.maintenanceIntervalSec * 1000);
      const canCollapse = !lastLoadMoreAt || Date.now() - lastLoadMoreAt >= collapseGraceMs;
      if (canCollapse) {
        debug("auto-collapsing previously loaded older messages", { reason, extraVisibleMessages, currentTotal });
        extraVisibleMessages = 0;
      }
    }
    lastObservedTurnTotal = currentTotal;
    pendingRelevantMutations = 0;
  }

  function scheduleAutoCollapseLoadedMessages(reason) {
    if (autoCollapseTimer) clearTimeout(autoCollapseTimer);
    if (!settings.enabled || !settings.maintenanceEnabled || !settings.autoCollapseLoadedMessages) return;
    const collapseGraceMs = Math.max(30_000, settings.maintenanceIntervalSec * 1000);
    autoCollapseTimer = window.setTimeout(() => {
      autoCollapseTimer = 0;
      scheduleMaintenance(reason || "load-more-auto-collapse");
    }, collapseGraceMs + 250);
  }

  function isStaleTimestamp(timestamp, ttlMs) {
    const value = Number(timestamp);
    return !value || Date.now() - value > ttlMs;
  }

  function checkNavigation() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    extraVisibleMessages = 0;
    apiTrimmedCurrentConversation = false;
    trimmedRouteKey = null;
    lastApiStats = null;
    lastDomMetrics = { total: 0, hidden: 0, visible: 0 };
    hideLoadMore();
    hydrateTrimStateFromStorage();
    ensureObserverTarget();
    scheduleScan(true);
    scheduleMaintenance("navigation");
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
          pendingRelevantMutations += 1;
          scheduleScan();
          return;
        }
      }
    });
    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-busy", "aria-label", "data-testid", "data-message-author-role", "data-streaming", "data-state", "class"]
    });
    debug("observer target", target.tagName || target.nodeName);
  }

  function stopObserver() {
    if (observer) observer.disconnect();
    observer = null;
    observerTarget = null;
  }

  function isRelevantMutation(mutation) {
    if (mutation.target instanceof Element && isExtensionUi(mutation.target)) return false;

    if (mutation.type === "characterData") {
      const parent = mutation.target && mutation.target.parentElement;
      if (parent && isInsideMessageOrComposer(parent)) {
        markActiveReply("stream-character-data", ACTIVE_REPLY_IDLE_GRACE_MS);
        return true;
      }
      return false;
    }

    if (mutation.type === "attributes") {
      const target = mutation.target instanceof Element ? mutation.target : null;
      if (!target || isExtensionUi(target)) return false;
      if (isStreamingIndicatorElement(target) || hasThinkingMarker(target) || isInsideMessageOrComposer(target)) {
        if ((matchesUnusualActivityText(target.textContent) || matchesUnusualActivityText(target.getAttribute("aria-label"))) && !isInsideUserTurnOrComposer(target)) {
          setSafetyLock("unusual-activity-notice", SAFETY_LOCK_MS);
          markActiveReply("unusual-activity-notice", SAFETY_LOCK_MS, 12);
        } else if (hasThinkingMarker(target) || matchesThinkingText(target.textContent) || matchesThinkingText(target.getAttribute("aria-label"))) {
          markActiveReply("thinking-attribute", THINKING_PROTECTION_MS, 12);
        } else if (isStreamingIndicatorElement(target)) {
          markActiveReply("stream-attribute", ACTIVE_REPLY_PROTECTION_MS, 8);
        }
        return true;
      }
      return false;
    }

    if (mutation.type !== "childList") return false;

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
    if (matchesUnusualActivityText(node.textContent) && !isInsideUserTurnOrComposer(node)) {
      setSafetyLock("unusual-activity-notice", SAFETY_LOCK_MS);
      markActiveReply("unusual-activity-notice", SAFETY_LOCK_MS, 12);
      return true;
    }
    if (hasThinkingMarker(node) || matchesThinkingText(node.textContent) || matchesThinkingText(node.getAttribute && node.getAttribute("aria-label"))) {
      markActiveReply("thinking-node", THINKING_PROTECTION_MS, 12);
      return true;
    }
    if (node.matches && (node.matches(TURN_SELECTOR) || node.matches(ROLE_SELECTOR))) return true;
    return Boolean(node.querySelector && node.querySelector(`${TURN_SELECTOR}, ${ROLE_SELECTOR}, [data-testid*="think"], [data-testid*="reason"], [aria-label*="think"], [aria-label*="reason"]`));
  }

  function isInsideMessageOrComposer(el) {
    if (!(el instanceof Element)) return false;
    if (isExtensionUi(el)) return false;
    return Boolean(el.closest(`${TURN_CLOSEST_SELECTOR}, [data-testid*="composer"], form, textarea, [contenteditable='true'], [role='textbox']`));
  }

  function isInsideUserTurnOrComposer(el) {
    if (!(el instanceof Element)) return false;
    const turn = el.closest && el.closest(TURN_CLOSEST_SELECTOR);
    if (turn && isLikelyUserTurn(turn)) return true;
    return Boolean(el.closest && el.closest('[data-testid*="composer"], form, textarea, [contenteditable="true"], [role="textbox"]'));
  }

  function isStreamingIndicatorElement(el) {
    if (!(el instanceof Element)) return false;
    if (isExtensionUi(el)) return false;
    const testId = String(el.getAttribute("data-testid") || "").toLowerCase();
    const aria = String(el.getAttribute("aria-label") || "").toLowerCase();
    const state = String(el.getAttribute("data-state") || "").toLowerCase();
    if (el.getAttribute("aria-busy") === "true") return true;
    if (el.getAttribute("data-streaming") === "true") return true;
    if (testId.includes("stop") || testId.includes("stream")) return true;
    if (aria.includes("stop") || aria.includes("중지") || aria.includes("generating") || aria.includes("생성")) return true;
    if (state.includes("stream") || state.includes("generat")) return true;
    return false;
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
    updateBranchPathTracker(turns);
    processNextPromptQueue("scan");
  }

  function updateBranchPathTracker(turns) {
    if (!settings.branchTrackerEnabled || !isLikelyChatSurface()) {
      removeBranchMapPanel();
      return;
    }

    const path = buildBranchPath(turns);
    if (!path.length) {
      removeBranchMapPanel();
      return;
    }

    const state = readBranchPathState();
    const routeKey = currentRouteKey();
    const routeState = state[routeKey] && typeof state[routeKey] === "object"
      ? state[routeKey]
      : { snapshots: [] };
    const ids = path.map((node) => node.id);
    const last = Array.isArray(routeState.snapshots) ? routeState.snapshots[routeState.snapshots.length - 1] : null;
    if (!last || !arraysEqual(last.ids, ids)) {
      routeState.snapshots = (Array.isArray(routeState.snapshots) ? routeState.snapshots : [])
        .concat({ ids, nodes: path.map(compactBranchNode), at: Date.now() })
        .slice(-MAX_BRANCH_SNAPSHOTS);
    }
    routeState.current = ids;
    routeState.currentNodes = path.map(compactBranchNode);
    routeState.updatedAt = Date.now();
    state[routeKey] = routeState;
    writeBranchPathState(state);
    renderBranchMap(path, routeState);
  }

  function buildBranchPath(turns) {
    return (Array.isArray(turns) ? turns : []).map((turn, index) => {
      const role = normalizeRole(getTurnRole(turn)) || "message";
      const messageId = readTurnId(turn, index, role);
      return {
        id: messageId,
        role,
        index,
        preview: compactTurnPreview(turn, role)
      };
    }).filter((node) => node.id);
  }

  function compactTurnPreview(turn, role) {
    let raw = String(turn && turn.textContent || "");
    const rolePrefix = String(role || "").toLowerCase();
    if (rolePrefix && raw.toLowerCase().startsWith(rolePrefix)) raw = raw.slice(rolePrefix.length);
    raw = raw.replace(/\b(user|assistant|tool|system)\b/ig, " ");
    if (role === "user") return summarizePromptTitle(raw);
    return compactText(raw, 38);
  }

  function compactBranchNode(node) {
    const role = String(node && node.role || "message");
    const preview = role === "user"
      ? summarizePromptTitle(node && node.preview)
      : compactText(node && node.preview, 64);
    return {
      id: String(node && node.id || ""),
      role,
      index: Number(node && node.index) || 0,
      preview
    };
  }

  function summarizePromptTitle(value) {
    let text = String(value || "")
      .replace(/```[\s\S]*?```/g, " code ")
      .replace(/`[^`]*`/g, " code ")
      .replace(/https?:\/\/\S+/g, " link ")
      .replace(/\s+/g, " ")
      .trim();
    text = text.replace(/^(please|can you|could you|would you|help me|내가|제가|혹시|제발)\s+/i, "");
    const sentence = text.split(/(?<=[.!?。！？])\s+|[;\n\r]+/).map((part) => part.trim()).find(Boolean);
    text = sentence || text;
    const koreanAction = text.match(/(?:현재|해당|그리고|또한|이제)?\s*([^.!?\n\r]{4,42}?(?:해줘|하도록해|하게해|보여줘|만들어줘|수정|개선|추가|삭제|정리|반영))/);
    if (koreanAction && koreanAction[1]) text = koreanAction[1];
    return compactText(text, 34);
  }

  function readTurnId(turn, index, role) {
    if (!(turn instanceof HTMLElement)) return `${role}-${index}`;
    const direct = [
      turn.getAttribute("data-message-id"),
      turn.getAttribute("data-turn-id"),
      turn.getAttribute("data-testid")
    ].find(Boolean);
    if (direct) return String(direct);
    const nested = turn.querySelector && turn.querySelector("[data-message-id], [data-turn-id]");
    const nestedId = nested && (nested.getAttribute("data-message-id") || nested.getAttribute("data-turn-id"));
    if (nestedId) return String(nestedId);
    return `${role}-${index}-${hashString(compactText(turn.textContent, 80))}`;
  }

  function normalizeRole(role) {
    const value = String(role || "").toLowerCase();
    if (value.includes("user")) return "user";
    if (value.includes("assistant")) return "assistant";
    if (value.includes("tool")) return "tool";
    if (value.includes("system")) return "system";
    return value || "message";
  }

  function renderBranchMap(path, routeState) {
    ensureRuntimeStyle();
    if (!document.body) return;
    ensureBranchToggleButton();
    if (!branchMapPanel || !document.documentElement.contains(branchMapPanel)) {
      branchMapPanel = document.createElement("aside");
      branchMapPanel.id = BRANCH_MAP_ID;
      branchMapPanel.dataset.cgptLbUi = "true";
      branchMapPanel.setAttribute("aria-label", "ChatGPT branch path");
      branchMapPanel.addEventListener("click", (event) => {
        if (!branchMapCollapsed) return;
        if (event.target !== branchMapPanel && !(event.target instanceof Element && event.target.closest(".cgpt-lb-branch-mini-graph"))) return;
        toggleBranchMapPanel();
      });
      branchMapPanel.addEventListener("keydown", (event) => {
        if (!branchMapCollapsed || (event.key !== "Enter" && event.key !== " ")) return;
        if (typeof event.preventDefault === "function") event.preventDefault();
        toggleBranchMapPanel();
      });
      document.body.appendChild(branchMapPanel);
    }

    const branchSummaries = buildBranchSummaries(path, routeState);
    const summaryRows = buildBranchSummaryRows(branchSummaries);
    branchMapPanel.textContent = "";

    if (branchMapCollapsed) {
      renderBranchMiniOverlay(branchMapPanel, summaryRows);
      applyBranchMapCollapsedState();
      return;
    }

    const header = document.createElement("div");
    header.className = "cgpt-lb-branch-header";
    const title = document.createElement("div");
    title.className = "cgpt-lb-branch-title";
    title.textContent = "Branch tree";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "cgpt-lb-branch-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Hide branch panel");
    close.addEventListener("click", toggleBranchMapPanel);
    header.append(title, close);
    branchMapPanel.appendChild(header);

    const list = document.createElement("div");
    list.className = "cgpt-lb-branch-compare";
    if (!summaryRows.length) {
      const empty = document.createElement("div");
      empty.className = "cgpt-lb-branch-empty";
      empty.textContent = "분기 없음";
      list.appendChild(empty);
      branchMapPanel.appendChild(list);
      applyBranchMapCollapsedState();
      return;
    }

    const graph = document.createElement("div");
    graph.className = "cgpt-lb-branch-graph";
    const detail = document.createElement("button");
    detail.type = "button";
    detail.className = "cgpt-lb-branch-detail";
    detail.title = "Click to jump to this conversation point";
    detail.addEventListener("click", () => {
      const ids = String(detail.dataset.targetIds || "").split("\t").filter(Boolean);
      jumpToBranchTargets(ids);
    });

    const renderSelected = (row) => {
      if (!row) return;
      detail.dataset.targetIds = row.targetIds.join("\t");
      detail.textContent = `분기 전: ${row.before || "-"}\n시작: ${row.start || "-"}`;
      for (const item of graph.querySelectorAll(".cgpt-lb-branch-split")) {
        item.classList.remove("cgpt-lb-branch-split-active");
      }
      const active = graph.querySelector(`[data-branch-index="${String(row.index)}"]`);
      if (active) active.classList.add("cgpt-lb-branch-split-active");
    };

    graph.appendChild(renderBranchGraphSvg(summaryRows, {
      compact: false,
      onSelect: renderSelected
    }));

    list.append(graph, detail);
    branchMapPanel.appendChild(list);
    renderSelected(summaryRows[0]);
    applyBranchMapCollapsedState();
  }

  function renderBranchMiniOverlay(panel, summaryRows) {
    const mini = document.createElement("div");
    mini.className = "cgpt-lb-branch-mini-graph";
    mini.setAttribute("aria-label", "Open branch tree");
    const rows = Array.isArray(summaryRows) ? summaryRows.slice(0, 5) : [];
    if (!rows.length) {
      const empty = document.createElement("span");
      empty.className = "cgpt-lb-branch-mini-empty";
      empty.textContent = "○";
      mini.appendChild(empty);
    }
    else mini.appendChild(renderBranchGraphSvg(rows, { compact: true }));
    panel.appendChild(mini);
  }

  function renderBranchGraphSvg(summaryRows, options = {}) {
    const rows = Array.isArray(summaryRows) ? summaryRows : [];
    const compact = Boolean(options.compact);
    const xMain = compact ? 11 : 14;
    const xBranch = compact ? 34 : 46;
    const yStep = compact ? 18 : 27;
    const pad = compact ? 8 : 11;
    const width = compact ? 46 : 62;
    const height = Math.max(compact ? 24 : 34, pad * 2 + Math.max(0, rows.length - 1) * yStep);
    const svg = createSvgElement("svg");
    svg.setAttribute("class", compact ? "cgpt-lb-branch-svg cgpt-lb-branch-svg-mini" : "cgpt-lb-branch-svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("aria-hidden", "true");

    if (rows.length > 1) {
      const trunk = createSvgElement("path");
      trunk.setAttribute("class", "cgpt-lb-branch-edge cgpt-lb-branch-edge-trunk");
      trunk.setAttribute("d", `M ${xMain} ${pad} L ${xMain} ${pad + (rows.length - 1) * yStep}`);
      svg.appendChild(trunk);
    }

    rows.forEach((row, index) => {
      const y = pad + index * yStep;
      const group = createSvgElement("g");
      group.setAttribute("class", "cgpt-lb-branch-split");
      group.setAttribute("data-branch-index", String(row.index));
      if (!compact) {
        group.setAttribute("tabindex", "0");
        group.setAttribute("role", "button");
      }
      group.setAttribute("aria-label", `분기 전 ${row.before || "-"} 시작 ${row.start || "-"}`);
      if (typeof options.onSelect === "function") {
        group.addEventListener("click", (event) => {
          if (typeof event.stopPropagation === "function") event.stopPropagation();
          options.onSelect(row);
        });
        group.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (typeof event.preventDefault === "function") event.preventDefault();
          options.onSelect(row);
        });
      }

      const hit = createSvgElement("rect");
      hit.setAttribute("class", "cgpt-lb-branch-hit");
      hit.setAttribute("x", String(Math.min(xMain, xBranch) - 7));
      hit.setAttribute("y", String(y - 10));
      hit.setAttribute("width", String(Math.abs(xBranch - xMain) + 14));
      hit.setAttribute("height", "20");
      hit.setAttribute("rx", "6");
      group.appendChild(hit);

      const edge = createSvgElement("path");
      edge.setAttribute("class", "cgpt-lb-branch-edge cgpt-lb-branch-edge-fork");
      const mid = Math.round((xMain + xBranch) / 2);
      edge.setAttribute("d", `M ${xMain} ${y} C ${mid} ${y - 1}, ${mid} ${y + 1}, ${xBranch} ${y}`);
      group.appendChild(edge);

      const before = createSvgElement("circle");
      before.setAttribute("class", "cgpt-lb-branch-node cgpt-lb-branch-node-before");
      before.setAttribute("cx", String(xMain));
      before.setAttribute("cy", String(y));
      before.setAttribute("r", compact ? "3.2" : "4");
      group.appendChild(before);

      const after = createSvgElement("circle");
      after.setAttribute("class", "cgpt-lb-branch-node cgpt-lb-branch-node-after");
      after.setAttribute("cx", String(xBranch));
      after.setAttribute("cy", String(y));
      after.setAttribute("r", compact ? "3.2" : "4");
      group.appendChild(after);

      svg.appendChild(group);
    });

    return svg;
  }

  function createSvgElement(tagName) {
    if (document.createElementNS) return document.createElementNS("http://www.w3.org/2000/svg", tagName);
    return document.createElement(tagName);
  }

  function removeBranchMapPanel() {
    if (branchMapPanel && branchMapPanel.parentElement) branchMapPanel.remove();
    if (branchToggleButton && branchToggleButton.parentElement) branchToggleButton.remove();
    branchMapPanel = null;
    branchToggleButton = null;
  }

  function ensureBranchToggleButton() {
    if (!document.body) return;
    if (!branchToggleButton || !document.documentElement.contains(branchToggleButton)) {
      branchToggleButton = document.createElement("button");
      branchToggleButton.id = BRANCH_TOGGLE_BUTTON_ID;
      branchToggleButton.type = "button";
      branchToggleButton.dataset.cgptLbUi = "true";
      branchToggleButton.title = `Toggle branch panel (${settings.branchTrackerShortcut})`;
      branchToggleButton.addEventListener("click", toggleBranchMapPanel);
      document.body.appendChild(branchToggleButton);
    }
    branchToggleButton.hidden = false;
    branchToggleButton.removeAttribute("hidden");
    applyBranchMapCollapsedState();
  }

  function buildBranchSummaryRows(branchSummaries) {
    return Object.entries(branchSummaries || {})
      .map(([index, summary]) => ({
        index: Number(index),
        depth: Number(index) + 1,
        before: summary && summary.before,
        start: summary && summary.start,
        targetIds: Array.isArray(summary && summary.targetIds) ? summary.targetIds : []
      }))
      .filter((row) => row.before || row.start)
      .sort((a, b) => a.depth - b.depth);
  }

  function buildBranchSummaries(path, routeState) {
    const summaries = {};
    const snapshots = routeState && Array.isArray(routeState.snapshots) ? routeState.snapshots : [];
    const currentNodes = path.map(compactBranchNode);
    const byIndex = new Map();

    for (const snapshot of snapshots.concat({ nodes: currentNodes, ids: currentNodes.map((node) => node.id) })) {
      const nodes = Array.isArray(snapshot.nodes)
        ? snapshot.nodes
        : (Array.isArray(snapshot.ids) ? snapshot.ids.map((id, index) => ({ id, index, role: "message", preview: "" })) : []);
      nodes.forEach((node, index) => {
        if (!byIndex.has(index)) byIndex.set(index, new Map());
        byIndex.get(index).set(node.id, nodes);
      });
    }

    for (const [index, variants] of byIndex) {
      if (variants.size < 2) continue;
      const starts = [];
      const targetIds = [];
      for (const nodes of variants.values()) {
        const startNode = findFirstUserPromptNodeAtOrAfter(nodes, index);
        if (startNode && startNode.preview) starts.push(startNode.preview);
        if (startNode && startNode.id) targetIds.push(startNode.id);
      }
      const beforeNode = findPreviousUserPromptNode(currentNodes, index - 1);
      if (beforeNode && beforeNode.id) targetIds.push(beforeNode.id);
      summaries[index] = {
        before: beforeNode && beforeNode.preview || "",
        start: compactText(uniqueStrings(starts).join(" / "), 80),
        targetIds: uniqueStrings(targetIds)
      };
    }
    return summaries;
  }

  function findPreviousUserPromptNode(nodes, startIndex) {
    for (let i = Math.min(startIndex, nodes.length - 1); i >= 0; i -= 1) {
      if (nodes[i] && nodes[i].role === "user" && nodes[i].preview) return nodes[i];
    }
    return null;
  }

  function findFirstUserPromptNodeAtOrAfter(nodes, startIndex) {
    for (let i = Math.max(0, startIndex); i < nodes.length; i += 1) {
      if (nodes[i] && nodes[i].role === "user" && nodes[i].preview) return nodes[i];
    }
    return null;
  }

  function jumpToBranchTargets(targetIds) {
    const ids = Array.isArray(targetIds) ? targetIds : [];
    for (const id of ids) {
      const target = findTurnElementByBranchId(id);
      if (!target) continue;
      showElement(target);
      removeContainment(target);
      try {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {
        try {
          target.scrollIntoView();
        } catch {
          // Non-critical navigation failure.
        }
      }
      target.setAttribute("data-cgpt-lb-branch-jump", "true");
      setTimeout(() => {
        try {
          target.removeAttribute("data-cgpt-lb-branch-jump");
        } catch {
          // Non-critical highlight cleanup.
        }
      }, 1600);
      return true;
    }
    showNextPromptToast("Branch target is not visible in this session.");
    return false;
  }

  function findTurnElementByBranchId(id) {
    const targetId = String(id || "");
    if (!targetId) return null;
    const scope = getMessageScope() || document.body || document.documentElement;
    const escaped = cssStringEscape(targetId);
    const direct = safeQueryAll(`[data-message-id="${escaped}"], [data-turn-id="${escaped}"], [data-testid="${escaped}"]`, scope)[0];
    if (direct) return resolveTurnFromMessageIdNode(direct, scope) || normalizeTurnElement(direct, scope);

    const turns = queryMessageTurns().slice(-80);
    for (const turn of turns) {
      if (readTurnId(turn, Number(turn.dataset && turn.dataset.cgptLbIndex) || 0, getTurnRole(turn)) === targetId) return turn;
      if (turn.getAttribute("data-message-id") === targetId || turn.getAttribute("data-turn-id") === targetId || turn.getAttribute("data-testid") === targetId) return turn;
      const nested = turn.querySelector && turn.querySelector("[data-message-id], [data-turn-id]");
      if (nested && (nested.getAttribute("data-message-id") === targetId || nested.getAttribute("data-turn-id") === targetId)) return turn;
    }
    return null;
  }

  function cssStringEscape(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function uniqueStrings(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function formatRoleLabel(role) {
    if (role === "user") return "Prompt";
    if (role === "assistant") return "Reply";
    if (role === "tool") return "Tool";
    return "Node";
  }

  function readBranchPathState() {
    try {
      const raw = sessionStorage.getItem(BRANCH_PATH_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeBranchPathState(state) {
    try {
      sessionStorage.setItem(BRANCH_PATH_KEY, JSON.stringify(state || {}));
    } catch {
      // Branch tracking is best-effort and local to the current tab.
    }
  }

  function queueNextPromptFromComposer(composer, source) {
    const prompt = readComposerText(composer);
    if (!prompt) {
      showNextPromptToast("No prompt to queue.");
      return false;
    }
    const state = normalizeNextPromptQueueState(nextPromptQueueState);
    state.items.push({
      id: `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      prompt,
      routeKey: currentRouteKey(),
      source: String(source || "shortcut"),
      queuedAt: Date.now()
    });
    state.queued = state.items.length > 0;
    nextPromptQueueState = state;
    writeNextPromptQueueState(nextPromptQueueState);
    renderNextPromptPanel();
    showNextPromptToast(describeNextPromptQueueWait());
    processNextPromptQueue("queue");
    return true;
  }

  function processNextPromptQueue(reason) {
    if (!settings.nextPromptQueueEnabled || !isLikelyChatSurface()) return;
    const state = normalizeNextPromptQueueState(nextPromptQueueState && nextPromptQueueState.queued ? nextPromptQueueState : readNextPromptQueueState());
    const initialQueueLength = state.items.length;
    while (state.items.length && !String(state.items[0].prompt || "").trim()) state.items.shift();
    if (!state.items.length) {
      clearNextPromptQueue("empty-prompt");
      return;
    }
    if (nextPromptLastSentAt && Date.now() - nextPromptLastSentAt < 1200) return;
    state.queued = true;
    nextPromptQueueState = state;
    if (state.items.length !== initialQueueLength) writeNextPromptQueueState(state);
    renderNextPromptPanel();
    const currentItem = state.items[0];

    const composer = findComposer();
    if (!composer) {
      showNextPromptToast("Next prompt queued · waiting for composer");
      return;
    }

    if (isReplyActiveInDom()) {
      showNextPromptToast("Next prompt queued · waiting for response");
      return;
    }

    if (hasRateLimitNotice()) {
      showNextPromptToast("Next prompt queued · waiting for request limit");
      return;
    }

    if (currentItem.prompt) writeComposerText(composer, currentItem.prompt);
    const prompt = readComposerText(composer);
    if (!prompt) {
      showNextPromptToast("Next prompt queued · waiting for text");
      return;
    }

    const sendButton = findSendButton();
    if (!sendButton) {
      showNextPromptToast("Next prompt queued · waiting for send button");
      return;
    }

    debug("queued prompt send", { reason, promptLength: prompt.length });
    sendButton.click();
    nextPromptLastSentAt = Date.now();
    dequeueNextPromptItem("sent");
    markActiveReply("queued-next-prompt-send", ACTIVE_REPLY_PROTECTION_MS);
    showNextPromptToast("Queued prompt sent.");
  }

  function dequeueNextPromptItem(reason) {
    const state = normalizeNextPromptQueueState(nextPromptQueueState);
    state.items.shift();
    state.queued = state.items.length > 0;
    state.updatedAt = Date.now();
    state.reason = String(reason || "dequeue");
    nextPromptQueueState = state;
    if (state.items.length) writeNextPromptQueueState(state);
    else clearNextPromptQueue(reason || "empty");
    renderNextPromptPanel();
  }

  function isReplyActiveInDom() {
    if (findStopControl(getMessageScope())) return true;
    return Boolean(detectActiveReplyNow(queryMessageTurns()).active);
  }

  function findComposerFromTarget(target) {
    if (!(target instanceof Element) || !target.closest) return null;
    const composer = target.closest("textarea, [contenteditable='true'], [role='textbox']");
    return composer instanceof HTMLElement ? composer : null;
  }

  function findComposer() {
    return safeQueryAll("textarea, [contenteditable='true'], [role='textbox']", document.body || document.documentElement)
      .filter((el) => !isExtensionUi(el))
      .find((el) => !el.disabled && el.getAttribute("aria-disabled") !== "true") || null;
  }

  function readComposerText(composer) {
    if (!(composer instanceof HTMLElement)) return "";
    if ("value" in composer && typeof composer.value === "string") return composer.value.trim();
    return String(composer.textContent || "").trim();
  }

  function writeComposerText(composer, text) {
    if (!(composer instanceof HTMLElement)) return;
    const value = String(text || "");
    composer.focus();
    if ("value" in composer && typeof composer.value === "string") composer.value = value;
    else composer.textContent = value;
    try {
      composer.dispatchEvent(new Event("input", { bubbles: true }));
    } catch {
      // Non-critical input notification failure.
    }
  }

  function findSendButton() {
    const buttons = safeQueryAll("button", document.body || document.documentElement);
    return buttons.find((button) => {
      if (isExtensionUi(button) || button.disabled || button.getAttribute("aria-disabled") === "true") return false;
      const testId = String(button.getAttribute("data-testid") || "").toLowerCase();
      const label = String(button.getAttribute("aria-label") || button.textContent || "").toLowerCase();
      if (testId.includes("stop") || label.includes("stop") || label.includes("중지")) return false;
      return testId.includes("send") || label.includes("send") || label.includes("전송") || label.includes("보내");
    }) || null;
  }

  function hasRateLimitNotice() {
    const text = collectNonExtensionText(document.body || document.documentElement).toLowerCase();
    return /too many requests|rate limit|request limit|try again later|temporarily unavailable|잠시 후|너무 많은 요청|요청이 너무 많|속도 제한/.test(text);
  }

  function collectNonExtensionText(root) {
    if (!(root instanceof Element)) return "";
    const parts = [];
    const visit = (node) => {
      if (!(node instanceof Element) || isExtensionUi(node)) return;
      const own = Array.from(node.childNodes || [])
        .filter((child) => !(child instanceof Element))
        .map((child) => child.textContent || "")
        .join(" ");
      if (own) parts.push(own);
      for (const child of Array.from(node.children || [])) visit(child);
    };
    visit(root);
    return parts.join(" ") || String(root.textContent || "");
  }

  function describeNextPromptQueueWait() {
    if (isReplyActiveInDom()) return "Next prompt queued · waiting for response";
    if (hasRateLimitNotice()) return "Next prompt queued · waiting for request limit";
    return "Next prompt queued";
  }

  function showNextPromptToast(message) {
    ensureRuntimeStyle();
    if (!document.body) return;
    if (!nextPromptToast || !document.documentElement.contains(nextPromptToast)) {
      nextPromptToast = document.createElement("div");
      nextPromptToast.id = NEXT_PROMPT_TOAST_ID;
      nextPromptToast.dataset.cgptLbUi = "true";
      nextPromptToast.setAttribute("role", "status");
      nextPromptToast.setAttribute("aria-live", "polite");
      document.body.appendChild(nextPromptToast);
    }
    nextPromptToast.textContent = String(message || "");
    nextPromptToast.hidden = false;
    nextPromptToast.removeAttribute("hidden");
    clearTimeout(showNextPromptToast.timer);
    showNextPromptToast.timer = setTimeout(hideNextPromptToast, 2500);
  }

  function hideNextPromptToast() {
    if (nextPromptToast) {
      nextPromptToast.hidden = true;
      nextPromptToast.setAttribute("hidden", "");
    }
  }

  function readNextPromptQueueState() {
    try {
      const raw = sessionStorage.getItem(NEXT_PROMPT_QUEUE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return normalizeNextPromptQueueState(parsed);
    } catch {
      return { queued: false };
    }
  }

  function writeNextPromptQueueState(state) {
    try {
      sessionStorage.setItem(NEXT_PROMPT_QUEUE_KEY, JSON.stringify(normalizeNextPromptQueueState(state)));
    } catch {
      // Keep the in-memory queue if sessionStorage is unavailable.
    }
  }

  function clearNextPromptQueue(reason) {
    const shouldRefreshPanel = Boolean(nextPromptPanel && document.documentElement && document.documentElement.contains(nextPromptPanel));
    nextPromptQueueState = { queued: false, items: [], clearedAt: Date.now(), reason: String(reason || "clear") };
    try {
      sessionStorage.removeItem(NEXT_PROMPT_QUEUE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    if (shouldRefreshPanel) renderNextPromptPanel();
  }

  function normalizeNextPromptQueueState(value) {
    const source = value && typeof value === "object" ? value : {};
    let items = Array.isArray(source.items) ? source.items : [];
    if (!items.length && source.queued && source.prompt) {
      items = [{
        id: `legacy-${Number(source.queuedAt) || Date.now()}`,
        prompt: source.prompt,
        routeKey: source.routeKey || currentRouteKey(),
        source: source.source || "legacy",
        queuedAt: source.queuedAt || Date.now()
      }];
    }
    const normalized = items
      .map((item, index) => ({
        id: String(item && item.id || `q-${index}`),
        prompt: String(item && item.prompt || ""),
        routeKey: String(item && item.routeKey || currentRouteKey()),
        source: String(item && item.source || "shortcut"),
        queuedAt: Number(item && item.queuedAt) || Date.now()
      }));
    return {
      ...source,
      queued: normalized.length > 0,
      items: normalized
    };
  }

  function renderNextPromptPanel() {
    const state = normalizeNextPromptQueueState(nextPromptQueueState);
    if (!settings.nextPromptQueueEnabled) {
      hideNextPromptPanelIfEmpty();
      return;
    }
    ensureRuntimeStyle();
    if (!document.body) return;
    ensureNextPromptToggleButton(state.items.length);
    if (!nextPromptPanel || !document.documentElement.contains(nextPromptPanel)) {
      nextPromptPanel = document.createElement("section");
      nextPromptPanel.id = NEXT_PROMPT_PANEL_ID;
      nextPromptPanel.dataset.cgptLbUi = "true";
      nextPromptPanel.setAttribute("aria-label", "Queued prompts");
      nextPromptPanel.addEventListener("click", (event) => {
        if (!nextPromptPanelCollapsed) return;
        if (event.target !== nextPromptPanel && !(event.target instanceof Element && event.target.closest(".cgpt-lb-next-mini"))) return;
        toggleNextPromptPanel();
      });
      nextPromptPanel.addEventListener("keydown", (event) => {
        if (!nextPromptPanelCollapsed || (event.key !== "Enter" && event.key !== " ")) return;
        if (typeof event.preventDefault === "function") event.preventDefault();
        toggleNextPromptPanel();
      });
      document.body.appendChild(nextPromptPanel);
    }
    nextPromptPanel.textContent = "";

    if (nextPromptPanelCollapsed) {
      renderNextPromptMiniOverlay(nextPromptPanel, state.items.length);
      applyNextPromptPanelCollapsedState();
      return;
    }

    const header = document.createElement("div");
    header.className = "cgpt-lb-next-panel-header";
    const title = document.createElement("div");
    title.className = "cgpt-lb-next-panel-title";
    title.textContent = `Queued prompts (${state.items.length})`;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "cgpt-lb-next-panel-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Hide queued prompts");
    close.addEventListener("click", toggleNextPromptPanel);
    header.append(title, close);
    nextPromptPanel.appendChild(header);

    if (!state.items.length) {
      const empty = document.createElement("div");
      empty.className = "cgpt-lb-next-empty";
      empty.textContent = "Queue 비어 있음";
      nextPromptPanel.appendChild(empty);
    }

    state.items.forEach((item, index) => {
      const row = document.createElement("label");
      row.className = "cgpt-lb-next-prompt-row";
      const meta = document.createElement("span");
      meta.className = "cgpt-lb-next-prompt-meta";
      meta.textContent = index === 0 ? "Next to send" : `Queue ${index + 1}`;
      const textarea = document.createElement("textarea");
      textarea.value = item.prompt;
      textarea.rows = Math.min(5, Math.max(2, Math.ceil(item.prompt.length / 48)));
      textarea.dataset.queueId = item.id;
      textarea.addEventListener("input", () => updateQueuedPrompt(item.id, textarea.value));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cgpt-lb-next-prompt-remove";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => removeQueuedPrompt(item.id));
      row.append(meta, textarea, remove);
      nextPromptPanel.appendChild(row);
    });
    applyNextPromptPanelCollapsedState();
  }

  function renderNextPromptMiniOverlay(panel, count) {
    const mini = document.createElement("div");
    mini.className = "cgpt-lb-next-mini";
    mini.setAttribute("aria-label", "Open queued prompts");
    const openLabel = document.createElement("span");
    openLabel.className = "cgpt-lb-next-mini-open";
    openLabel.textContent = "Queue 열어보기";
    const countText = document.createElement("span");
    countText.className = "cgpt-lb-next-mini-count";
    countText.textContent = `Queue ${count || 0}`;
    const bars = document.createElement("span");
    bars.className = "cgpt-lb-next-mini-bars";
    const visible = Math.max(1, Math.min(4, count || 1));
    for (let index = 0; index < visible; index += 1) {
      const bar = document.createElement("span");
      bar.textContent = "";
      bars.appendChild(bar);
    }
    const graph = document.createElement("span");
    graph.className = "cgpt-lb-next-mini-graph";
    graph.append(countText, bars);
    mini.append(openLabel, graph);
    panel.appendChild(mini);
  }

  function updateQueuedPrompt(id, prompt) {
    const state = normalizeNextPromptQueueState(nextPromptQueueState);
    const item = state.items.find((candidate) => candidate.id === id);
    if (!item) return;
    item.prompt = String(prompt || "");
    state.queued = state.items.length > 0;
    nextPromptQueueState = state;
    if (state.items.length) writeNextPromptQueueState(state);
    else clearNextPromptQueue("edited-empty");
  }

  function removeQueuedPrompt(id) {
    const state = normalizeNextPromptQueueState(nextPromptQueueState);
    state.items = state.items.filter((item) => item.id !== id);
    state.queued = state.items.length > 0;
    nextPromptQueueState = state;
    if (state.items.length) writeNextPromptQueueState(state);
    else clearNextPromptQueue("removed");
    renderNextPromptPanel();
  }

  function ensureNextPromptToggleButton(count) {
    if (!document.body) return;
    if (!nextPromptToggleButton || !document.documentElement.contains(nextPromptToggleButton)) {
      nextPromptToggleButton = document.createElement("button");
      nextPromptToggleButton.id = NEXT_PROMPT_TOGGLE_BUTTON_ID;
      nextPromptToggleButton.type = "button";
      nextPromptToggleButton.dataset.cgptLbUi = "true";
      nextPromptToggleButton.title = `Toggle queued prompts (${settings.nextPromptQueuePanelShortcut})`;
      nextPromptToggleButton.addEventListener("click", toggleNextPromptPanel);
      document.body.appendChild(nextPromptToggleButton);
    }
    nextPromptToggleButton.hidden = false;
    nextPromptToggleButton.removeAttribute("hidden");
    nextPromptToggleButton.textContent = `Queue ${count || 0}`;
    applyNextPromptPanelCollapsedState();
  }

  function toggleNextPromptPanel() {
    const hasPanel = Boolean(nextPromptPanel && document.documentElement && document.documentElement.contains(nextPromptPanel));
    nextPromptPanelCollapsed = hasPanel ? !nextPromptPanelCollapsed : false;
    writeNextPromptPanelCollapsed(nextPromptPanelCollapsed);
    renderNextPromptPanel();
    applyNextPromptPanelCollapsedState();
  }

  function applyNextPromptPanelCollapsedState() {
    if (nextPromptPanel) {
      nextPromptPanel.hidden = false;
      nextPromptPanel.removeAttribute("hidden");
      if (nextPromptPanelCollapsed) {
        nextPromptPanel.classList.add("cgpt-lb-next-mini-panel");
        nextPromptPanel.setAttribute("role", "button");
        nextPromptPanel.setAttribute("tabindex", "0");
      } else {
        nextPromptPanel.classList.remove("cgpt-lb-next-mini-panel");
        nextPromptPanel.removeAttribute("role");
        nextPromptPanel.removeAttribute("tabindex");
      }
      nextPromptPanel.setAttribute("aria-expanded", nextPromptPanelCollapsed ? "false" : "true");
    }
    if (nextPromptToggleButton) {
      nextPromptToggleButton.setAttribute("aria-expanded", nextPromptPanelCollapsed ? "false" : "true");
    }
  }

  function hideNextPromptPanelIfEmpty() {
    if (nextPromptPanel && nextPromptPanel.parentElement) nextPromptPanel.remove();
    if (nextPromptToggleButton && nextPromptToggleButton.parentElement) nextPromptToggleButton.remove();
    nextPromptPanel = null;
    nextPromptToggleButton = null;
  }

  function readNextPromptPanelCollapsed() {
    try {
      return sessionStorage.getItem(NEXT_PROMPT_PANEL_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  }

  function writeNextPromptPanelCollapsed(collapsed) {
    try {
      sessionStorage.setItem(NEXT_PROMPT_PANEL_COLLAPSED_KEY, collapsed ? "true" : "false");
    } catch {
      // Panel state is non-critical.
    }
  }

  function eventMatchesShortcut(event, shortcut) {
    const parsed = parseShortcut(shortcut);
    if (!parsed) return false;
    if (Boolean(event.ctrlKey) !== parsed.ctrl) return false;
    if (Boolean(event.altKey) !== parsed.alt) return false;
    if (Boolean(event.shiftKey) !== parsed.shift) return false;
    if (Boolean(event.metaKey) !== parsed.meta) return false;
    return normalizeKeyName(event.key) === parsed.key;
  }

  function normalizeShortcut(value) {
    const parsed = parseShortcut(value);
    if (!parsed) return DEFAULT_SETTINGS.nextPromptQueueShortcut;
    const parts = [];
    if (parsed.ctrl) parts.push("Ctrl");
    if (parsed.alt) parts.push("Alt");
    if (parsed.shift) parts.push("Shift");
    if (parsed.meta) parts.push("Meta");
    parts.push(formatShortcutKey(parsed.key));
    return parts.join("+");
  }

  function parseShortcut(value) {
    const parts = String(value || "").split("+").map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return null;
    const parsed = { ctrl: false, alt: false, shift: false, meta: false, key: "" };
    for (const part of parts) {
      const token = part.toLowerCase();
      if (token === "ctrl" || token === "control") parsed.ctrl = true;
      else if (token === "alt" || token === "option") parsed.alt = true;
      else if (token === "shift") parsed.shift = true;
      else if (token === "meta" || token === "cmd" || token === "command") parsed.meta = true;
      else if (!parsed.key) parsed.key = normalizeKeyName(part);
      else return null;
    }
    if (!parsed.key) return null;
    return parsed;
  }

  function normalizeKeyName(key) {
    const value = String(key || "").trim();
    if (!value) return "";
    const lower = value.toLowerCase();
    if (lower === "escape" || lower === "esc") return "escape";
    if (lower === "return") return "enter";
    if (lower === " ") return "space";
    if (lower.length === 1) return lower;
    return lower;
  }

  function formatShortcutKey(key) {
    if (key === "escape") return "Escape";
    if (key === "enter") return "Enter";
    if (key === "space") return "Space";
    if (key === "tab") return "Tab";
    return key.length === 1 ? key.toUpperCase() : key;
  }

  function arraysEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((value, index) => value === b[index]);
  }

  function compactText(value, maxLength) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    const limit = Math.max(8, Number(maxLength) || 42);
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
  }

  function hashString(value) {
    const text = String(value || "");
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36);
  }

  function consumeApiTrimSignal() {
    const root = document.documentElement;
    if (!root) return;

    const stats = readApiStatsFromRoot();
    if (statsApplyToThisPage(stats)) {
      if (stats && stats.trimmed) {
        rememberTrimState(stats);
      } else if (stats && stats.trimmed === false) {
        clearTrimMarkerForCurrentRoute();
        lastApiStats = stats;
      }
    }

    if (root.hasAttribute(TRIMMED_ATTR)) {
      rememberTrimState(stats && stats.trimmed ? stats : { trimmed: true, timestamp: Date.now(), pageUrl: location.href });
      root.removeAttribute(TRIMMED_ATTR);
    } else if (!apiTrimmedCurrentConversation && settings.apiTrimEnabled) {
      hydrateTrimStateFromStorage();
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
      if (fromRoot && fromRoot.trimmed) rememberTrimState(fromRoot);
      else if (fromRoot && fromRoot.trimmed === false) {
        clearTrimMarkerForCurrentRoute();
        lastApiStats = fromRoot;
      }
    }
    if (lastApiStats && statsApplyToThisPage(lastApiStats) && !isStaleTimestamp(lastApiStats.timestamp, 180_000)) {
      return { ...lastApiStats };
    }
    const marker = getTrimMarkerForCurrentRoute();
    return marker && marker.stats ? { ...marker.stats, markerOnly: true, timestamp: marker.timestamp } : null;
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
    if (!stats) return true;
    if (!stats.pageUrl) return true;
    return normalizeRouteKey(stats.pageUrl) === currentRouteKey();
  }

  function currentRouteKey() {
    return normalizeRouteKey(location.href);
  }

  function normalizeRouteKey(url) {
    try {
      const parsed = new URL(url, location.href);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return String(url || "").split(/[?#]/)[0];
    }
  }

  function rememberTrimState(stats) {
    if (!settings.apiTrimEnabled) return;
    const routeKey = currentRouteKey();
    const compact = compactTrimStats(stats);
    compact.pageUrl = location.href;
    compact.timestamp = Date.now();
    lastApiStats = { ...compact };
    apiTrimmedCurrentConversation = true;
    trimmedRouteKey = routeKey;
    putTrimMarker(routeKey, { routeKey, pageUrl: location.href, timestamp: compact.timestamp, stats: compact });
    debug("trim marker remembered", routeKey);
  }

  function compactTrimStats(stats) {
    const source = stats && typeof stats === "object" ? stats : {};
    return {
      trimmed: Boolean(source.trimmed),
      totalRenderableMessages: numberOrNull(source.totalRenderableMessages),
      keptRenderableMessages: numberOrNull(source.keptRenderableMessages),
      totalVisibleMessages: numberOrNull(source.totalVisibleMessages),
      keptVisibleMessages: numberOrNull(source.keptVisibleMessages),
      totalMappingNodes: numberOrNull(source.totalMappingNodes),
      keptMappingNodes: numberOrNull(source.keptMappingNodes),
      originalChars: numberOrNull(source.originalChars || source.originalBytes),
      trimmedChars: numberOrNull(source.trimmedChars || source.trimmedBytes),
      originalBytes: numberOrNull(source.originalBytes || source.originalChars),
      trimmedBytes: numberOrNull(source.trimmedBytes || source.trimmedChars),
      keepRenderableMessages: numberOrNull(source.keepRenderableMessages || source.keepVisibleMessages),
      keepVisibleMessages: numberOrNull(source.keepVisibleMessages || source.keepRenderableMessages),
      cacheHit: Boolean(source.cacheHit),
      cacheEligible: source.cacheEligible === false ? false : Boolean(source.cacheEligible),
      cacheStored: Boolean(source.cacheStored),
      cacheMaxKb: numberOrNull(source.cacheMaxKb),
      markerOnly: Boolean(source.markerOnly)
    };
  }

  function hydrateTrimStateFromStorage() {
    if (!settings.apiTrimEnabled) return false;
    const marker = getTrimMarkerForCurrentRoute();
    if (!marker) return false;
    apiTrimmedCurrentConversation = true;
    trimmedRouteKey = marker.routeKey || currentRouteKey();
    if (!lastApiStats && marker.stats) lastApiStats = { ...marker.stats, markerOnly: true, timestamp: marker.timestamp };
    return true;
  }

  function getTrimMarkerForCurrentRoute() {
    const routeKey = currentRouteKey();
    const markers = readTrimMarkers();
    const marker = markers[routeKey];
    if (!marker || isStaleTimestamp(marker.timestamp, TRIM_MARKER_TTL_MS)) {
      if (marker) {
        delete markers[routeKey];
        writeTrimMarkers(markers);
      }
      if (trimmedRouteKey === routeKey) {
        apiTrimmedCurrentConversation = false;
        trimmedRouteKey = null;
      }
      return null;
    }
    return marker;
  }

  function putTrimMarker(routeKey, marker) {
    const markers = readTrimMarkers();
    markers[routeKey] = marker;
    const entries = Object.entries(markers)
      .filter(([, value]) => value && !isStaleTimestamp(value.timestamp, TRIM_MARKER_TTL_MS))
      .sort((a, b) => Number(b[1].timestamp || 0) - Number(a[1].timestamp || 0))
      .slice(0, MAX_TRIM_MARKERS);
    writeTrimMarkers(Object.fromEntries(entries));
  }

  function clearTrimMarkerForCurrentRoute() {
    const routeKey = currentRouteKey();
    const markers = readTrimMarkers();
    if (markers[routeKey]) {
      delete markers[routeKey];
      writeTrimMarkers(markers);
    }
    if (!trimmedRouteKey || trimmedRouteKey === routeKey) {
      apiTrimmedCurrentConversation = false;
      trimmedRouteKey = null;
      lastApiStats = null;
    }
  }

  function readTrimMarkers() {
    try {
      const raw = sessionStorage.getItem(TRIM_MARKER_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeTrimMarkers(markers) {
    try {
      sessionStorage.setItem(TRIM_MARKER_KEY, JSON.stringify(markers || {}));
    } catch {
      // If sessionStorage is unavailable or full, keep the in-memory marker only.
    }
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
    const exactSelector = '[data-testid^="conversation-turn-"], [data-testid*="conversation-turn"], [class*="group/conversation-turn"], [data-turn-id]';

    const strategies = [
      () => safeQueryAll(exactSelector, scope).map((el) => normalizeTurnElement(el, scope)),
      () => safeQueryAll(ROLE_SELECTOR, scope).map((el) => resolveTurnFromRoleNode(el, scope)),
      () => safeQueryAll("[data-message-id]", scope).map((el) => resolveTurnFromMessageIdNode(el, scope)),
      () => safeQueryAll("article, [role='article']", scope).map((el) => normalizeTurnElement(el, scope)),
      () => safeQueryAll(".markdown, .prose", scope).map((el) => normalizeTurnElement(el, scope))
    ];

    let best = [];
    for (const build of strategies) {
      const turns = finalizeTurnCandidates(build(), scope);
      if (turns.length > best.length) best = turns;
      // In a real long conversation, two or more resolved turns means the selector is
      // specific enough. Stop here so a later fallback cannot replace it with a broad
      // conversation wrapper.
      if (turns.length >= 2) return turns;
    }

    return best;
  }

  function normalizeTurnElement(el, scope) {
    if (!(el instanceof HTMLElement)) return null;
    if (isExtensionUi(el)) return null;

    const exactSelector = '[data-testid^="conversation-turn-"], [data-testid*="conversation-turn"], [class*="group/conversation-turn"], [data-turn-id]';
    if (el.matches(exactSelector) && containsWithinScope(scope, el) && !isMultiTurnWrapper(el)) return el;

    if (el.matches(ROLE_SELECTOR)) return resolveTurnFromRoleNode(el, scope);
    if (el.matches("[data-message-id]")) return resolveTurnFromMessageIdNode(el, scope);

    const direct = el.closest(exactSelector);
    if (direct instanceof HTMLElement && containsWithinScope(scope, direct) && !isMultiTurnWrapper(direct)) return direct;

    const article = el.closest("article, [role='article']");
    if (article instanceof HTMLElement && containsWithinScope(scope, article) && !isMultiTurnWrapper(article)) return article;

    return climbToStandaloneMessageContainer(el, scope);
  }

  function resolveTurnFromRoleNode(roleNode, scope) {
    if (!(roleNode instanceof HTMLElement)) return null;
    const exactSelector = '[data-testid^="conversation-turn-"], [data-testid*="conversation-turn"], [class*="group/conversation-turn"], [data-turn-id]';

    const direct = roleNode.closest(exactSelector);
    if (direct instanceof HTMLElement && containsWithinScope(scope, direct) && !isMultiTurnWrapper(direct)) return direct;

    const article = roleNode.closest("article, [role='article']");
    if (article instanceof HTMLElement && containsWithinScope(scope, article) && !isMultiTurnWrapper(article)) return article;

    return climbToStandaloneMessageContainer(roleNode, scope);
  }

  function resolveTurnFromMessageIdNode(messageNode, scope) {
    if (!(messageNode instanceof HTMLElement)) return null;
    const roleWithin = messageNode.matches(ROLE_SELECTOR) || Boolean(messageNode.querySelector && messageNode.querySelector(ROLE_SELECTOR));
    if (roleWithin && !isMultiTurnWrapper(messageNode) && isLikelyMessageTurn(messageNode, scope)) return messageNode;
    return normalizeTurnElement(messageNode.parentElement || messageNode, scope);
  }

  function climbToStandaloneMessageContainer(el, scope) {
    let node = el instanceof HTMLElement ? el : null;
    let best = null;
    let depth = 0;

    while (node && node !== scope && node !== document.body && node !== document.documentElement && depth < 12) {
      if (!(node instanceof HTMLElement)) break;
      if (isExtensionUi(node) || isForbiddenMessageAncestor(node)) break;

      const roleCount = countMatchesIncludingSelf(node, ROLE_SELECTOR, 3);
      const turnMarkerCount = countMatchesIncludingSelf(node, '[data-testid^="conversation-turn-"], [data-testid*="conversation-turn"], [class*="group/conversation-turn"], [data-turn-id]', 3);
      const textLength = (node.textContent || "").trim().length;
      const hasTurnClass = String(node.getAttribute("class") || "").includes("group/conversation-turn");
      const hasMessageSignal = roleCount === 1 || turnMarkerCount === 1 || hasTurnClass || node.hasAttribute("data-message-id") || Boolean(node.querySelector && node.querySelector(".markdown, .prose"));

      if (roleCount > 1 || turnMarkerCount > 1) break;
      if (hasMessageSignal && textLength > 0) best = node;

      const parent = node.parentElement;
      if (!parent || parent === scope || parent === document.body || parent === document.documentElement) break;
      const parentRoleCount = countMatchesIncludingSelf(parent, ROLE_SELECTOR, 3);
      const parentTurnMarkerCount = countMatchesIncludingSelf(parent, '[data-testid^="conversation-turn-"], [data-testid*="conversation-turn"], [class*="group/conversation-turn"], [data-turn-id]', 3);
      if (parentRoleCount > 1 || parentTurnMarkerCount > 1) break;

      node = parent;
      depth += 1;
    }

    return best;
  }

  function finalizeTurnCandidates(candidates, scope) {
    const filtered = uniqueElements(candidates)
      .filter((el) => el instanceof HTMLElement)
      .filter((el) => isAttached(el) && !isExtensionUi(el))
      .filter((el) => !isMultiTurnWrapper(el))
      .filter((el) => isLikelyMessageTurn(el, scope));

    const ordered = sortDocumentOrder(filtered);
    return ordered.filter((el) => {
      // Prefer the outer single-turn wrapper over its inner role/prose node, but never
      // keep a parent that contains multiple turns.
      return !ordered.some((other) => other !== el && other.contains(el) && !isMultiTurnWrapper(other));
    });
  }

  function isMultiTurnWrapper(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (isForbiddenMessageAncestor(el)) return true;
    const roleCount = countMatchesIncludingSelf(el, ROLE_SELECTOR, 3);
    if (roleCount > 1) return true;
    const turnMarkerCount = countMatchesIncludingSelf(el, '[data-testid^="conversation-turn-"], [data-testid*="conversation-turn"], [class*="group/conversation-turn"], [data-turn-id]', 3);
    if (turnMarkerCount > 1) return true;
    return false;
  }

  function countMatchesIncludingSelf(el, selector, limit) {
    if (!(el instanceof HTMLElement)) return 0;
    const max = Math.max(1, Number(limit) || 3);
    let count = 0;
    try {
      if (el.matches(selector) && !isExtensionUi(el)) count += 1;
      if (count >= max) return count;
      if (el.querySelectorAll) {
        for (const child of el.querySelectorAll(selector)) {
          if (child instanceof HTMLElement && !isExtensionUi(child)) count += 1;
          if (count >= max) return count;
        }
      }
    } catch {
      return count;
    }
    return count;
  }

  function isForbiddenMessageAncestor(el) {
    if (!(el instanceof HTMLElement)) return true;
    if (el.matches("html, body, main, nav, aside, header, footer, form, textarea")) return true;
    if (el.closest("nav, aside, header, footer, [data-testid='conversation-sidebar'], [data-testid*='sidebar']")) return true;
    if (el.matches("[data-scroll-root], [role='main']")) return true;
    return false;
  }

  function containsWithinScope(scope, el) {
    const root = scope && typeof scope.contains === "function" ? scope : document;
    return Boolean(root === el || root.contains(el));
  }

  function isLikelyMessageTurn(el, scope) {
    if (!(el instanceof HTMLElement)) return false;
    if (!containsWithinScope(scope, el)) return false;
    if (el.closest("nav, aside, header, footer, [data-testid='conversation-sidebar']")) return false;
    if (el.matches("nav, aside, header, footer")) return false;
    if (el.id === LOAD_MORE_ID || el.id === LEGACY_LOAD_MORE_ID || el.id === STATUS_ID || el.id === BRANCH_MAP_ID || el.id === BRANCH_TOGGLE_BUTTON_ID || el.id === NEXT_PROMPT_TOAST_ID || el.id === NEXT_PROMPT_PANEL_ID || el.id === NEXT_PROMPT_TOGGLE_BUTTON_ID) return false;

    const testId = String(el.getAttribute("data-testid") || "");
    if (testId.includes("conversation-turn")) return true;
    if (el.hasAttribute("data-turn-id")) return true;
    if (el.hasAttribute("data-message-id")) return true;
    if (el.querySelector && el.querySelector(ROLE_SELECTOR)) return true;
    if (el.querySelector && el.querySelector("[data-message-id]")) return true;

    const textLength = (el.textContent || "").trim().length;
    return textLength > 0 && Boolean(el.querySelector && el.querySelector(".markdown, .prose"));
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
    return Boolean(el && el.closest && el.closest(`#${LOAD_MORE_ID}, #${LEGACY_LOAD_MORE_ID}, #${STATUS_ID}, #${MATH_COPY_BUTTON_ID}, #${MATH_COPY_TOAST_ID}, #${BRANCH_MAP_ID}, #${BRANCH_TOGGLE_BUTTON_ID}, #${NEXT_PROMPT_TOAST_ID}, #${NEXT_PROMPT_PANEL_ID}, #${NEXT_PROMPT_TOGGLE_BUTTON_ID}, [data-cgpt-lb-ui="true"]`));
  }

  function detectActiveReply(turns) {
    const now = Date.now();
    const detected = detectActiveReplyNow(turns);
    if (detected.active) {
      markActiveReply(detected.reason, ACTIVE_REPLY_PROTECTION_MS, detected.protectedCount);
      return { ...liveReplyState };
    }

    if (isActiveReplyProtected()) {
      if (liveReplyState.lastSeenAt && Date.now() - liveReplyState.lastSeenAt > ACTIVE_REPLY_MAX_SILENT_MS && !findStopControl(getMessageScope())) {
        clearActiveReplyProtection("silent-expired");
        return { ...liveReplyState };
      }
      return { ...liveReplyState, active: true };
    }

    if (liveReplyState.active) {
      clearActiveReplyProtection("idle");
    }
    return { ...liveReplyState };
  }

  function detectActiveReplyNow(turns) {
    const scope = getMessageScope();
    const stopControl = findStopControl(scope);
    if (stopControl) return { active: true, reason: "stop-control", protectedCount: 6 };

    const busy = scope && safeQueryAll('[aria-busy="true"], [data-streaming="true"], [data-state*="stream"], [data-state*="generat"]', scope)[0];
    if (busy) return { active: true, reason: "busy-or-streaming-marker", protectedCount: 6 };

    const latest = Array.isArray(turns) && turns.length ? turns[turns.length - 1] : null;
    if (latest && isLikelyAssistantTurn(latest) && hasStreamingMarker(latest)) {
      return { active: true, reason: "latest-assistant-streaming", protectedCount: 8 };
    }

    const thinkingNotice = findThinkingOrReasoningElement(turns, scope);
    if (thinkingNotice) return { active: true, reason: "thinking-or-reasoning-visible", protectedCount: 12 };

    const safetyNotice = findUnusualActivityNotice(turns, scope);
    if (safetyNotice) {
      setSafetyLock("unusual-activity-notice", SAFETY_LOCK_MS);
      return { active: true, reason: "unusual-activity-notice", protectedCount: 12 };
    }

    const recoveryNotice = findStreamRecoveryNotice(turns, scope);
    if (recoveryNotice) {
      if (!streamRecoverySince) streamRecoverySince = Date.now();
      return { active: true, reason: "stream-recovery-waiting", protectedCount: 8 };
    }

    streamRecoverySince = 0;

    return { active: false, reason: "none", protectedCount: 0 };
  }

  function findStreamRecoveryNotice(turns, scope) {
    const recentTurns = Array.isArray(turns) ? turns.slice(-8) : [];
    for (const turn of recentTurns) {
      if (!isLikelyAssistantTurn(turn)) continue;
      if (matchesStreamRecoveryText(turn && turn.textContent)) return turn;
    }

    const statusCandidates = safeQueryAll('[role="status"], [role="alert"], [aria-live], [data-testid*="stream"], [data-testid*="status"], [data-testid*="toast"]', scope);
    for (const el of statusCandidates) {
      if (isExtensionUi(el)) continue;
      const enclosingTurn = el.closest && el.closest(TURN_CLOSEST_SELECTOR);
      if (enclosingTurn && isLikelyUserTurn(enclosingTurn)) continue;
      if (matchesStreamRecoveryText(el.textContent)) return el;
    }
    return null;
  }

  function matchesStreamRecoveryText(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!text) return false;
    if (text.includes("스트리밍이 중지") && (text.includes("메시지 완료") || text.includes("완료를 기다"))) return true;
    if (text.includes("streaming") && (text.includes("stopped") || text.includes("interrupted")) && (text.includes("waiting") || text.includes("complete") || text.includes("completion"))) return true;
    if (text.includes("stream") && text.includes("message") && text.includes("completion")) return true;
    return false;
  }

  function findThinkingOrReasoningElement(turns, scope) {
    const recentTurns = Array.isArray(turns) ? turns.slice(-12) : [];
    for (const turn of recentTurns) {
      if (!isLikelyAssistantTurn(turn)) continue;
      if (hasThinkingMarker(turn) || matchesThinkingText(turn && turn.textContent)) return turn;
    }

    const root = scope && typeof scope.querySelectorAll === "function" ? scope : document;
    const candidates = safeQueryAll('[data-testid*="think"], [data-testid*="reason"], [data-testid*="thought"], [aria-label*="think"], [aria-label*="reason"], [aria-label*="thought"], [data-state*="think"], [data-state*="reason"], [role="status"], [aria-live]', root);
    for (const el of candidates) {
      if (isExtensionUi(el)) continue;
      const enclosingTurn = el.closest && el.closest(TURN_CLOSEST_SELECTOR);
      if (enclosingTurn && isLikelyUserTurn(enclosingTurn)) continue;
      if (hasThinkingMarker(el) || matchesThinkingText(el.textContent) || matchesThinkingText(el.getAttribute("aria-label"))) return el;
    }
    return null;
  }

  function findUnusualActivityNotice(turns, scope) {
    const recentTurns = Array.isArray(turns) ? turns.slice(-12) : [];
    for (const turn of recentTurns) {
      if (turn && isLikelyUserTurn(turn)) continue;
      if (matchesUnusualActivityText(turn && turn.textContent)) return turn;
    }
    const root = scope && typeof scope.querySelectorAll === "function" ? scope : document;
    const candidates = safeQueryAll('[role="status"], [role="alert"], [aria-live], [data-testid*="toast"], [data-testid*="error"]', root);
    for (const el of candidates) {
      if (isExtensionUi(el) || isInsideUserTurnOrComposer(el)) continue;
      if (matchesUnusualActivityText(el.textContent) || matchesUnusualActivityText(el.getAttribute("aria-label"))) return el;
    }
    return null;
  }

  function hasThinkingMarker(el) {
    if (!(el instanceof HTMLElement)) return false;
    const haystack = [
      el.getAttribute("data-testid"),
      el.getAttribute("aria-label"),
      el.getAttribute("data-state"),
      el.getAttribute("class")
    ].map((value) => String(value || "").toLowerCase()).join(" ");
    return /think|reason|reasoning|analysis|analyz/.test(haystack);
  }

  function matchesThinkingText(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!text) return false;
    if (/\b(thinking|reasoning|analyzing|working)\b/.test(text)) return true;
    if (text.includes("생각 중") || text.includes("생각중") || text.includes("추론 중") || text.includes("추론중")) return true;
    if (text.includes("생각하는 중") || text.includes("분석 중") || text.includes("분석중")) return true;
    return false;
  }

  function matchesUnusualActivityText(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!text) return false;
    if (text.includes("unusual-activity") || text.includes("suspicious-activity")) return true;
    if (text.includes("unusual activity has been detected") && text.includes("try again later")) return true;
    if (text.includes("we detect suspicious activity") || text.includes("unusual activity detected")) return true;
    if (text.includes("비정상") && text.includes("활동")) return true;
    if (text.includes("의심스러운") && text.includes("활동")) return true;
    return false;
  }

  function isThinkingReason(value) {
    const text = String(value || "").toLowerCase();
    return /think|reason|analysis|analyz|추론|생각|분석/.test(text);
  }

  function setSafetyLock(reason, ttlMs) {
    const until = Date.now() + Math.max(60_000, Number(ttlMs) || SAFETY_LOCK_MS);
    try { localStorage.setItem(SAFETY_LOCK_KEY, String(until)); } catch { /* ignore */ }
    if (document.documentElement) {
      document.documentElement.setAttribute(SAFETY_LOCK_ATTR, String(until));
      document.documentElement.setAttribute(SAFE_BYPASS_REASON_ATTR, String(reason || "safety lock"));
      document.documentElement.setAttribute("data-cgpt-lb-safe-bypass-at", String(Date.now()));
    }
    dispatchActiveStateToMain(true, reason || "safety lock", Math.max(60_000, Number(ttlMs) || SAFETY_LOCK_MS));
  }

  function findStopControl(scope) {
    const root = scope && typeof scope.querySelectorAll === "function" ? scope : document;
    const buttons = safeQueryAll("button, [role='button']", root);
    return buttons.find((button) => {
      if (isExtensionUi(button)) return false;
      const testId = String(button.getAttribute("data-testid") || "").toLowerCase();
      const label = String(button.getAttribute("aria-label") || button.textContent || "").toLowerCase();
      return testId.includes("stop") || label.includes("stop") || label.includes("중지") || label.includes("정지");
    }) || null;
  }

  function hasStreamingMarker(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (isStreamingIndicatorElement(el)) return true;
    return Boolean(el.querySelector && el.querySelector('[aria-busy="true"], [data-streaming="true"], [data-state*="stream"], [data-state*="generat"], .result-streaming'));
  }

  function isLikelyAssistantTurn(el) {
    if (!(el instanceof HTMLElement)) return false;
    const role = getTurnRole(el);
    if (role.includes("assistant")) return true;
    const testId = String(el.getAttribute("data-testid") || "").toLowerCase();
    return testId.includes("assistant");
  }

  function isLikelyUserTurn(el) {
    if (!(el instanceof HTMLElement)) return false;
    const role = getTurnRole(el);
    if (role.includes("user")) return true;
    const testId = String(el.getAttribute("data-testid") || "").toLowerCase();
    return testId.includes("user");
  }

  function getTurnRole(el) {
    if (!(el instanceof HTMLElement)) return "";
    const roleEl = el.matches(ROLE_SELECTOR) ? el : el.querySelector(ROLE_SELECTOR);
    return roleEl
      ? String(roleEl.getAttribute("data-message-author-role") || roleEl.getAttribute("data-message-author") || roleEl.getAttribute("data-author-role") || "").toLowerCase()
      : "";
  }

  function markActiveReply(reason, ttlMs, protectedCount) {
    const now = Date.now();
    const reasonText = String(reason || "active reply");
    const thinking = isThinkingReason(reasonText);
    const effectiveTtl = Math.max(5_000, Number(ttlMs) || (thinking ? THINKING_PROTECTION_MS : ACTIVE_REPLY_IDLE_GRACE_MS));
    const count = Math.max(Number(protectedCount) || 0, liveReplyState.protectedCount || 0, thinking ? 12 : 6);
    liveReplyState = {
      active: true,
      reason: reasonText,
      lastSeenAt: now,
      protectedCount: count,
      protectUntil: now + effectiveTtl
    };
    setActiveReplyAttribute(true);
    dispatchActiveStateToMain(true, liveReplyState.reason, Math.max(30_000, effectiveTtl));
    startActiveReplyWatchdog();
  }

  function clearActiveReplyProtection(reason) {
    liveReplyState = { active: false, reason: String(reason || "idle"), lastSeenAt: Date.now(), protectedCount: 0, protectUntil: 0 };
    streamRecoverySince = 0;
    setActiveReplyAttribute(false);
    dispatchActiveStateToMain(false, reason || "idle", 0);
    stopActiveReplyWatchdog();
  }

  function startActiveReplyWatchdog() {
    if (activeReplyWatchdogTimer) return;
    activeReplyWatchdogTimer = window.setInterval(() => {
      if (!liveReplyState.active) {
        stopActiveReplyWatchdog();
        return;
      }
      if (!isLikelyChatSurface() || document.hidden) return;
      const hardExpired = Number(liveReplyState.protectUntil || 0) <= Date.now();
      if (hardExpired) {
        scheduleScan(true);
        return;
      }
      const ttl = isThinkingReason(liveReplyState.reason) ? THINKING_PROTECTION_MS : ACTIVE_REPLY_IDLE_GRACE_MS + 10_000;
      dispatchActiveStateToMain(true, liveReplyState.reason || "active reply", ttl);
      scheduleScan(isThinkingReason(liveReplyState.reason));
    }, ACTIVE_REPLY_WATCHDOG_INTERVAL_MS);
  }

  function stopActiveReplyWatchdog() {
    if (activeReplyWatchdogTimer) clearInterval(activeReplyWatchdogTimer);
    activeReplyWatchdogTimer = 0;
  }

  function isActiveReplyProtected() {
    return Boolean(liveReplyState.active && Number(liveReplyState.protectUntil || 0) > Date.now());
  }

  function setActiveReplyAttribute(active) {
    const root = document.documentElement;
    if (!root) return;
    if (active) root.setAttribute(ACTIVE_REPLY_ATTR, "true");
    else root.removeAttribute(ACTIVE_REPLY_ATTR);
  }

  function dispatchActiveStateToMain(active, reason, ttlMs) {
    const now = Date.now();
    if (active === lastActiveSignalValue && now - lastActiveSignalAt < 1200) return;
    lastActiveSignalValue = active;
    lastActiveSignalAt = now;
    try {
      window.dispatchEvent(new CustomEvent(ACTIVE_STATE_EVENT, {
        detail: JSON.stringify({
          active: Boolean(active),
          reason: String(reason || "active reply"),
          ttlMs: Math.max(0, Number(ttlMs) || 0),
          timestamp: now,
          pageUrl: location.href
        })
      }));
    } catch {
      // Non-critical bridge failure.
    }
  }

  function isLiveProtectedTurn(index, total, liveState) {
    if (!liveState || !liveState.active) return false;
    const protectedCount = Math.max(4, Number(liveState.protectedCount) || 6);
    return index >= Math.max(0, total - protectedCount);
  }

  function applyVisibility(turns) {
    ensureUi();
    const total = turns.length;
    const liveState = detectActiveReply(turns);

    if (!settings.enabled) {
      for (const el of turns) {
        removeContainment(el);
        removeLiveProtection(el);
        showElement(el);
      }
      hideLoadMore();
      updateStatus(0, total);
      lastDomMetrics = { total, hidden: 0, visible: total };
      return;
    }

    if (total === 0) {
      if (settings.apiTrimEnabled && (apiTrimmedCurrentConversation || hydrateTrimStateFromStorage() || liveState.active)) {
        updateLoadMore(0, []);
      } else {
        hideLoadMore();
      }
      updateStatus(0, total);
      lastDomMetrics = { total, hidden: 0, visible: total };
      return;
    }

    const baseVisibleMessages = Math.max(1, settings.visibleTurns) * 2;
    const requestedVisible = Math.max(2, baseVisibleMessages + Math.max(0, extraVisibleMessages));
    const protectedIndexes = computeProtectedIndexes(turns, liveState, requestedVisible);
    const visibleIndexes = computeVisibleWindowIndexes(total, requestedVisible, protectedIndexes);
    let actuallyHidden = 0;

    for (let i = 0; i < total; i += 1) {
      const el = turns[i];
      const liveProtected = protectedIndexes.has(i);
      if (liveProtected) {
        applyLiveProtection(el);
        removeContainment(el);
      } else {
        removeLiveProtection(el);
        if (settings.cssContainmentEnabled) applyContainment(el);
        else removeContainment(el);
      }

      if (visibleIndexes.has(i)) {
        showElement(el);
      } else {
        hideElement(el);
        actuallyHidden += 1;
      }
    }

    updateLoadMore(actuallyHidden, turns);
    updateStatus(actuallyHidden, total);
    lastDomMetrics = { total, hidden: actuallyHidden, visible: Math.max(0, total - actuallyHidden) };
    writeWindowingState(total, actuallyHidden, visibleIndexes.size, liveState);
  }

  function computeProtectedIndexes(turns, liveState, requestedVisible) {
    const protectedIndexes = new Set();
    const total = turns.length;
    if (!total) return protectedIndexes;

    // Keep the newest configured window visible. During active generation, expand
    // the tail so the current answer/thinking panel remains visible, but do not
    // protect historical "Thought for..." / reasoning snippets across the whole transcript.
    const minimumTail = Math.max(2, Math.min(total, requestedVisible));
    const activeTail = liveState && liveState.active
      ? Math.max(minimumTail, Math.min(total, Number(liveState.protectedCount) || 6))
      : minimumTail;
    const tailStart = Math.max(0, total - activeTail);
    for (let i = tailStart; i < total; i += 1) protectedIndexes.add(i);

    if (liveState && liveState.active) {
      for (let i = tailStart; i < total; i += 1) {
        if (isThinkingOrLiveTurn(turns[i])) protectedIndexes.add(i);
      }
    }

    // Explicit streaming markers outside the tail are rare but should not be hidden.
    for (let i = 0; i < total; i += 1) {
      if (hasStreamingMarker(turns[i])) protectedIndexes.add(i);
    }

    addViewportProtectedIndexes(turns, protectedIndexes);
    return protectedIndexes;
  }

  function addViewportProtectedIndexes(turns, protectedIndexes) {
    const viewportHeight = Number(window.innerHeight) || Number(document.documentElement && document.documentElement.clientHeight) || 0;
    if (!viewportHeight) return;
    const margin = Math.min(220, Math.max(80, Math.round(viewportHeight * 0.18)));
    turns.forEach((turn, index) => {
      if (!isTurnInViewport(turn, viewportHeight, margin)) return;
      protectedIndexes.add(index);
      if (index > 0) protectedIndexes.add(index - 1);
      if (index + 1 < turns.length) protectedIndexes.add(index + 1);
    });
  }

  function isTurnInViewport(turn, viewportHeight, margin) {
    if (!(turn instanceof HTMLElement) || typeof turn.getBoundingClientRect !== "function") return false;
    try {
      const rect = turn.getBoundingClientRect();
      if (!rect || rect.width === 0 && rect.height === 0) return false;
      return rect.bottom >= -margin && rect.top <= viewportHeight + margin;
    } catch {
      return false;
    }
  }

  function computeVisibleWindowIndexes(total, requestedVisible, protectedIndexes) {
    const visible = new Set();
    const target = Math.min(total, Math.max(1, Number(requestedVisible) || 1));
    for (const index of protectedIndexes) {
      if (Number.isInteger(index) && index >= 0 && index < total) visible.add(index);
    }

    // Fill from the newest messages backwards until the configured window is reached.
    for (let i = total - 1; i >= 0 && visible.size < target; i -= 1) {
      visible.add(i);
    }

    return visible;
  }

  function writeWindowingState(total, hidden, visible, liveState) {
    const root = document.documentElement;
    if (!root) return;
    root.setAttribute("data-cgpt-lb-window-total", String(total));
    root.setAttribute("data-cgpt-lb-window-hidden", String(hidden));
    root.setAttribute("data-cgpt-lb-window-visible", String(visible));
    root.setAttribute("data-cgpt-lb-window-active", liveState && liveState.active ? "true" : "false");
    root.setAttribute("data-cgpt-lb-window-at", String(Date.now()));
  }

  function showAllKnownTurns() {
    const turns = queryMessageTurns();
    for (const el of turns) {
      removeContainment(el);
      removeLiveProtection(el);
      showElement(el);
    }
    hideLoadMore();
    lastDomMetrics = { total: turns.length, hidden: 0, visible: turns.length };
  }

  function isThinkingOrLiveTurn(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (hasStreamingMarker(el) || hasThinkingMarker(el)) return true;
    const compactText = String(el.textContent || "").replace(/\s+/g, " ").trim();
    if (compactText.length > 0 && compactText.length <= 320 && matchesThinkingText(compactText)) return true;
    return Boolean(el.querySelector && Array.from(el.querySelectorAll('[data-testid*="think"], [data-testid*="reason"], [data-testid*="thought"], [aria-label*="think"], [aria-label*="reason"], [aria-label*="thought"], [aria-busy="true"], [data-streaming="true"]')).some((node) => {
      const nodeText = String(node && node.textContent || "").replace(/\s+/g, " ").trim();
      return node instanceof HTMLElement && !isExtensionUi(node) && (hasThinkingMarker(node) || (nodeText.length <= 320 && matchesThinkingText(nodeText)) || isStreamingIndicatorElement(node));
    }));
  }

  function applyContainment(el) {
    if (!el.classList.contains(CONTAINED_CLASS)) el.classList.add(CONTAINED_CLASS);
  }

  function removeContainment(el) {
    if (el.classList.contains(CONTAINED_CLASS)) el.classList.remove(CONTAINED_CLASS);
  }

  function applyLiveProtection(el) {
    if (!el.classList.contains(LIVE_PROTECTED_CLASS)) el.classList.add(LIVE_PROTECTED_CLASS);
  }

  function removeLiveProtection(el) {
    if (el.classList.contains(LIVE_PROTECTED_CLASS)) el.classList.remove(LIVE_PROTECTED_CLASS);
  }

  function hideElement(el) {
    if (!(el instanceof HTMLElement)) return;
    if (el.classList.contains(LIVE_PROTECTED_CLASS)) {
      showElement(el);
      return;
    }
    if (!el.hasAttribute("data-cgpt-lb-prev-display")) {
      el.setAttribute("data-cgpt-lb-prev-display", el.style.display || "");
    }
    if (!el.hasAttribute("data-cgpt-lb-prev-content-visibility")) {
      el.setAttribute("data-cgpt-lb-prev-content-visibility", el.style.contentVisibility || "");
    }
    el.classList.add(HIDDEN_CLASS);
    el.setAttribute("data-cgpt-lb-hidden", "true");
    el.setAttribute("aria-hidden", "true");
    // Inline important fallback keeps windowing active even if Chrome injected the JS
    // before content.css, or if ChatGPT CSS has higher specificity. Previous inline
    // values are restored by showElement().
    try {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("content-visibility", "hidden", "important");
    } catch {
      // Non-critical style fallback failure.
    }
  }

  function showElement(el) {
    if (!(el instanceof HTMLElement)) return;
    el.classList.remove(HIDDEN_CLASS);
    el.removeAttribute("data-cgpt-lb-hidden");
    el.removeAttribute("aria-hidden");
    try {
      const prevDisplay = el.getAttribute("data-cgpt-lb-prev-display");
      const prevContentVisibility = el.getAttribute("data-cgpt-lb-prev-content-visibility");
      if (prevDisplay === null || prevDisplay === "") el.style.removeProperty("display");
      else el.style.setProperty("display", prevDisplay);
      if (prevContentVisibility === null || prevContentVisibility === "") el.style.removeProperty("content-visibility");
      else el.style.setProperty("content-visibility", prevContentVisibility);
    } catch {
      // Ignore inline restore failures.
    }
    el.removeAttribute("data-cgpt-lb-prev-display");
    el.removeAttribute("data-cgpt-lb-prev-content-visibility");
  }

  function ensureUi() {
    ensureRuntimeStyle();
    removeLegacyLoadMoreButton();
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

  function ensureRuntimeStyle() {
    if (!document.documentElement) return;
    if (document.getElementById(RUNTIME_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = RUNTIME_STYLE_ID;
    style.textContent = `
      .${HIDDEN_CLASS},[data-cgpt-lb-hidden="true"]{display:none!important;content-visibility:hidden!important;}
      .${LIVE_PROTECTED_CLASS}{content-visibility:visible!important;contain-intrinsic-size:unset!important;}
      #${MATH_COPY_BUTTON_ID}[hidden],#${MATH_COPY_TOAST_ID}[hidden],#${NEXT_PROMPT_TOAST_ID}[hidden],#${NEXT_PROMPT_PANEL_ID}[hidden],#${NEXT_PROMPT_TOGGLE_BUTTON_ID}[hidden],#${BRANCH_MAP_ID}[hidden],#${BRANCH_TOGGLE_BUTTON_ID}[hidden]{display:none!important;}
      #${MATH_COPY_BUTTON_ID}{position:fixed;z-index:2147483001;padding:7px 10px;border:1px solid rgba(128,128,128,.38);border-radius:999px;background:color-mix(in srgb, Canvas 94%, CanvasText 6%);color:CanvasText;font:12px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 3px 14px rgba(0,0,0,.18);cursor:pointer;contain:layout paint style;max-width:220px;white-space:nowrap;}
      #${MATH_COPY_BUTTON_ID}:hover{background:color-mix(in srgb, Canvas 86%, CanvasText 14%);}
      #${MATH_COPY_TOAST_ID}{position:fixed;right:14px;bottom:14px;z-index:2147483001;padding:7px 10px;border-radius:10px;background:color-mix(in srgb, CanvasText 86%, Canvas 14%);color:Canvas;font:12px/1.25 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 3px 16px rgba(0,0,0,.22);contain:layout paint style;pointer-events:none;max-width:320px;}
      #${NEXT_PROMPT_TOAST_ID}{position:fixed;right:14px;bottom:54px;z-index:2147483001;padding:7px 10px;border-radius:10px;background:color-mix(in srgb, CanvasText 84%, Canvas 16%);color:Canvas;font:12px/1.25 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 3px 16px rgba(0,0,0,.20);contain:layout paint style;pointer-events:none;max-width:320px;}
      #${NEXT_PROMPT_TOGGLE_BUTTON_ID}{position:fixed;left:14px;top:54px;z-index:2147483000;padding:6px 9px;border:1px solid rgba(128,128,128,.34);border-radius:999px;background:color-mix(in srgb, Canvas 92%, CanvasText 8%);color:CanvasText;font:11px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.14);cursor:pointer;contain:layout paint style;}
      #${NEXT_PROMPT_PANEL_ID}{position:fixed;left:14px;top:88px;z-index:2147482999;width:300px;max-height:min(56vh,520px);overflow:auto;padding:9px;border:1px solid rgba(128,128,128,.34);border-radius:8px;background:color-mix(in srgb, Canvas 93%, CanvasText 7%);color:CanvasText;font:11px/1.25 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 3px 16px rgba(0,0,0,.16);contain:layout paint style;}
      #${NEXT_PROMPT_PANEL_ID}.cgpt-lb-next-mini-panel{width:auto;min-width:96px;max-width:138px;min-height:44px;overflow:hidden;padding:7px 9px;border-radius:10px;cursor:pointer;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-mini{display:grid;gap:4px;white-space:nowrap;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-mini-open{font-weight:700;font-size:11px;line-height:1.15;text-align:center;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-mini-graph{display:flex;align-items:center;justify-content:center;gap:7px;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-mini-count{font-weight:700;font-size:11px;line-height:1;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-mini-bars{display:grid;grid-auto-flow:column;gap:2px;align-items:end;height:12px;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-mini-bars span{display:block;width:3px;height:8px;border-radius:2px;background:color-mix(in srgb, CanvasText 64%, Canvas 36%);}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-mini-bars span:nth-child(2){height:11px;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-mini-bars span:nth-child(3){height:6px;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-mini-bars span:nth-child(4){height:10px;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-panel-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-panel-title{font-weight:700;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-panel-close{width:22px;height:22px;padding:0;border:1px solid rgba(128,128,128,.34);border-radius:999px;background:Canvas;color:CanvasText;font:14px/1 system-ui;cursor:pointer;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-empty{padding:8px 7px;border:1px dashed rgba(128,128,128,.36);border-radius:6px;color:color-mix(in srgb, CanvasText 66%, Canvas 34%);text-align:center;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-prompt-row{display:grid;gap:4px;margin:7px 0;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-prompt-meta{font-weight:600;color:color-mix(in srgb, CanvasText 72%, Canvas 28%);}
      #${NEXT_PROMPT_PANEL_ID} textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:42px;padding:6px;border:1px solid rgba(128,128,128,.34);border-radius:6px;background:Canvas;color:CanvasText;font:12px/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
      #${NEXT_PROMPT_PANEL_ID} .cgpt-lb-next-prompt-remove{justify-self:end;padding:4px 7px;border:1px solid rgba(128,128,128,.34);border-radius:6px;background:Canvas;color:CanvasText;font:11px/1.2 system-ui;cursor:pointer;}
      #${BRANCH_TOGGLE_BUTTON_ID}{position:fixed;right:14px;top:54px;z-index:2147483000;padding:6px 9px;border:1px solid rgba(128,128,128,.34);border-radius:999px;background:color-mix(in srgb, Canvas 92%, CanvasText 8%);color:CanvasText;font:11px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.14);cursor:pointer;contain:layout paint style;}
      #${BRANCH_MAP_ID}{position:fixed;right:14px;top:88px;z-index:2147482999;width:248px;max-height:min(52vh,480px);overflow:auto;padding:9px;border:1px solid rgba(128,128,128,.34);border-radius:8px;background:color-mix(in srgb, Canvas 92%, CanvasText 8%);color:CanvasText;font:11px/1.25 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 3px 16px rgba(0,0,0,.16);contain:layout paint style;}
      #${BRANCH_MAP_ID}.cgpt-lb-branch-mini{width:auto;min-width:48px;max-width:76px;max-height:170px;overflow:hidden;padding:7px;border-radius:12px;cursor:pointer;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-mini-graph{display:flex;align-items:center;justify-content:center;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-mini-empty{display:block;width:18px;height:18px;text-align:center;color:color-mix(in srgb, CanvasText 58%, Canvas 42%);font:14px/18px ui-monospace,SFMono-Regular,Consolas,monospace;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-title{font-weight:700;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-close{width:22px;height:22px;padding:0;border:1px solid rgba(128,128,128,.34);border-radius:999px;background:Canvas;color:CanvasText;font:14px/1 system-ui;cursor:pointer;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-compare{display:grid;grid-template-columns:62px minmax(0,1fr);gap:8px;align-items:start;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-empty{grid-column:1 / -1;padding:6px 7px;border-left:2px solid color-mix(in srgb, CanvasText 32%, Canvas 68%);background:color-mix(in srgb, Canvas 86%, CanvasText 14%);border-radius:6px;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-graph{display:flex;justify-content:center;padding-top:1px;min-width:62px;overflow:visible;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-svg{display:block;width:62px;height:auto;overflow:visible;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-svg-mini{width:46px;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-edge{fill:none;stroke-linecap:round;stroke-linejoin:round;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-edge-trunk{stroke:color-mix(in srgb, CanvasText 34%, Canvas 66%);stroke-width:1.4;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-edge-fork{stroke:#3b82f6;stroke-width:2;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-hit{fill:transparent;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-split{cursor:pointer;outline:none;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-split-active .cgpt-lb-branch-hit{fill:color-mix(in srgb, #3b82f6 18%, transparent);}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-split-active .cgpt-lb-branch-edge-fork{stroke-width:2.8;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-node{stroke:Canvas;stroke-width:1.5;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-node-before{fill:color-mix(in srgb, CanvasText 62%, Canvas 38%);}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-node-after{fill:#16a34a;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-split-active .cgpt-lb-branch-node-after{stroke:#3b82f6;stroke-width:2.2;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-rail{font-size:12px;text-align:center;color:color-mix(in srgb, CanvasText 70%, Canvas 30%);}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-count{text-align:right;color:color-mix(in srgb, CanvasText 62%, Canvas 38%);}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-detail{width:100%;box-sizing:border-box;min-height:58px;padding:6px 7px;border:1px solid rgba(128,128,128,.24);border-left:2px solid #3b82f6;color:color-mix(in srgb, CanvasText 80%, Canvas 20%);background:color-mix(in srgb, Canvas 86%, CanvasText 14%);border-radius:6px;overflow-wrap:anywhere;white-space:pre-line;text-align:left;font:11px/1.3 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;}
      [data-cgpt-lb-branch-jump="true"]{outline:2px solid #3b82f6!important;outline-offset:4px!important;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-user .cgpt-lb-branch-rail{color:#3b82f6;}
      #${BRANCH_MAP_ID} .cgpt-lb-branch-assistant .cgpt-lb-branch-rail{color:#16a34a;}
      @supports (content-visibility:auto){.${CONTAINED_CLASS}:not(.${HIDDEN_CLASS}){content-visibility:auto;contain-intrinsic-size:auto 720px;}}
    `;
    const target = document.head || document.documentElement;
    target.appendChild(style);
  }

  function removeStatusBadge() {
    if (statusBadge && statusBadge.parentElement) statusBadge.remove();
    statusBadge = null;
  }

  function removeLegacyLoadMoreButton() {
    const legacy = document.getElementById(LEGACY_LOAD_MORE_ID);
    if (legacy && legacy !== loadMoreButton) {
      try {
        legacy.remove();
      } catch {
        // Non-critical cleanup.
      }
    }
  }

  function updateLoadMore(hiddenCount, turns) {
    if (!loadMoreButton) return;

    const firstVisible = turns.find((el) => !el.classList.contains(HIDDEN_CLASS));
    const container = firstVisible && firstVisible.parentElement;

    if (hiddenCount > 0) {
      const batchCount = Math.min(hiddenCount, settings.loadMoreBatch * 2);
      loadMoreButton.dataset.mode = "more";
      loadMoreButton.textContent = `이전 메시지 ${batchCount}개 더 보기 · 숨김 ${hiddenCount}개`;
      lastLoadMoreState = { visible: true, mode: "more", hiddenCount, reason: "hidden-dom", placement: "pending" };
      loadMoreButton.onclick = () => {
        lastLoadMoreAt = Date.now();
        extraVisibleMessages += settings.loadMoreBatch * 2;
        scanAndApply();
        scheduleAutoCollapseLoadedMessages("load-more-auto-collapse");
        requestAnimationFrame(() => {
          if (loadMoreButton && !loadMoreButton.hidden) loadMoreButton.scrollIntoView({ block: "center", behavior: "smooth" });
        });
      };
      showLoadMore(container, firstVisible);
      return;
    }

    if (settings.apiTrimEnabled && (apiTrimmedCurrentConversation || hydrateTrimStateFromStorage())) {
      loadMoreButton.dataset.mode = "full";
      loadMoreButton.textContent = "전체 대화 로드하기 · 느려질 수 있음";
      lastLoadMoreState = { visible: true, mode: "full", hiddenCount: 0, reason: "api-trimmed", placement: "pending" };
      loadMoreButton.onclick = () => {
        clearTrimMarkerForCurrentRoute();
        lastApiStats = null;
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

    // Prefer a body-level floating control. In recent ChatGPT layouts, inserting the
    // button into the message flex/virtual-scroll container can make it invisible or
    // clipped by an ancestor. Body-level placement keeps the control discoverable.
    if (document.body) {
      if (loadMoreButton.parentElement !== document.body) document.body.appendChild(loadMoreButton);
      loadMoreButton.dataset.floating = "true";
      loadMoreButton.hidden = false;
      loadMoreButton.removeAttribute("hidden");
      lastLoadMoreState.visible = true;
      lastLoadMoreState.placement = "body-floating";
      return;
    }

    if (!container) {
      const fallback = getMessageScope() || document.documentElement;
      if (fallback && loadMoreButton.parentElement !== fallback) fallback.prepend(loadMoreButton);
      loadMoreButton.dataset.floating = "false";
      loadMoreButton.hidden = false;
      loadMoreButton.removeAttribute("hidden");
      lastLoadMoreState.visible = true;
      lastLoadMoreState.placement = "fallback-prepend";
      return;
    }

    if (loadMoreButton.parentElement !== container || loadMoreButton.nextSibling !== beforeNode) {
      container.insertBefore(loadMoreButton, beforeNode || container.firstChild);
    }
    loadMoreButton.dataset.floating = "false";
    loadMoreButton.hidden = false;
    loadMoreButton.removeAttribute("hidden");
    lastLoadMoreState.visible = true;
    lastLoadMoreState.placement = "inline";
  }

  function hideLoadMore() {
    if (loadMoreButton) {
      loadMoreButton.hidden = true;
      loadMoreButton.setAttribute("hidden", "");
    }
    lastLoadMoreState = { visible: false, mode: "none", hiddenCount: 0, reason: "hidden", placement: "none" };
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

  function listenForMathCopyEvents() {
    document.addEventListener("copy", handleOfficeMathCopyEvent, { capture: true });
    document.addEventListener("selectionchange", scheduleMathSelectionCheck, { passive: true });
    document.addEventListener("mouseup", scheduleMathSelectionCheck, { passive: true });
    document.addEventListener("keyup", scheduleMathSelectionCheck, { passive: true });
  }

  function handleOfficeMathCopyEvent(event) {
    if (!settings.enabled || !settings.mathCopyEnabled || !settings.mathCopyAutoOnCopy) return;
    if (!event || !event.clipboardData) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target && target.closest && target.closest("textarea, input, [contenteditable='true'], [role='textbox']")) return;

    const payload = buildOfficeMathClipboardPayload({ includeImage: Boolean(settings.mathCopyPreferPngFallback) });
    if (!payload.ok || !payload.hasMath) return;

    try {
      // Automatic Ctrl/Cmd+C must not provide competing Office formats.
      // v1.5.1 previously used HTML-only, but some PowerPoint builds paste the MathML text layer
      // instead of the intended formula. Keep an immediate LaTeX fallback only, then
      // asynchronously replace it with a single PNG when the user enabled PPT-safe fallback.
      event.preventDefault();
      event.stopImmediatePropagation();
      try { event.clipboardData.clearData(); } catch { /* Ignore DataTransfer limitations. */ }
      event.clipboardData.setData("text/plain", payload.plainText);
      showMathCopyToast(`Office 수식 복사 적용 · ${payload.formulaCount || 1}개 · ${settings.mathCopyPreferPngFallback ? "PNG 준비 중" : "LaTeX"}`);
      debug("office math copy event", { formulaCount: payload.formulaCount, plainLength: payload.plainText.length, format: "text/plain-fallback" });
      if (settings.mathCopyPreferPngFallback) {
        writePayloadAsPngOnly(payload, { source: "copy-event" }).catch((error) => debug("office math async PNG copy failed", error));
      }
    } catch (error) {
      debug("office math copy event failed", error);
    }
  }

  function scheduleMathSelectionCheck() {
    if (!settings.enabled || !settings.mathCopyEnabled || !settings.mathCopyShowSelectionButton) {
      hideMathCopyButton();
      return;
    }
    if (mathSelectionTimer) clearTimeout(mathSelectionTimer);
    mathSelectionTimer = window.setTimeout(() => {
      mathSelectionTimer = 0;
      updateMathCopyButtonForSelection();
    }, 120);
  }

  function uiLang() {
    return settings && settings.languageMode === "en" ? "en" : "ko";
  }

  function uiText(ko, en) {
    return uiLang() === "en" ? en : ko;
  }

  function updateMathCopyButtonForSelection() {
    if (!settings.enabled || !settings.mathCopyEnabled || !settings.mathCopyShowSelectionButton) {
      hideMathCopyButton();
      return;
    }
    const info = getSelectionInfo();
    lastMathSelectionInfo = info;
    if (!info || !info.hasMath || !info.rect) {
      hideMathCopyButton();
      return;
    }
    ensureMathCopyButton();
    if (!mathCopyButton) return;
    const left = Math.max(8, Math.min(window.innerWidth - 180, Math.round(info.rect.left + info.rect.width / 2 - 74)));
    const top = Math.max(8, Math.min(window.innerHeight - 42, Math.round(info.rect.top - 42)));
    mathCopyButton.style.left = `${left}px`;
    mathCopyButton.style.top = `${top}px`;
    mathCopyButton.textContent = `${uiText("수식 Office 복사", "Copy formula for Office")} · ${info.formulaCount || 1}`;
    mathCopyButton.hidden = false;
    mathCopyButton.removeAttribute("hidden");
  }

  function ensureMathCopyButton() {
    ensureRuntimeStyle();
    if (mathCopyButton && document.documentElement && document.documentElement.contains(mathCopyButton)) return;
    if (!document.body) return;
    mathCopyButton = document.createElement("button");
    mathCopyButton.id = MATH_COPY_BUTTON_ID;
    mathCopyButton.type = "button";
    mathCopyButton.hidden = true;
    mathCopyButton.dataset.cgptLbUi = "true";
    mathCopyButton.title = uiText("선택한 ChatGPT 수식을 Office/PPT용 단일 형식으로 복사", "Copy the selected ChatGPT formula as one Office/PowerPoint-safe format");
    mathCopyButton.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    }, { capture: true });
    mathCopyButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const result = await copySelectedMathForOffice({ source: "selection-button", includePng: true });
      if (!result.ok) showMathCopyToast(result.error || "수식 복사 실패");
    }, { capture: true });
    document.body.appendChild(mathCopyButton);
  }

  function hideMathCopyButton() {
    if (mathCopyButton) {
      mathCopyButton.hidden = true;
      mathCopyButton.setAttribute("hidden", "");
    }
    lastMathSelectionInfo = null;
  }

  async function copySelectedMathForOffice(options = {}) {
    if (!settings.enabled || !settings.mathCopyEnabled) {
      return { ok: false, error: uiText("Office 수식 복사 기능이 꺼져 있습니다.", "Office formula copy is disabled.") };
    }

    const includePng = Boolean(options.includePng && settings.mathCopyPreferPngFallback);
    const payload = buildOfficeMathClipboardPayload({ includeImage: includePng });
    if (!payload.ok) {
      hideMathCopyButton();
      showMathCopyToast(payload.error || uiText("선택한 수식을 찾지 못했습니다.", "No formula was found in the selection."));
      return payload;
    }

    try {
      let mode = "LaTeX only";
      if (includePng) {
        const pngResult = await writePayloadAsPngOnly(payload, { source: options.source || "selection-button" });
        if (pngResult && pngResult.ok) mode = "PNG only";
        else if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(payload.plainText);
        else return legacyCopyText(payload.plainText);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload.plainText);
      } else {
        return legacyCopyText(payload.plainText);
      }
      hideMathCopyButton();
      showMathCopyToast(`${uiText("Office 수식 복사 완료", "Office formula copied")} · ${payload.formulaCount || 1} · ${mode}`);
      debug("office math copied", { source: options.source || "unknown", formulaCount: payload.formulaCount, includePng, mode });
      return {
        ok: true,
        formulaCount: payload.formulaCount,
        plainLength: payload.plainText.length,
        htmlLength: payload.html.length,
        includePng,
        mode
      };
    } catch (error) {
      // Keep a useful fallback so the user still gets LaTeX instead of broken glyph soup.
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(payload.plainText);
          showMathCopyToast(uiText("PNG 복사는 실패했지만 LaTeX 텍스트로 복사했습니다.", "PNG copy failed; copied LaTeX text instead."));
          return { ok: true, fallback: "text/plain", error: String(error && error.message ? error.message : error) };
        }
      } catch {
        // Fall through to error response.
      }
      const message = String(error && error.message ? error.message : error);
      showMathCopyToast(`${uiText("수식 복사 실패", "Formula copy failed")} · ${message.slice(0, 80)}`);
      return { ok: false, error: message };
    }
  }

  function buildOfficeMathClipboardPayload(options = {}) {
    const selectionInfo = getSelectionInfo();
    if (!selectionInfo) return { ok: false, error: uiText("선택 영역이 없습니다.", "There is no active selection.") };
    if (!selectionInfo.hasMath) return { ok: false, error: uiText("선택 영역에서 수식을 감지하지 못했습니다.", "No formula was detected in the selection.") };

    const officeRoot = document.createElement("div");
    officeRoot.className = "cgpt-office-selection";
    for (const range of selectionInfo.ranges) {
      try { officeRoot.appendChild(range.cloneContents()); }
      catch { /* Ignore broken range clone. */ }
    }

    const actualEntries = dedupeMathEntries(getMathEntriesFromRanges(selectionInfo.ranges));
    const formulaOnlySelection = actualEntries.length > 0 && isFormulaOnlySelection(selectionInfo.ranges);
    let entries = [];
    if (formulaOnlySelection) {
      // For a pure formula selection, rebuild the clipboard fragment from the semantic formula only.
      // This avoids copying visual glyph text before the Office-compatible MathML/HTML representation.
      officeRoot.textContent = "";
      appendOfficeMathEntries(officeRoot, actualEntries);
      entries = actualEntries.slice();
    } else {
      cleanupClonedSelection(officeRoot);
      entries = dedupeMathEntries(transformMathNodesForOffice(officeRoot));
      if (!entries.length && actualEntries.length) {
        officeRoot.textContent = "";
        appendOfficeMathEntries(officeRoot, actualEntries);
        entries = actualEntries.slice();
      }
    }
    const fallbackLatexEntries = entries.length ? entries : actualEntries.length ? actualEntries : inferLatexEntriesFromText(selectionInfo.text);
    const plainText = buildPlainTextForOffice(officeRoot, selectionInfo.text, fallbackLatexEntries);
    const bodyHtml = officeRoot.innerHTML || escapeHtml(plainText);
    const html = buildOfficeHtml(bodyHtml);

    return {
      ok: true,
      hasMath: true,
      formulaCount: Math.max(1, fallbackLatexEntries.length || selectionInfo.formulaCount || 0),
      plainText,
      html,
      bodyHtml,
      renderHtml: buildRenderHtmlForPng(bodyHtml),
      includeImage: Boolean(options.includeImage)
    };
  }

  function getSelectionInfo() {
    const selection = window.getSelection && window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

    const ranges = [];
    let rect = null;
    for (let i = 0; i < selection.rangeCount; i += 1) {
      const range = selection.getRangeAt(i);
      if (!range || range.collapsed) continue;
      if (!rangeIntersectsChatSurface(range)) continue;
      ranges.push(range.cloneRange());
      rect = rect || firstUsableRect(range);
    }
    if (!ranges.length) return null;

    const text = String(selection.toString() || "");
    const formulaCount = countMathInRanges(ranges, text);
    const hasMath = formulaCount > 0 || LATEX_TEXT_PATTERN.test(text);
    return { ranges, text, rect, formulaCount, hasMath };
  }

  function rangeIntersectsChatSurface(range) {
    const scope = getMessageScope() || document.body || document.documentElement;
    if (!scope) return true;
    const ancestor = range.commonAncestorContainer instanceof Element
      ? range.commonAncestorContainer
      : range.commonAncestorContainer && range.commonAncestorContainer.parentElement;
    if (!ancestor) return true;
    if (isExtensionUi(ancestor)) return false;
    if (ancestor.closest && ancestor.closest("textarea, input, [contenteditable='true'], [role='textbox']")) return false;
    return scope.contains(ancestor) || ancestor.contains(scope);
  }

  function firstUsableRect(range) {
    const rects = Array.from(range.getClientRects ? range.getClientRects() : []);
    return rects.find((rect) => rect && rect.width > 0 && rect.height > 0) || null;
  }

  function countMathInRanges(ranges, text) {
    let count = getIntersectingMathNodes(ranges).length;
    if (count > 0) return count;
    for (const range of ranges) {
      try {
        const fragment = range.cloneContents();
        count += countTopLevelMathNodes(fragment);
      } catch {
        // Ignore clone failure.
      }
    }
    if (count === 0 && LATEX_TEXT_PATTERN.test(String(text || ""))) count = inferLatexEntriesFromText(text).length || 1;
    return count;
  }

  function getMathEntriesFromRanges(ranges) {
    return getIntersectingMathNodes(ranges).map(extractMathEntry).filter((entry) => entry && (entry.mathElement || entry.latex));
  }

  function appendOfficeMathEntries(root, entries) {
    if (!root || !Array.isArray(entries)) return;
    entries.forEach((entry, index) => {
      if (index > 0) root.appendChild(document.createTextNode(entry && entry.display ? "\n" : " "));
      root.appendChild(createOfficeMathElement(entry));
      if (entry && entry.display) root.appendChild(document.createTextNode("\n"));
    });
  }

  function isFormulaOnlySelection(ranges) {
    if (!Array.isArray(ranges) || !ranges.length) return false;
    return ranges.every((range) => {
      const startMath = closestMathNode(range.startContainer);
      const endMath = closestMathNode(range.endContainer);
      if (startMath && endMath) return startMath === endMath || startMath.contains(endMath) || endMath.contains(startMath);
      const common = range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer && range.commonAncestorContainer.parentElement;
      return Boolean(common && closestMathNode(common));
    });
  }

  function closestMathNode(node) {
    const el = node instanceof Element ? node : node && node.parentElement;
    return el && el.closest ? el.closest(MATH_NODE_SELECTOR) : null;
  }

  function getIntersectingMathNodes(ranges) {
    const scope = getMessageScope() || document.body || document.documentElement;
    if (!scope || !scope.querySelectorAll || !Array.isArray(ranges)) return [];
    const nodes = Array.from(scope.querySelectorAll(MATH_NODE_SELECTOR)).filter((node) => node instanceof Element && isTopLevelMathNode(node));
    const seen = new Set();
    const matches = [];
    for (const node of nodes) {
      if (seen.has(node)) continue;
      for (const range of ranges) {
        try {
          if (range.intersectsNode(node)) {
            seen.add(node);
            matches.push(node);
            break;
          }
        } catch {
          // Ignore detached nodes.
        }
      }
    }
    return matches;
  }

  function countTopLevelMathNodes(root) {
    if (!root || !root.querySelectorAll) return 0;
    const nodes = Array.from(root.querySelectorAll(MATH_NODE_SELECTOR));
    return nodes.filter((node) => node instanceof Element && isTopLevelMathNode(node)).length;
  }

  function isTopLevelMathNode(node) {
    if (!(node instanceof Element)) return false;
    return !(node.parentElement && node.parentElement.closest && node.parentElement.closest(MATH_NODE_SELECTOR));
  }

  function cleanupClonedSelection(root) {
    if (!root || !root.querySelectorAll) return;
    for (const node of Array.from(root.querySelectorAll("script, iframe, object, embed, canvas, textarea, input, button, [data-cgpt-lb-ui='true'], [id^='cgpt-lb-']"))) {
      node.remove();
    }
    // KaTeX/MathJax selection often contains both semantic MathML and visible HTML.
    // Keeping both is the common cause of formulas pasting twice in Office.
    for (const node of Array.from(root.querySelectorAll(".katex-html, .MJX_Assistive_MathML, mjx-assistive-mml, [aria-hidden='true']"))) {
      node.remove();
    }
    for (const el of Array.from(root.querySelectorAll("*"))) {
      for (const attr of Array.from(el.attributes || [])) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on") || name === "contenteditable" || name === "aria-hidden") el.removeAttribute(attr.name);
        if (name === "style" && /display\s*:\s*none|visibility\s*:\s*hidden|content-visibility\s*:\s*hidden/i.test(attr.value)) el.removeAttribute(attr.name);
      }
      if (el.classList) {
        el.classList.remove(HIDDEN_CLASS, CONTAINED_CLASS, LIVE_PROTECTED_CLASS);
      }
    }
  }

  function transformMathNodesForOffice(root) {
    if (!root || !root.querySelectorAll) return [];
    const entries = [];
    const nodes = Array.from(root.querySelectorAll(MATH_NODE_SELECTOR)).filter((node) => node instanceof Element && isTopLevelMathNode(node));

    for (const node of nodes) {
      if (!root.contains(node)) continue;
      const entry = extractMathEntry(node);
      if (!entry || (!entry.mathElement && !entry.latex)) continue;
      entries.push(entry);

      node.replaceWith(createOfficeMathElement(entry));
    }

    return entries;
  }

  function createOfficeMathElement(entry) {
    const replacement = document.createElement(entry && entry.display ? "div" : "span");
    replacement.className = "cgpt-office-math";
    replacement.setAttribute("data-latex", entry && entry.latex ? entry.latex : "");
    replacement.setAttribute("data-display", entry && entry.display ? "block" : "inline");
    if (entry && entry.mathElement) {
      const mathClone = entry.mathElement.cloneNode(true);
      sanitizeMathCloneForOffice(mathClone);
      if (entry.display) mathClone.setAttribute("display", "block");
      else if (!mathClone.getAttribute("display")) mathClone.setAttribute("display", "inline");
      replacement.appendChild(mathClone);
    } else {
      const latex = normalizeLatex(entry && entry.latex);
      replacement.textContent = entry && entry.display ? `$$${latex}$$` : `\(${latex}\)`;
    }
    return replacement;
  }

  function extractMathEntry(node) {
    if (!(node instanceof Element)) return null;
    const mathElement = node.matches("math") ? node : node.querySelector("math");
    const annotationLatex = mathElement ? extractLatexAnnotation(mathElement) : "";
    const dataLatex = getAttributeCaseInsensitive(node, ["data-latex", "data-tex", "data-math", "data-formula"]);
    const aria = String(node.getAttribute("aria-label") || "");
    const latex = normalizeLatex(annotationLatex || dataLatex || inferLatexFromText(aria) || inferLatexFromText(node.textContent || ""));
    const display = Boolean(node.matches(".katex-display, mjx-container[display='true']") || (mathElement && String(mathElement.getAttribute("display") || "").toLowerCase() === "block"));
    return { latex, mathElement, display };
  }

  function sanitizeMathCloneForOffice(mathElement) {
    if (!mathElement || !mathElement.querySelectorAll) return;
    // Keep TeX annotations. They are the part Office can use to recover the real
    // formula. Duplicate pastes are prevented by writing a single clipboard format,
    // not by deleting the semantic annotation.
    for (const el of Array.from(mathElement.querySelectorAll("*"))) {
      for (const attr of Array.from(el.attributes || [])) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on") || name === "aria-hidden" || name === "contenteditable") el.removeAttribute(attr.name);
      }
    }
  }

  function extractLatexAnnotation(mathElement) {
    if (!mathElement || !mathElement.querySelector) return "";
    const annotations = Array.from(mathElement.querySelectorAll("annotation"));
    const match = annotations.find((annotation) => /tex|latex/i.test(String(annotation.getAttribute("encoding") || "")));
    return match ? String(match.textContent || "") : "";
  }

  function dedupeMathEntries(entries) {
    const seen = new Set();
    const output = [];
    for (const entry of Array.isArray(entries) ? entries : []) {
      if (!entry) continue;
      const key = `${normalizeLatex(entry.latex)}|${entry.display ? "block" : "inline"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(entry);
    }
    return output;
  }

  function getAttributeCaseInsensitive(node, names) {
    for (const name of names) {
      const value = node.getAttribute && node.getAttribute(name);
      if (value) return String(value);
    }
    return "";
  }

  function inferLatexFromText(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    const inline = text.match(/\\\((.*?)\\\)/s);
    if (inline) return inline[1];
    const block = text.match(/\\\[(.*?)\\\]/s) || text.match(/\$\$(.*?)\$\$/s);
    if (block) return block[1];
    const dollar = text.match(/(?<!\\)\$([^$\n]{1,500})(?<!\\)\$/s);
    if (dollar) return dollar[1];
    if (/\\begin\{|\\frac|\\sum|\\int|\\sqrt|[_^{}]/.test(text)) return text;
    return "";
  }

  function normalizeLatex(value) {
    return String(value || "").replace(/\u200b/g, "").replace(/\s+/g, " ").trim();
  }

  function inferLatexEntriesFromText(text) {
    const value = String(text || "");
    const entries = [];
    const patterns = [
      /\\\((.*?)\\\)/gs,
      /\\\[(.*?)\\\]/gs,
      /\$\$(.*?)\$\$/gs,
      /(?<!\\)\$([^$\n]{1,500})(?<!\\)\$/gs
    ];
    for (const pattern of patterns) {
      for (const match of value.matchAll(pattern)) {
        const latex = normalizeLatex(match[1]);
        if (latex) entries.push({ latex, display: pattern.source.includes("\\$\\$") || pattern.source.includes("\\\\\\["), mathElement: null });
      }
    }
    if (!entries.length && /\\begin\{|\\frac|\\sum|\\int|\\sqrt/.test(value)) {
      entries.push({ latex: normalizeLatex(value), display: /\\begin\{/.test(value), mathElement: null });
    }
    return entries;
  }

  function buildPlainTextForOffice(root, fallbackText, entries) {
    const serialized = serializePlainNode(root).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (serialized && /\\\(|\\\[|\$\$|\\begin\{|\\frac|\\sum|\\int|\\sqrt/.test(serialized)) return serialized;
    const entryText = (entries || []).map((entry) => formatLatexForPlain(entry)).filter(Boolean).join("\n");
    if (entryText) return entryText;
    return String(fallbackText || "").trim();
  }

  function serializePlainNode(node) {
    if (!node) return "";
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return "";
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node;
      if (el.classList && el.classList.contains("cgpt-office-math")) {
        const latex = normalizeLatex(el.getAttribute("data-latex") || inferLatexFromText(el.textContent || ""));
        return latex ? formatLatexForPlain({ latex, display: el.getAttribute("data-display") === "block" }) : String(el.textContent || "");
      }
      const tag = el.tagName ? el.tagName.toLowerCase() : "";
      if (tag === "br") return "\n";
      let text = "";
      for (const child of Array.from(el.childNodes || [])) text += serializePlainNode(child);
      if (/^(p|div|section|article|li|tr|h[1-6])$/.test(tag)) text = `\n${text}\n`;
      return text;
    }
    let text = "";
    for (const child of Array.from(node.childNodes || [])) text += serializePlainNode(child);
    return text;
  }

  function formatLatexForPlain(entry) {
    const latex = normalizeLatex(entry && entry.latex);
    if (!latex) return "";
    return entry && entry.display ? `$$${latex}$$` : `\\(${latex}\\)`;
  }

  function buildOfficeHtml(bodyHtml) {
    return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}.cgpt-office-selection{white-space:pre-wrap}.cgpt-office-math{font-family:"Cambria Math","Cambria",serif}.cgpt-office-math math{font-family:"Cambria Math","Cambria",serif}</style></head><body><div class="cgpt-office-selection">${bodyHtml}</div></body></html>`;
  }

  function buildRenderHtmlForPng(bodyHtml) {
    return `<div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;padding:10px 12px;background:white;color:black;font:20px/1.45 Calibri,Arial,sans-serif;white-space:pre-wrap;max-width:1400px;"><style>.cgpt-office-math,.cgpt-office-math math{font-family:'Cambria Math','Cambria',serif;font-size:1em}</style>${bodyHtml}</div>`;
  }

  async function writePayloadAsPngOnly(payload, options = {}) {
    if (!payload || !payload.ok || !navigator.clipboard || !window.ClipboardItem) return { ok: false, reason: "clipboard-api-unavailable" };
    const pngBlob = await renderOfficeSelectionPng(payload.renderHtml || payload.bodyHtml);
    if (!pngBlob) return { ok: false, reason: "png-render-failed" };
    await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
    debug("office math PNG-only clipboard write", { source: options.source || "unknown", formulaCount: payload.formulaCount, bytes: pngBlob.size });
    showMathCopyToast(`${uiText("Office 수식 복사 완료", "Office formula copied")} · ${payload.formulaCount || 1} · PNG`);
    return { ok: true, mode: "PNG only", bytes: pngBlob.size };
  }

  async function renderOfficeSelectionPng(renderHtml) {
    if (!renderHtml || typeof Image === "undefined") return null;
    const width = Math.min(1600, Math.max(240, Math.round(Math.min(window.innerWidth || 900, 1000))));
    const estimatedHeight = Math.min(1200, Math.max(120, Math.round(80 + String(renderHtml).length / 18)));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${estimatedHeight}"><foreignObject width="100%" height="100%">${renderHtml}</foreignObject></svg>`;
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(estimatedHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, width, estimatedHeight);
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob && blob.size ? blob : null), "image/png"));
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("PNG fallback rendering failed"));
      image.src = url;
    });
  }

  function legacyCopyText(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand && document.execCommand("copy");
    textarea.remove();
    showMathCopyToast(ok ? "LaTeX 텍스트로 복사했습니다." : "복사 실패");
    return { ok: Boolean(ok), fallback: "execCommand" };
  }

  function showMathCopyToast(message) {
    ensureRuntimeStyle();
    if (!document.body) return;
    if (!mathCopyToast || !document.documentElement.contains(mathCopyToast)) {
      mathCopyToast = document.createElement("div");
      mathCopyToast.id = MATH_COPY_TOAST_ID;
      mathCopyToast.dataset.cgptLbUi = "true";
      mathCopyToast.setAttribute("role", "status");
      mathCopyToast.setAttribute("aria-live", "polite");
      document.body.appendChild(mathCopyToast);
    }
    mathCopyToast.textContent = String(message || "");
    mathCopyToast.hidden = false;
    mathCopyToast.removeAttribute("hidden");
    clearTimeout(showMathCopyToast.timer);
    showMathCopyToast.timer = setTimeout(hideMathCopyToast, 2500);
  }

  function hideMathCopyToast() {
    if (mathCopyToast) {
      mathCopyToast.hidden = true;
      mathCopyToast.setAttribute("hidden", "");
    }
  }

  function getMathCopyStateForPopup() {
    const info = getSelectionInfo();
    return {
      enabled: Boolean(settings.mathCopyEnabled),
      autoOnCopy: Boolean(settings.mathCopyAutoOnCopy),
      selectionButton: Boolean(settings.mathCopyShowSelectionButton),
      pngFallback: Boolean(settings.mathCopyPreferPngFallback),
      selectionHasMath: Boolean(info && info.hasMath),
      formulaCount: info && info.formulaCount ? info.formulaCount : 0,
      buttonVisible: Boolean(mathCopyButton && !mathCopyButton.hidden),
      clipboardWriteSupported: Boolean(navigator.clipboard && window.ClipboardItem)
    };
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
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

  function readPatchHealth() {
    const root = document.documentElement;
    const mainVersion = root ? root.getAttribute("data-cgpt-lb-main-version") : "";
    const stats = readApiStats();
    const stableAt = Number(root && root.getAttribute("data-cgpt-lb-stable-initial-trim-at"));
    return {
      mainWorldDetected: Boolean(mainVersion),
      mainWorldVersion: mainVersion || null,
      fallbackInjected: Boolean(mainWorldFallbackInjected),
      hasTrimStats: Boolean(stats && stats.trimmed),
      stableInitialTrim: Boolean(stableAt && Date.now() - stableAt < 30 * 60 * 1000),
      stableInitialTrimAgeSec: stableAt ? Math.max(0, Math.round((Date.now() - stableAt) / 1000)) : null
    };
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
      contentVersion: CONTENT_VERSION,
      mainWorldVersion: document.documentElement ? document.documentElement.getAttribute("data-cgpt-lb-main-version") : null,
      mainWorldFallbackInjected,
      patchHealth: readPatchHealth(),
      settings: { ...settings },
      dom: { ...lastDomMetrics, nodes: countDomNodes() },
      api: readApiStats(),
      trimState: getTrimStateForPopup(),
      memory: getMemorySnapshot(),
      css: {
        contentVisibilitySupported: Boolean(window.CSS && CSS.supports && CSS.supports("content-visibility", "auto"))
      },
      maintenance: {
        enabled: Boolean(settings.maintenanceEnabled),
        intervalSec: settings.maintenanceIntervalSec,
        lastRunAt: lastMaintenanceAt || null,
        pendingRelevantMutations,
        lastObservedTurnTotal
      },
      liveReply: getLiveReplyForPopup(),
      cache: {
        entries: settings.apiCacheEntries,
        maxKb: settings.apiCacheMaxKb,
        ...readCacheSuspensionState()
      },
      safetyLock: readSafetyLockState(),
      safeBypass: readSafeBypassState(),
      liveTrimBypass: readLiveTrimBypassState(),
      loadMore: {
        ...lastLoadMoreState,
        inDom: Boolean(loadMoreButton && document.documentElement && document.documentElement.contains(loadMoreButton)),
        text: loadMoreButton && !loadMoreButton.hidden ? loadMoreButton.textContent : ""
      },
      mathCopy: getMathCopyStateForPopup(),
      timestamp: Date.now()
    };
  }

  function getLiveReplyForPopup() {
    return {
      active: isActiveReplyProtected(),
      reason: liveReplyState.reason || "none",
      ageSec: liveReplyState.lastSeenAt ? Math.max(0, Math.round((Date.now() - liveReplyState.lastSeenAt) / 1000)) : null,
      protectedCount: liveReplyState.protectedCount || 0,
      streamRecovery: Boolean(streamRecoverySince),
      streamRecoveryAgeSec: streamRecoverySince ? Math.max(0, Math.round((Date.now() - streamRecoverySince) / 1000)) : null
    };
  }

  function readCacheSuspensionState() {
    const root = document.documentElement;
    const until = Number(root && root.getAttribute(CACHE_SUSPENDED_UNTIL_ATTR));
    const reason = root ? root.getAttribute(CACHE_SUSPENDED_REASON_ATTR) : "";
    const active = Number.isFinite(until) && until > Date.now();
    return {
      suspended: active,
      suspendedReason: active ? String(reason || "active reply") : "",
      suspendedForSec: active ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0
    };
  }

  function readSafetyLockState() {
    let until = 0;
    try { until = Number(localStorage.getItem(SAFETY_LOCK_KEY) || 0); } catch { until = 0; }
    const attr = Number(document.documentElement && document.documentElement.getAttribute(SAFETY_LOCK_ATTR) || 0);
    until = Math.max(until, attr || 0);
    if (until && Date.now() < until) {
      return {
        active: true,
        until,
        remainingSec: Math.max(0, Math.round((until - Date.now()) / 1000)),
        reason: String(document.documentElement && document.documentElement.getAttribute(SAFE_BYPASS_REASON_ATTR) || "safety lock")
      };
    }
    return { active: false };
  }

  function readSafeBypassState() {
    const root = document.documentElement;
    if (!root) return { active: false };
    const reason = root.getAttribute(SAFE_BYPASS_REASON_ATTR) || "";
    const url = root.getAttribute("data-cgpt-lb-safe-bypass-url") || "";
    const at = Number(root.getAttribute("data-cgpt-lb-safe-bypass-at") || 0);
    const ageSec = at ? Math.max(0, Math.round((Date.now() - at) / 1000)) : null;
    return { active: Boolean(reason && (!at || Date.now() - at < 180_000)), reason, url, ageSec };
  }

  function readLiveTrimBypassState() {
    const root = document.documentElement;
    const until = Number(root && root.getAttribute(LIVE_TRIM_BYPASS_UNTIL_ATTR));
    const reason = root ? root.getAttribute(LIVE_TRIM_BYPASS_REASON_ATTR) : "";
    const active = Number.isFinite(until) && until > Date.now();
    return {
      active,
      reason: active ? String(reason || "active reply") : "",
      remainingSec: active ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0
    };
  }

  function getTrimStateForPopup() {
    const marker = getTrimMarkerForCurrentRoute();
    return {
      active: Boolean(apiTrimmedCurrentConversation || marker),
      routeKey: currentRouteKey(),
      remembered: Boolean(marker),
      ageSec: marker && marker.timestamp ? Math.max(0, Math.round((Date.now() - Number(marker.timestamp)) / 1000)) : null,
      statsSource: lastApiStats ? "live-or-recent" : marker ? "session-marker" : "none"
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
      console.debug("[ChatGPT Tool Suite]", ...args);
    } catch {
      // Ignore console failures.
    }
    persistDebugLog("content", args);
  }

  function persistDebugLog(source, args) {
    if (!settings.debug || !hasChromeStorage()) return;
    const entry = buildDebugLogEntry(source, args);
    debugLogWriteQueue = debugLogWriteQueue.then(() => appendDebugLogEntry(entry)).catch(() => {});
  }

  function appendDebugLogEntry(entry) {
    return new Promise((resolve) => {
      chrome.storage.local.get([DEBUG_LOG_KEY], (value) => {
        const existing = value && Array.isArray(value[DEBUG_LOG_KEY]) ? value[DEBUG_LOG_KEY] : [];
        const next = existing.concat(entry).slice(-MAX_DEBUG_LOG_ENTRIES);
        chrome.storage.local.set({ [DEBUG_LOG_KEY]: next }, resolve);
      });
    });
  }

  function buildDebugLogEntry(source, args) {
    const safeArgs = (Array.isArray(args) ? args : [args]).map(safeDebugValue);
    return {
      timestamp: new Date().toISOString(),
      source: source || "content",
      version: CONTENT_VERSION,
      pageUrl: location.href,
      routeKey: currentRouteKey(),
      message: safeArgs.join(" "),
      args: safeArgs
    };
  }

  function safeDebugValue(value) {
    let text = "";
    if (value instanceof Error || (value && typeof value === "object" && typeof value.message === "string" && typeof value.name === "string")) {
      text = `${value.name}: ${value.message}`;
      if (value.stack) text += `\n${value.stack}`;
    } else if (typeof value === "string") {
      text = value;
    } else {
      try {
        text = JSON.stringify(value);
      } catch {
        text = String(value);
      }
    }
    if (text === undefined) text = String(value);
    return String(text).slice(0, MAX_DEBUG_ARG_LENGTH);
  }

  window.addEventListener("pagehide", cleanup, { once: true });
  window.addEventListener("beforeunload", cleanup, { once: true });

  function cleanup() {
    stopObserver();
    if (navigationTimer) clearInterval(navigationTimer);
    if (maintenanceTimer) clearInterval(maintenanceTimer);
    if (activeReplyWatchdogTimer) clearInterval(activeReplyWatchdogTimer);
    if (nextPromptQueueTimer) clearInterval(nextPromptQueueTimer);
    if (autoCollapseTimer) clearTimeout(autoCollapseTimer);
    if (scanTimer) clearTimeout(scanTimer);
    if (mathSelectionTimer) clearTimeout(mathSelectionTimer);
    hideMathCopyButton();
    hideMathCopyToast();
    hideNextPromptToast();
    hideNextPromptPanelIfEmpty();
    removeBranchMapPanel();
    navigationTimer = 0;
    maintenanceTimer = 0;
    activeReplyWatchdogTimer = 0;
    nextPromptQueueTimer = 0;
    autoCollapseTimer = 0;
    maintenanceScheduled = false;
    scanTimer = 0;
    lastDomMetrics = { total: 0, hidden: 0, visible: 0 };
  }
})();
