(() => {
  "use strict";

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
  const GITHUB_REPO = "ch040602/Chatgpt-web-booster_chrome_extentsion";

  const ids = Object.keys(DEFAULT_SETTINGS);
  const NUMBER_SETTING_IDS = new Set([
    "visibleTurns",
    "loadMoreBatch",
    "prefetchBatches",
    "apiCacheEntries",
    "apiCacheMaxKb",
    "maintenanceIntervalSec"
  ]);
  const TEXT_SETTING_IDS = new Set(["branchTrackerShortcut", "nextPromptQueueShortcut", "nextPromptQueuePanelShortcut"]);
  const saved = document.getElementById("saved");
  const metricMain = document.getElementById("metricMain");
  const metricSub = document.getElementById("metricSub");
  const metricLines = document.getElementById("metricLines");
  const refreshMetrics = document.getElementById("refreshMetrics");
  const openReadme = document.getElementById("openReadme");
  const exportDebugLog = document.getElementById("exportDebugLog");
  const clearDebugLog = document.getElementById("clearDebugLog");
  const copySelectedMath = document.getElementById("copySelectedMath");
  const mathCopyStatus = document.getElementById("mathCopyStatus");
  const checkGitUpdate = document.getElementById("checkGitUpdate");
  const downloadGitUpdate = document.getElementById("downloadGitUpdate");
  const applyFastPresetButton = document.getElementById("applyFastPreset");
  const reinjectPatchButton = document.getElementById("reinjectPatch");
  const gitUpdateStatus = document.getElementById("gitUpdateStatus");
  const gitUpdateLines = document.getElementById("gitUpdateLines");
  const DEBUG_LOG_KEY = "cgptLongChatLoader.debugLog.v1";
  const GITHUB_API_ROOT = "https://api.github.com/repos";
  let latestUpdateInfo = null;
  const README_URLS = Object.freeze({
    en: "https://github.com/ch040602/Chatgpt-web-booster_chrome_extentsion/blob/main/README.md",
    ko: "https://github.com/ch040602/Chatgpt-web-booster_chrome_extentsion/blob/main/README.ko.md"
  });


  const I18N = Object.freeze({
    ko: {
      languageModeLabel: "프로그램 언어",
      openReadme: "Open README",
      updateTitle: "업데이트",
      checkGitUpdate: "업데이트 확인",
      downloadGitUpdate: "최신 ZIP 다운로드",
      updateIdle: "수동 확인 전입니다.",
      updateChecking: "확인 중",
      updateDone: "확인 완료",
      updateFailed: "확인 실패",
      updateNoInfo: "업데이트 정보 없음",
      installedVersion: "설치 버전",
      remoteVersion: "원격 버전",
      noRemoteVersion: "미감지",
      downloadUnavailable: "다운로드 불가",
      downloadStarted: "다운로드 시작",
      downloadOpened: "다운로드 페이지 열림",
      metricsTitle: "현재 탭 추정",
      refreshMetrics: "다시 계산",
      metricCalculating: "계산 중",
      metricSubIdle: "팝업이 열려 있을 때만 계산합니다.",
      applyFastPreset: "빠른 초기 로딩 프리셋",
      reinjectPatch: "패치 재주입",
      mathTitle: "Office 수식 복사",
      copySelectedMath: "선택 수식 복사",
      mathCopyStatusIdle: "수식을 마우스로 드래그한 뒤 Ctrl/Cmd+C 또는 이 버튼을 사용합니다.",
      mathCopying: "선택 영역 복사 중...",
      mathCopyNeedChatGpt: "ChatGPT 탭에서 수식을 드래그한 뒤 사용하세요.",
      mathCopyDone: "복사 완료",
      mathCopyFormula: "수식",
      mathCopyNotFound: "선택 영역에서 수식을 찾지 못했습니다.",
      enabledLabel: "확장 기능 사용",
      apiTrimEnabledLabel: "초기 API 응답 줄이기",
      safeNetworkModeLabel: "네트워크 안전 모드",
      cssContainmentEnabledLabel: "CSS 렌더링 containment",
      mathCopyEnabledLabel: "Office 수식 복사 보정",
      mathCopyAutoOnCopyLabel: "Ctrl/Cmd+C 수식 자동 보정",
      mathCopyShowSelectionButtonLabel: "드래그 후 수식 복사 버튼",
      mathCopyPreferPngFallbackLabel: "PPT 안전 이미지 우선",
      branchTrackerEnabledLabel: "브랜치 경로 표시",
      branchTrackerShortcutLabel: "브랜치 패널 단축키",
      nextPromptQueueEnabledLabel: "다음 질문 대기 전송",
      nextPromptQueueShortcutLabel: "대기 전송 단축키",
      nextPromptQueuePanelShortcutLabel: "대기 목록 단축키",
      showStatusLabel: "상태 배지 표시",
      maintenanceEnabledLabel: "대화 중 자동 정리",
      autoCollapseLoadedMessagesLabel: "불러온 과거 메시지 주기적 접기",
      maintenanceIntervalSecLabel: "자동 정리 주기(초)",
      visibleTurnsLabel: "처음 표시할 최근 턴",
      loadMoreBatchLabel: "더 보기 배치",
      prefetchBatchesLabel: "API 사전 보관 배치",
      apiCacheEntriesLabel: "응답 micro-cache 수",
      apiCacheMaxKbLabel: "캐시 항목 상한(KB)",
      debugLabel: "디버그 로그",
      exportDebugLog: "디버그 로그 파일 저장",
      clearDebugLog: "로그 비우기",
      currentUrlLabel: "현재 URL",
      apiMessagesLabel: "API 메시지",
      apiSizeLabel: "API 크기(추정)",
      domMessagesLabel: "DOM 메시지",
      loadMoreButtonLabel: "더보기 버튼",
      officeMathCopyLabel: "Office 수식 복사",
      liveReplyLabel: "응답 진행 보호",
      safetyLockLabel: "보안 안전 잠금",
      trimStateLabel: "Trim 상태",
      responseCacheLabel: "응답 micro-cache",
      patchHealthLabel: "패치 상태",
      maintenanceLabel: "자동 정리",
      calculatedAtLabel: "계산 시점",
      popupOpenState: "팝업 열림 상태",
      saved: "저장됨",
      presetSaved: "프리셋 저장됨"
    },
    en: {
      languageModeLabel: "Program language",
      openReadme: "Open README",
      updateTitle: "Update",
      checkGitUpdate: "Check update",
      downloadGitUpdate: "Download latest ZIP",
      updateIdle: "Not checked yet.",
      updateChecking: "Checking",
      updateDone: "Check complete",
      updateFailed: "Check failed",
      updateNoInfo: "No update info",
      installedVersion: "Installed version",
      remoteVersion: "Remote version",
      noRemoteVersion: "Not detected",
      downloadUnavailable: "Download unavailable",
      downloadStarted: "Download started",
      downloadOpened: "Download page opened",
      metricsTitle: "Current tab estimate",
      refreshMetrics: "Recalculate",
      metricCalculating: "Calculating",
      metricSubIdle: "Calculated only while this popup is open.",
      applyFastPreset: "Fast first-load preset",
      reinjectPatch: "Reinject patch",
      mathTitle: "Office formula copy",
      copySelectedMath: "Copy selected formula",
      mathCopyStatusIdle: "Drag-select a formula, then use Ctrl/Cmd+C or this button.",
      mathCopying: "Copying selection...",
      mathCopyNeedChatGpt: "Drag-select a formula in a ChatGPT tab first.",
      mathCopyDone: "Copied",
      mathCopyFormula: "formula",
      mathCopyNotFound: "No formula was found in the selection.",
      enabledLabel: "Enable extension",
      apiTrimEnabledLabel: "Trim initial API response",
      safeNetworkModeLabel: "Network safe mode",
      cssContainmentEnabledLabel: "CSS rendering containment",
      mathCopyEnabledLabel: "Office formula copy correction",
      mathCopyAutoOnCopyLabel: "Auto-correct formula Ctrl/Cmd+C",
      mathCopyShowSelectionButtonLabel: "Show formula copy button after drag",
      mathCopyPreferPngFallbackLabel: "Prefer PPT-safe image",
      branchTrackerEnabledLabel: "Show branch path",
      branchTrackerShortcutLabel: "Branch panel shortcut",
      nextPromptQueueEnabledLabel: "Queue next prompt",
      nextPromptQueueShortcutLabel: "Queue shortcut",
      nextPromptQueuePanelShortcutLabel: "Queue panel shortcut",
      showStatusLabel: "Show status badge",
      maintenanceEnabledLabel: "Auto cleanup during chat",
      autoCollapseLoadedMessagesLabel: "Periodically collapse loaded older messages",
      maintenanceIntervalSecLabel: "Cleanup interval (sec)",
      visibleTurnsLabel: "Recent turns shown first",
      loadMoreBatchLabel: "Load-more batch",
      prefetchBatchesLabel: "API prefetch batches",
      apiCacheEntriesLabel: "Response micro-cache entries",
      apiCacheMaxKbLabel: "Cache item limit (KB)",
      debugLabel: "Debug log",
      exportDebugLog: "Save debug log file",
      clearDebugLog: "Clear log",
      currentUrlLabel: "Current URL",
      apiMessagesLabel: "API messages",
      apiSizeLabel: "API size (est.)",
      domMessagesLabel: "DOM messages",
      loadMoreButtonLabel: "Load-more button",
      officeMathCopyLabel: "Office formula copy",
      liveReplyLabel: "Live reply protection",
      safetyLockLabel: "Safety lock",
      trimStateLabel: "Trim state",
      responseCacheLabel: "Response micro-cache",
      patchHealthLabel: "Patch health",
      maintenanceLabel: "Maintenance",
      calculatedAtLabel: "Calculated at",
      popupOpenState: "Popup open",
      saved: "Saved",
      presetSaved: "Preset saved"
    }
  });

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const settings = normalize(await storageGetAll());
    renderSettings(settings);
    applyLanguage(settings.languageMode);
    await storageSet(settings);

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.addEventListener("change", saveFromForm);
      if (el.type === "number") el.addEventListener("input", saveFromForm);
      if (TEXT_SETTING_IDS.has(id)) el.addEventListener("keydown", captureShortcutFromKey);
    }

    if (refreshMetrics) refreshMetrics.addEventListener("click", requestMetricsOnce);
    if (openReadme) openReadme.addEventListener("click", () => openExternalPage(README_URLS[getCurrentLanguage()] || README_URLS.en));
    if (exportDebugLog) exportDebugLog.addEventListener("click", exportDebugLogFile);
    if (clearDebugLog) clearDebugLog.addEventListener("click", clearDebugLogEntries);
    if (copySelectedMath) copySelectedMath.addEventListener("click", copySelectedMathForOffice);
    if (checkGitUpdate) checkGitUpdate.addEventListener("click", checkGitHubUpdate);
    if (downloadGitUpdate) downloadGitUpdate.addEventListener("click", downloadLatestUpdate);
    if (applyFastPresetButton) applyFastPresetButton.addEventListener("click", applyFastPreset);
    if (reinjectPatchButton) reinjectPatchButton.addEventListener("click", reinjectCurrentTabPatch);

    renderUpdateIdle();
    requestMetricsOnce();
  }

  function storageGetAll() {
    return new Promise((resolve) => {
      if (!hasChromeStorage()) return resolve({});
      chrome.storage.local.get(null, (value) => resolve(value || {}));
    });
  }

  function storageSet(value) {
    return new Promise((resolve) => {
      if (!hasChromeStorage()) return resolve(false);
      const payload = value && typeof value === "object" ? { ...value, "cgptLongChatLoader.defaultsVersion": "1.5.3" } : value;
      chrome.storage.local.set(payload, () => resolve(!chrome.runtime.lastError));
    });
  }

  function storageGetKeys(keys) {
    return new Promise((resolve) => {
      if (!hasChromeStorage()) return resolve({});
      chrome.storage.local.get(keys, (value) => resolve(value || {}));
    });
  }

  function storageRemove(key) {
    return new Promise((resolve) => {
      if (!hasChromeStorage() || !chrome.storage.local.remove) return resolve(false);
      chrome.storage.local.remove(key, () => resolve(!chrome.runtime.lastError));
    });
  }

  function hasChromeStorage() {
    return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
  }

  function renderSettings(settings) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === "checkbox") el.checked = Boolean(settings[id]);
      else el.value = String(settings[id] ?? "");
    }
  }

  async function saveFromForm() {
    const next = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === "checkbox") next[id] = el.checked;
      else if (NUMBER_SETTING_IDS.has(id)) next[id] = clampInt(el.value, Number(el.min), Number(el.max), DEFAULT_SETTINGS[id]);
      else if (TEXT_SETTING_IDS.has(id)) next[id] = normalizeTextSetting(id, el.value, DEFAULT_SETTINGS[id]);
      else next[id] = el.value;
    }

    const normalized = normalize(next);
    renderSettings(normalized);
    applyLanguage(normalized.languageMode);
    await storageSet(normalized);
    if (saved) {
      saved.textContent = t("saved");
      clearTimeout(saveFromForm.timer);
      saveFromForm.timer = setTimeout(() => { saved.textContent = ""; }, 900);
    }
    scheduleMetricRefresh();
  }

  function normalize(value) {
    const source = value && typeof value === "object" ? value : {};
    const nested = source.settings && typeof source.settings === "object" ? source.settings : {};
    let merged = { ...DEFAULT_SETTINGS, ...nested, ...source };
    if (!Object.prototype.hasOwnProperty.call(source, "languageMode") && source["cgptLongChatLoader.uiLanguage"]) {
      merged.languageMode = source["cgptLongChatLoader.uiLanguage"];
    }
    const defaultsVersion = String(source.cgptLongChatLoaderDefaultsVersion || source["cgptLongChatLoader.defaultsVersion"] || "");
    const looksLikeOldDefault =
      (!Object.prototype.hasOwnProperty.call(source, "visibleTurns") || Number(source.visibleTurns) === 3) &&
      (!Object.prototype.hasOwnProperty.call(source, "loadMoreBatch") || Number(source.loadMoreBatch) === 3 || Number(source.loadMoreBatch) === 4) &&
      (!Object.prototype.hasOwnProperty.call(source, "prefetchBatches") || Number(source.prefetchBatches) === 1) &&
      (!Object.prototype.hasOwnProperty.call(source, "apiCacheMaxKb") || Number(source.apiCacheMaxKb) === 512) &&
      (!Object.prototype.hasOwnProperty.call(source, "maintenanceIntervalSec") || Number(source.maintenanceIntervalSec) === 45);
    if (defaultsVersion !== "1.5.3" && looksLikeOldDefault) {
      merged = {
        ...merged,
        visibleTurns: 2,
        loadMoreBatch: 2,
        prefetchBatches: 0,
        apiCacheMaxKb: 256,
        maintenanceIntervalSec: 60,
        autoCollapseLoadedMessages: true
      };
    }
    const cacheValue = Object.prototype.hasOwnProperty.call(merged, "apiCacheEntries")
      ? merged.apiCacheEntries
      : merged.responseCacheMax;

    return {
      languageMode: normalizeLanguageMode(merged.languageMode),
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

  function normalizeLanguageMode(value) {
    return String(value || "").toLowerCase() === "en" ? "en" : "ko";
  }

  function getCurrentLanguage() {
    const el = document.getElementById("languageMode");
    return normalizeLanguageMode(el && el.value);
  }

  function t(key) {
    const lang = getCurrentLanguage();
    return (I18N[lang] && I18N[lang][key]) || (I18N.ko && I18N.ko[key]) || key;
  }

  function applyLanguage(langValue) {
    const lang = normalizeLanguageMode(langValue);
    if (document.documentElement) document.documentElement.lang = lang;
    const dict = I18N[lang] || I18N.ko;
    for (const [id, text] of Object.entries(dict)) {
      const el = document.getElementById(id);
      if (el && typeof text === "string") el.textContent = text;
    }
    if (gitUpdateStatus && getDatasetState(gitUpdateStatus) === "idle") gitUpdateStatus.textContent = dict.updateIdle;
    if (mathCopyStatus && getDatasetState(mathCopyStatus) === "idle") mathCopyStatus.textContent = dict.mathCopyStatusIdle;
  }

  function getDatasetState(el) {
    return el && el.dataset ? el.dataset.state : "";
  }

  function setDatasetState(el, state) {
    if (el && el.dataset) el.dataset.state = state;
  }

  function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function scheduleMetricRefresh() {
    clearTimeout(scheduleMetricRefresh.timer);
    scheduleMetricRefresh.timer = setTimeout(requestMetricsOnce, 250);
  }

  async function requestMetricsOnce() {
    setMetricState(t("metricCalculating"), t("metricSubIdle"));
    clearMetricLines();

    if (!chrome.tabs || !chrome.runtime) {
      renderMetricUnavailable("현재 브라우저에서 탭 측정을 사용할 수 없습니다.");
      return;
    }

    const tab = await getActiveTab();
    const tabId = tab && tab.id;
    if (!tabId) {
      renderMetricUnavailable("활성 탭을 찾지 못했습니다.");
      return;
    }

    let result = await sendMetricsMessage(tabId);
    if (!result.response || !result.response.ok) {
      const injected = await injectContentScripts(tab);
      if (injected.ok) {
        await delay(160);
        result = await sendMetricsMessage(tabId);
      } else if (injected.error && !isProbablyChatGptUrl(tab.url)) {
        renderMetricUnavailable("ChatGPT 탭에서 확장 아이콘을 눌러야 계산됩니다.");
        return;
      }
    }

    if (!result.response || !result.response.ok) {
      const detail = result.error ? ` · ${result.error}` : "";
      renderMetricUnavailable(`content script 응답 없음${detail}. ChatGPT 탭을 새로고침한 뒤 다시 여세요.`);
      return;
    }

    renderMetrics(result.response);
  }

  function getActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs && tabs[0] ? tabs[0] : null);
      });
    });
  }

  function sendMetricsMessage(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { type: "cgpt-lb-get-metrics" }, (response) => {
        const error = chrome.runtime.lastError ? chrome.runtime.lastError.message : "";
        resolve({ response, error });
      });
    });
  }

  async function injectContentScripts(tab) {
    if (!chrome.scripting || !tab || !tab.id) return { ok: false, error: "scripting API unavailable" };
    if (tab.url && !isProbablyChatGptUrl(tab.url)) return { ok: false, error: "not a ChatGPT tab" };

    await executeScript(tab.id, "mainWorld.js", "MAIN");
    await delay(60);
    await insertCss(tab.id, "content.css");
    return executeScript(tab.id, "content.js", "ISOLATED");
  }

  function insertCss(tabId, file) {
    return new Promise((resolve) => {
      try {
        chrome.scripting.insertCSS({ target: { tabId }, files: [file] }, () => {
          resolve({ ok: !chrome.runtime.lastError, error: chrome.runtime.lastError && chrome.runtime.lastError.message });
        });
      } catch (error) {
        resolve({ ok: false, error: String(error && error.message ? error.message : error) });
      }
    });
  }

  function executeScript(tabId, file, world) {
    return new Promise((resolve) => {
      try {
        const details = { target: { tabId }, files: [file] };
        if (world) details.world = world;
        chrome.scripting.executeScript(details, () => {
          resolve({ ok: !chrome.runtime.lastError, error: chrome.runtime.lastError && chrome.runtime.lastError.message });
        });
      } catch (error) {
        resolve({ ok: false, error: String(error && error.message ? error.message : error) });
      }
    });
  }

  function isProbablyChatGptUrl(url) {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.hostname === "chatgpt.com" || parsed.hostname.endsWith(".chatgpt.com") || parsed.hostname === "chat.openai.com";
    } catch {
      return false;
    }
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function renderMetricUnavailable(message) {
    setMetricState("계산 불가", message);
    clearMetricLines();
  }

  function renderMetrics(metrics) {
    clearMetricLines();
    const estimate = estimateImprovement(metrics);

    if (!metrics.routeActive) {
      setMetricState("대화 화면 아님", "ChatGPT 새 채팅 또는 대화 화면에서 계산됩니다.");
      appendMetricLine(t("currentUrlLabel"), shortenUrl(metrics.url));
      appendMetricLine("content script", metrics.contentVersion || "감지됨");
      return;
    }

    if (estimate) {
      setMetricState(
        `${estimate.multiplierLow.toFixed(1)}~${estimate.multiplierHigh.toFixed(1)}배`,
        `초기 파싱·렌더링·layout 작업 약 ${estimate.reductionPct}% 감소 추정`
      );
    } else {
      setMetricState("기준 부족", "API trim 기록 또는 숨김 DOM이 감지되면 추정치를 계산합니다.");
    }

    appendMetricLine(t("apiMessagesLabel"), formatApiMessages(metrics.api));
    appendMetricLine(t("apiSizeLabel"), formatApiSize(metrics.api));
    appendMetricLine(t("domMessagesLabel"), formatDom(metrics.dom));
    appendMetricLine(t("loadMoreButtonLabel"), formatLoadMore(metrics.loadMore));
    appendMetricLine(t("officeMathCopyLabel"), formatMathCopy(metrics.mathCopy));
    appendMetricLine(t("liveReplyLabel"), formatLiveReply(metrics.liveReply));
    appendMetricLine("Live API rewrite", formatLiveTrimBypass(metrics.liveTrimBypass));
    appendMetricLine("Thinking shield", formatThinkingShield(metrics));
    appendMetricLine(t("safetyLockLabel"), formatSafetyLock(metrics.safetyLock));
    appendMetricLine("Safe original pass", formatSafeBypass(metrics.safeBypass));
    appendMetricLine(t("trimStateLabel"), formatTrimState(metrics.trimState));
    appendMetricLine(t("responseCacheLabel"), formatCache(metrics));
    appendMetricLine("API patch", formatApiPatch(metrics));
    appendMetricLine(t("patchHealthLabel"), formatPatchHealth(metrics.patchHealth));
    appendMetricLine("CSS containment", formatCss(metrics));
    appendMetricLine(t("maintenanceLabel"), formatMaintenance(metrics.maintenance));
    appendMetricLine("JS heap", formatMemory(metrics.memory));
    appendMetricLine("DOM nodes", formatNumber(metrics.dom && metrics.dom.nodes));
    appendMetricLine(t("calculatedAtLabel"), t("popupOpenState"));
  }

  function estimateImprovement(metrics) {
    const api = metrics && metrics.api ? metrics.api : null;
    const dom = metrics && metrics.dom ? metrics.dom : null;
    const parts = [];

    const originalChars = positiveNumber(api && (api.originalChars || api.originalBytes));
    const trimmedChars = positiveNumber(api && (api.trimmedChars || api.trimmedBytes));
    if (originalChars > 0 && trimmedChars > 0) {
      parts.push({ value: clamp01(1 - trimmedChars / originalChars), weight: 0.50 });
    }

    const totalMessages = positiveNumber(api && (api.totalRenderableMessages || api.totalVisibleMessages));
    const keptMessages = positiveNumber(api && (api.keptRenderableMessages || api.keptVisibleMessages));
    if (totalMessages > 0 && keptMessages > 0) {
      parts.push({ value: clamp01(1 - keptMessages / totalMessages), weight: 0.35 });
    }

    if (dom && positiveNumber(dom.total) > 0) {
      parts.push({ value: clamp01((positiveNumber(dom.hidden) || 0) / dom.total), weight: parts.length ? 0.15 : 1.0 });
    }

    if (!parts.length) return null;

    let weighted = 0;
    let weight = 0;
    for (const part of parts) {
      weighted += part.value * part.weight;
      weight += part.weight;
    }
    let reduction = weight ? weighted / weight : 0;

    if (metrics.settings && metrics.settings.cssContainmentEnabled && dom && dom.total > dom.visible) {
      reduction = Math.min(0.95, reduction + 0.03);
    }

    if (reduction < 0.03) return null;

    const lowReduction = clamp01(reduction * 0.70);
    const highReduction = clamp01(Math.min(0.95, reduction * 1.15 + 0.03));
    return {
      reductionPct: Math.round(reduction * 100),
      multiplierLow: 1 / Math.max(0.05, 1 - lowReduction),
      multiplierHigh: 1 / Math.max(0.05, 1 - highReduction)
    };
  }

  function setMetricState(main, sub) {
    if (metricMain) metricMain.textContent = main;
    if (metricSub) metricSub.textContent = sub;
  }

  function clearMetricLines() {
    if (metricLines) metricLines.textContent = "";
  }

  function appendMetricLine(label, value) {
    if (!metricLines) return;
    const row = document.createElement("div");
    row.className = "metric-line";
    const left = document.createElement("span");
    left.textContent = label;
    const right = document.createElement("strong");
    right.textContent = value;
    row.append(left, right);
    metricLines.appendChild(row);
  }

  function positiveNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function clamp01(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
  }

  function formatApiMessages(api) {
    if (!api) return "미감지";
    const total = positiveNumber(api.totalRenderableMessages || api.totalVisibleMessages);
    const kept = positiveNumber(api.keptRenderableMessages || api.keptVisibleMessages);
    if (!total) return "미감지";
    return `${formatNumber(kept || total)}/${formatNumber(total)}`;
  }

  function formatApiSize(api) {
    if (!api) return "미감지";
    const original = positiveNumber(api.originalChars || api.originalBytes);
    const trimmed = positiveNumber(api.trimmedChars || api.trimmedBytes) || original;
    if (!original) return "미감지";
    const saved = Math.max(0, original - trimmed);
    const pct = Math.round((saved / original) * 100);
    return `${formatApproxBytes(trimmed)} / ${formatApproxBytes(original)} · -${pct}%`;
  }

  function formatDom(dom) {
    if (!dom || !positiveNumber(dom.total)) return "미감지";
    return `${formatNumber(dom.visible)}/${formatNumber(dom.total)} 표시 · 숨김 ${formatNumber(dom.hidden)}`;
  }

  function formatLoadMore(loadMore) {
    if (!loadMore || !loadMore.inDom) return "없음";
    if (!loadMore.visible) return "숨김";
    const mode = loadMore.mode === "full" ? "전체 로드" : loadMore.mode === "more" ? "더보기" : loadMore.mode;
    const placement = loadMore.placement && loadMore.placement !== "none" ? ` · ${loadMore.placement}` : "";
    return `${mode} · ${loadMore.reason || "표시"}${placement}`;
  }

  function formatMathCopy(mathCopy) {
    if (!mathCopy || !mathCopy.enabled) return getCurrentLanguage() === "ko" ? "꺼짐" : "off";
    const parts = [];
    parts.push(mathCopy.autoOnCopy ? (getCurrentLanguage() === "ko" ? "Ctrl+C 보정" : "Ctrl+C correction") : (getCurrentLanguage() === "ko" ? "수동" : "manual"));
    if (mathCopy.selectionButton) parts.push(getCurrentLanguage() === "ko" ? "선택 버튼" : "selection button");
    if (mathCopy.pngFallback) parts.push(getCurrentLanguage() === "ko" ? "PPT 안전 이미지" : "PPT-safe image");
    if (mathCopy.selectionHasMath) parts.push(`${getCurrentLanguage() === "ko" ? "선택" : "selected"} ${formatNumber(mathCopy.formulaCount || 1)}`);
    if (!mathCopy.clipboardWriteSupported) parts.push(getCurrentLanguage() === "ko" ? "텍스트 fallback" : "text fallback");
    return parts.join(" · ");
  }

  function formatLiveReply(liveReply) {
    if (!liveReply || !liveReply.active) return "대기";
    const age = positiveNumber(liveReply.ageSec) ? ` · ${formatNumber(liveReply.ageSec)}초 전` : "";
    const count = positiveNumber(liveReply.protectedCount) ? ` · 최근 ${formatNumber(liveReply.protectedCount)}개 보호` : "";
    const recovery = liveReply.streamRecovery ? ` · 복구 대기 ${formatNumber(liveReply.streamRecoveryAgeSec || 0)}초` : "";
    return `활성 · ${liveReply.reason || "reply"}${age}${count}${recovery}`;
  }

  function formatLiveTrimBypass(state) {
    if (!state || !state.active) return "대기";
    return `원본 통과 · ${formatNumber(state.remainingSec)}초 · ${state.reason || "active reply"}`;
  }

  function formatThinkingShield(metrics) {
    const live = metrics && metrics.liveReply ? metrics.liveReply : {};
    const bypass = metrics && metrics.liveTrimBypass ? metrics.liveTrimBypass : {};
    const reason = String(live.reason || bypass.reason || "");
    const active = Boolean((live.active || bypass.active) && /think|reason|analysis|analyz|추론|생각|분석/i.test(reason));
    if (!active) return "대기";
    const remaining = positiveNumber(bypass.remainingSec) ? ` · ${formatNumber(bypass.remainingSec)}초 원본 통과` : "";
    return `활성 · ${reason}${remaining}`;
  }

  function formatSafetyLock(lock) {
    if (!lock || !lock.active) return "대기";
    return `활성 · ${formatNumber(lock.remainingSec)}초 · ${lock.reason || "safety"}`;
  }

  function formatSafeBypass(state) {
    if (!state || !state.active) return "대기";
    const age = positiveNumber(state.ageSec) ? ` · ${formatNumber(state.ageSec)}초 전` : "";
    return `원본 통과 · ${state.reason || "safe mode"}${age}`;
  }

  function formatTrimState(trimState) {
    if (!trimState || !trimState.active) return "없음";
    const source = trimState.statsSource === "session-marker" ? "marker" : trimState.statsSource === "live-or-recent" ? "live" : trimState.statsSource || "active";
    const age = positiveNumber(trimState.ageSec) ? ` · ${formatNumber(trimState.ageSec)}초` : "";
    return `${trimState.remembered ? "보존됨" : "감지됨"} · ${source}${age}`;
  }

  function formatCss(metrics) {
    const supported = Boolean(metrics && metrics.css && metrics.css.contentVisibilitySupported);
    const enabled = Boolean(metrics && metrics.settings && metrics.settings.cssContainmentEnabled);
    if (!supported) return "브라우저 미지원";
    return enabled ? "켜짐" : "꺼짐";
  }

  function formatCache(metrics) {
    const settings = metrics && metrics.settings ? metrics.settings : {};
    const api = metrics && metrics.api ? metrics.api : null;
    const cache = metrics && metrics.cache ? metrics.cache : {};
    const entries = positiveNumber(settings.apiCacheEntries) || positiveNumber(cache.entries) || 1;
    const maxKb = positiveNumber(settings.apiCacheMaxKb) || positiveNumber(cache.maxKb) || 256;
    let suffix = settings.safeNetworkMode ? " · safe initial-only" : "";
    if (cache && cache.suspended) suffix += ` · 일시중지 ${formatNumber(cache.suspendedForSec)}초 · ${cache.suspendedReason || "active"}`;
    else if (api && api.cacheHit) suffix += " · hit";
    else if (api && api.cacheStored) suffix += " · 저장됨";
    else if (api && api.cacheEligible === false) suffix += " · 미저장";
    return `${entries}개 · 항목당 ~${formatNumber(maxKb)}KB${suffix}`;
  }

  function formatApiPatch(metrics) {
    if (!metrics) return "미감지";
    if (metrics.mainWorldVersion) return `MAIN ${metrics.mainWorldVersion}`;
    return "미감지 · 탭 새로고침 필요";
  }

  function formatPatchHealth(health) {
    if (!health) return "미감지";
    const parts = [];
    parts.push(health.mainWorldDetected ? "MAIN 감지" : "MAIN 미감지");
    if (health.fallbackInjected) parts.push("fallback 주입");
    if (health.stableInitialTrim) parts.push(`stable trim ${formatNumber(health.stableInitialTrimAgeSec || 0)}초 전`);
    else if (health.hasTrimStats) parts.push("trim stats 있음");
    return parts.join(" · ");
  }

  function formatMaintenance(maintenance) {
    if (!maintenance || !maintenance.enabled) return "꺼짐";
    const last = Number(maintenance.lastRunAt);
    if (!last) return `${maintenance.intervalSec || 30}초 주기 · 대기`;
    const ageSec = Math.max(0, Math.round((Date.now() - last) / 1000));
    return `${maintenance.intervalSec || 30}초 주기 · ${ageSec}초 전`;
  }

  function formatMemory(memory) {
    if (!memory || !positiveNumber(memory.usedJSHeapSize)) return "미지원";
    const used = formatApproxBytes(memory.usedJSHeapSize);
    const total = positiveNumber(memory.totalJSHeapSize) ? formatApproxBytes(memory.totalJSHeapSize) : null;
    return total ? `${used} / ${total}` : `${used} 사용`;
  }

  function formatApproxBytes(value) {
    const n = Number(value) || 0;
    if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
    if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${Math.round(n)} B`;
  }

  function formatNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return Math.round(n).toLocaleString(getCurrentLanguage() === "ko" ? "ko-KR" : "en-US");
  }

  function shortenUrl(url) {
    if (!url) return "—";
    try {
      const parsed = new URL(url);
      return parsed.pathname || "/";
    } catch {
      return String(url).slice(0, 48);
    }
  }


  function renderUpdateIdle() {
    latestUpdateInfo = null;
    if (gitUpdateStatus) {
      setDatasetState(gitUpdateStatus, "idle");
      gitUpdateStatus.textContent = t("updateIdle");
    }
    clearUpdateLines();
    setDownloadButtonEnabled(false);
  }

  async function checkGitHubUpdate() {
    const repo = GITHUB_REPO;

    setDownloadButtonEnabled(false);
    setUpdateStatus(t("updateChecking"), "");
    clearUpdateLines();

    try {
      const info = await fetchUpdateInfo(repo);
      latestUpdateInfo = info;
      renderUpdateInfo(info);
      return info;
    } catch (error) {
      latestUpdateInfo = null;
      setUpdateStatus(t("updateFailed"), String(error && error.message ? error.message : error));
      clearUpdateLines();
      setDownloadButtonEnabled(false);
      return null;
    }
  }

  async function fetchUpdateInfo(repo) {
    const currentVersion = getCurrentVersion();
    const repoInfo = await fetchGitHubJson(`${GITHUB_API_ROOT}/${repo}`);
    const defaultBranch = repoInfo.default_branch || "main";

    const [releaseResult, manifestResult] = await Promise.allSettled([
      fetchLatestRelease(repo),
      fetchMainManifest(repo, defaultBranch)
    ]);

    const release = releaseResult.status === "fulfilled" ? releaseResult.value : null;
    const mainManifest = manifestResult.status === "fulfilled" ? manifestResult.value : null;
    const candidates = [];

    if (release && release.ok) {
      const releaseVersion = extractVersionFromStrings([
        release.data.name,
        release.data.tag_name,
        release.data.body,
        ...((release.data.assets || []).map((asset) => asset && asset.name))
      ]);
      const download = selectReleaseDownload(repo, release.data);
      candidates.push({
        source: "release",
        label: "latest release",
        version: releaseVersion,
        htmlUrl: release.data.html_url || `https://github.com/${repo}/releases/latest`,
        publishedAt: release.data.published_at || release.data.created_at || "",
        downloadUrl: download.url,
        downloadName: download.name,
        downloadKind: download.kind,
        raw: release.data
      });
    }

    if (mainManifest && mainManifest.ok) {
      candidates.push({
        source: "main",
        label: `${defaultBranch} branch`,
        version: mainManifest.manifest.version || "",
        htmlUrl: `https://github.com/${repo}`,
        publishedAt: repoInfo.pushed_at || repoInfo.updated_at || "",
        downloadUrl: `https://github.com/${repo}/archive/refs/heads/${encodeURIComponent(defaultBranch)}.zip`,
        downloadName: `${repo.split("/")[1]}-${defaultBranch}.zip`,
        downloadKind: "source zip",
        raw: mainManifest.manifest
      });
    }

    const versioned = candidates.filter((candidate) => candidate.version);
    const best = versioned.length
      ? versioned.sort((a, b) => compareVersions(b.version, a.version))[0]
      : candidates[0] || null;
    const compare = best && best.version ? compareVersions(best.version, currentVersion) : 0;

    return {
      repo,
      currentVersion,
      defaultBranch,
      release: release && release.ok ? release.data : null,
      releaseError: releaseResult.status === "rejected" ? String(releaseResult.reason && releaseResult.reason.message ? releaseResult.reason.message : releaseResult.reason) : null,
      mainManifest: mainManifest && mainManifest.ok ? mainManifest.manifest : null,
      mainError: manifestResult.status === "rejected" ? String(manifestResult.reason && manifestResult.reason.message ? manifestResult.reason.message : manifestResult.reason) : null,
      candidates,
      best,
      updateAvailable: Boolean(best && best.version && compare > 0),
      compare
    };
  }

  async function fetchLatestRelease(repo) {
    try {
      const data = await fetchGitHubJson(`${GITHUB_API_ROOT}/${repo}/releases/latest`);
      return { ok: true, data };
    } catch (error) {
      if (String(error && error.message ? error.message : error).includes("404")) return { ok: false, error: "no release" };
      throw error;
    }
  }

  async function fetchMainManifest(repo, branch) {
    const encodedPath = "manifest.json";
    const data = await fetchGitHubJson(`${GITHUB_API_ROOT}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`);
    if (!data || data.type !== "file" || !data.content) throw new Error("manifest.json not found on default branch");
    const decoded = decodeBase64Utf8(data.content);
    return { ok: true, manifest: JSON.parse(decoded) };
  }

  async function fetchGitHubJson(url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status}: ${response.statusText}`);
    return response.json();
  }

  function renderUpdateInfo(info) {
    clearUpdateLines();
    const best = info && info.best ? info.best : null;
    const current = info ? info.currentVersion : getCurrentVersion();
    const remote = best && best.version ? best.version : t("noRemoteVersion");

    if (!best) {
      setUpdateStatus(t("updateNoInfo"), "");
      appendUpdateLine(t("installedVersion"), current);
      appendUpdateLine(t("remoteVersion"), remote);
      setDownloadButtonEnabled(false);
      return;
    }

    setUpdateStatus(t("updateDone"), "");
    appendUpdateLine(t("installedVersion"), current);
    appendUpdateLine(t("remoteVersion"), remote);
    setDownloadButtonEnabled(Boolean(best.downloadUrl));
  }

  function formatReleaseSummary(release) {
    if (!release) return "미감지";
    const version = extractVersionFromStrings([release.name, release.tag_name, release.body]) || release.tag_name || release.name || "release";
    const date = release.published_at ? ` · ${formatDateShort(release.published_at)}` : "";
    return `${version}${date}`;
  }

  function selectReleaseDownload(repo, release) {
    const assets = Array.isArray(release && release.assets) ? release.assets : [];
    const zipAssets = assets
      .filter((asset) => asset && asset.browser_download_url && /\.zip(?:$|[?#])/i.test(asset.name || asset.browser_download_url))
      .sort((a, b) => scoreAsset(b) - scoreAsset(a));
    if (zipAssets.length) {
      const asset = zipAssets[0];
      return { url: asset.browser_download_url, name: asset.name || "latest.zip", kind: "release asset" };
    }
    if (release && release.zipball_url) {
      const name = `${repo.split("/")[1]}-${release.tag_name || "latest"}-source.zip`.replace(/[^\w.-]+/g, "-");
      return { url: release.zipball_url, name, kind: "source zip" };
    }
    return { url: "", name: "", kind: "" };
  }

  function scoreAsset(asset) {
    const name = String(asset && asset.name ? asset.name : "").toLowerCase();
    let score = 0;
    if (name.includes("chatgpt")) score += 4;
    if (name.includes("long")) score += 2;
    if (name.includes("loader")) score += 3;
    if (name.includes("chrome")) score += 3;
    if (name.includes("extension") || name.includes("extentsion")) score += 2;
    if (name.includes("source")) score -= 3;
    return score;
  }

  async function downloadLatestUpdate() {
    let info = latestUpdateInfo;
    if (!info || !info.best || !info.best.downloadUrl) info = await checkGitHubUpdate();
    const best = info && info.best ? info.best : null;
    if (!best || !best.downloadUrl) {
      setUpdateStatus(t("downloadUnavailable"), "");
      return;
    }

    const filename = sanitizeFilename(best.downloadName || `chatgpt-long-chat-loader-${best.version || "latest"}.zip`);
    if (chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download({ url: best.downloadUrl, filename, saveAs: true }, (downloadId) => {
        if (chrome.runtime.lastError) {
          setUpdateStatus(t("downloadUnavailable"), chrome.runtime.lastError.message || "downloads API error");
          return;
        }
        setUpdateStatus(t("downloadStarted"), "");
      });
    } else {
      openExternalPage(best.downloadUrl);
      setUpdateStatus(t("downloadOpened"), "");
    }
  }

  async function copySelectedMathForOffice() {
    if (mathCopyStatus) mathCopyStatus.textContent = t("mathCopying");
    const tab = await getActiveTab();
    if (!tab || !tab.id || !isProbablyChatGptUrl(tab.url)) {
      if (mathCopyStatus) mathCopyStatus.textContent = t("mathCopyNeedChatGpt");
      return;
    }

    let result = await sendCopyMathMessage(tab.id);
    if (!result.response || !result.response.ok) {
      const injected = await injectContentScripts(tab);
      if (injected.ok) {
        await delay(160);
        result = await sendCopyMathMessage(tab.id);
      }
    }

    const response = result.response;
    if (response && response.ok) {
      if (mathCopyStatus) mathCopyStatus.textContent = `${t("mathCopyDone")} · ${t("mathCopyFormula")} ${formatNumber(response.formulaCount || 1)} · ${response.mode || "Office"}`;
      await requestMetricsOnce();
      return;
    }

    const error = response && response.error ? response.error : result.error || t("mathCopyNotFound");
    if (mathCopyStatus) mathCopyStatus.textContent = error;
  }

  function sendCopyMathMessage(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { type: "cgpt-lb-copy-selection-math" }, (response) => {
        const error = chrome.runtime.lastError ? chrome.runtime.lastError.message : "";
        resolve({ response, error });
      });
    });
  }

  async function applyFastPreset() {
    const current = normalize(await storageGetAll());
    const next = normalize({
      ...current,
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
      showStatus: false
    });
    renderSettings(next);
    await storageSet(next);
    setMetricState("빠른 초기 로딩 프리셋 적용", "긴 대화 탭을 새로고침하면 가장 효과가 큽니다.");
    if (saved) saved.textContent = t("presetSaved");
    await reinjectCurrentTabPatch(false);
  }

  async function reinjectCurrentTabPatch(showStatus = true) {
    const tab = await getActiveTab();
    if (!tab || !tab.id || !isProbablyChatGptUrl(tab.url)) {
      if (showStatus) renderMetricUnavailable("ChatGPT 탭에서만 패치 재주입을 시도할 수 있습니다.");
      return { ok: false };
    }
    const injected = await injectContentScripts(tab);
    if (showStatus) {
      if (injected.ok) {
        setMetricState("패치 재주입 완료", "초기 fetch는 새로고침 후 가장 안정적으로 줄어듭니다.");
        await delay(180);
        await requestMetricsOnce();
      } else {
        renderMetricUnavailable(`패치 재주입 실패 · ${injected.error || "unknown"}`);
      }
    }
    return injected;
  }

  function setUpdateStatus(main, detail) {
    if (!gitUpdateStatus) return;
    setDatasetState(gitUpdateStatus, "custom");
    gitUpdateStatus.textContent = detail ? `${main} · ${detail}` : main;
  }

  function clearUpdateLines() {
    if (gitUpdateLines) gitUpdateLines.textContent = "";
  }

  function appendUpdateLine(label, value) {
    if (!gitUpdateLines) return;
    const row = document.createElement("div");
    row.className = "status-line";
    const left = document.createElement("span");
    left.textContent = label;
    const right = document.createElement("strong");
    right.textContent = value || "—";
    row.append(left, right);
    gitUpdateLines.appendChild(row);
  }

  function setDownloadButtonEnabled(enabled) {
    if (downloadGitUpdate) downloadGitUpdate.disabled = !enabled;
  }

  function getCurrentVersion() {
    try {
      return chrome.runtime.getManifest().version || "0.0.0";
    } catch {
      return "0.0.0";
    }
  }

  function getSettingValue(id) {
    const el = document.getElementById(id);
    if (!el) return DEFAULT_SETTINGS[id];
    return el.type === "checkbox" ? el.checked : el.value;
  }

  function normalizeTextSetting(id, value, fallback) {
    if (id === "branchTrackerShortcut" || id === "nextPromptQueueShortcut") return normalizeShortcut(value || fallback);
    return String(value || fallback || "").trim();
  }

  function captureShortcutFromKey(event) {
    if (!event || !event.target) return;
    const id = event.target.id;
    if (!TEXT_SETTING_IDS.has(id)) return;
    const shortcut = shortcutFromEvent(event, DEFAULT_SETTINGS[id]);
    if (!shortcut) return;
    if (typeof event.preventDefault === "function") event.preventDefault();
    if (typeof event.stopPropagation === "function") event.stopPropagation();
    event.target.value = shortcut;
    return saveFromForm();
  }

  function shortcutFromEvent(event, fallback) {
    const key = normalizeKeyName(event && event.key);
    if (!key || key === "control" || key === "ctrl" || key === "alt" || key === "shift" || key === "meta") return "";
    if (key === "backspace" || key === "delete") return fallback || DEFAULT_SETTINGS.nextPromptQueueShortcut;
    const parts = [];
    if (event.ctrlKey) parts.push("Ctrl");
    if (event.altKey) parts.push("Alt");
    if (event.shiftKey) parts.push("Shift");
    if (event.metaKey) parts.push("Meta");
    parts.push(formatShortcutKey(key));
    return normalizeShortcut(parts.join("+"));
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
    return parsed.key ? parsed : null;
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

  function normalizeGitHubRepo(value, fallback) {
    let text = String(value || "").trim();
    if (!text) text = fallback;
    text = text.replace(/^https?:\/\/github\.com\//i, "").replace(/^github\.com\//i, "");
    text = text.replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");
    const parts = text.split("/").filter(Boolean);
    if (parts.length >= 2) text = `${parts[0]}/${parts[1]}`;
    if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(text)) return text;
    return fallback;
  }

  function extractVersionFromStrings(values) {
    for (const value of values) {
      const text = String(value || "");
      const match = text.match(/(?:^|[^0-9A-Za-z])v?(\d+(?:\.\d+){1,3})(?:[-+][0-9A-Za-z.-]+)?/);
      if (match) return match[1];
    }
    return "";
  }

  function compareVersions(a, b) {
    const left = parseVersionParts(a);
    const right = parseVersionParts(b);
    for (let i = 0; i < Math.max(left.length, right.length, 4); i += 1) {
      const diff = (left[i] || 0) - (right[i] || 0);
      if (diff > 0) return 1;
      if (diff < 0) return -1;
    }
    return 0;
  }

  function parseVersionParts(value) {
    const match = String(value || "").match(/\d+(?:\.\d+){0,3}/);
    if (!match) return [0, 0, 0, 0];
    return match[0].split(".").map((part) => Number.parseInt(part, 10) || 0);
  }

  function decodeBase64Utf8(value) {
    const clean = String(value || "").replace(/\s+/g, "");
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function sanitizeFilename(value) {
    const filename = String(value || "latest.zip").replace(/[\\/:*?"<>|]+/g, "-").replace(/^\.+/, "");
    return filename.toLowerCase().endsWith(".zip") ? filename : `${filename}.zip`;
  }

  function formatDateShort(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(getCurrentLanguage() === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  function openExternalPage(url) {
    chrome.tabs.create({ url });
  }

  async function exportDebugLogFile() {
    const value = await storageGetKeys([DEBUG_LOG_KEY]);
    const entries = Array.isArray(value[DEBUG_LOG_KEY]) ? value[DEBUG_LOG_KEY] : [];
    const exportedAt = new Date();
    const payload = {
      schemaVersion: 1,
      exportedAt: exportedAt.toISOString(),
      extension: "ChatGPT Long Chat Loader",
      purpose: "Debug log export for GPT-assisted issue analysis",
      entries
    };
    downloadTextFile(
      `chatgpt-long-chat-loader-debug-${formatTimestampForFile(exportedAt)}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  }

  async function clearDebugLogEntries() {
    await storageRemove(DEBUG_LOG_KEY);
    if (saved) {
      saved.textContent = "디버그 로그 비움";
      clearTimeout(clearDebugLogEntries.timer);
      clearDebugLogEntries.timer = setTimeout(() => { saved.textContent = ""; }, 900);
    }
  }

  function downloadTextFile(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function formatTimestampForFile(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("") + "-" + [
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds())
    ].join("");
  }
})();
