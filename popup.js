(() => {
  "use strict";

  const DEFAULT_SETTINGS = Object.freeze({
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
  const TEXT_SETTING_IDS = new Set([]);
  const saved = document.getElementById("saved");
  const metricMain = document.getElementById("metricMain");
  const metricSub = document.getElementById("metricSub");
  const metricLines = document.getElementById("metricLines");
  const refreshMetrics = document.getElementById("refreshMetrics");
  const openReadme = document.getElementById("openReadme");
  const openReadmeKo = document.getElementById("openReadmeKo");
  const exportDebugLog = document.getElementById("exportDebugLog");
  const clearDebugLog = document.getElementById("clearDebugLog");
  const checkGitUpdate = document.getElementById("checkGitUpdate");
  const downloadGitUpdate = document.getElementById("downloadGitUpdate");
  const openGitRelease = document.getElementById("openGitRelease");
  const openExtensionsPage = document.getElementById("openExtensionsPage");
  const reloadExtension = document.getElementById("reloadExtension");
  const tryChromeAutoUpdateButton = document.getElementById("tryChromeAutoUpdate");
  const applyFastPresetButton = document.getElementById("applyFastPreset");
  const reinjectPatchButton = document.getElementById("reinjectPatch");
  const gitUpdateStatus = document.getElementById("gitUpdateStatus");
  const gitUpdateLines = document.getElementById("gitUpdateLines");
  const DEBUG_LOG_KEY = "cgptLongChatLoader.debugLog.v1";
  const UI_LANGUAGE_KEY = "cgptLongChatLoader.uiLanguage";
  const GITHUB_API_ROOT = "https://api.github.com/repos";
  let latestUpdateInfo = null;
  let currentLanguage = "ko";
  const README_URLS = Object.freeze({
    en: "https://github.com/ch040602/Chatgpt-web-booster_chrome_extentsion/blob/main/README.md",
    ko: "https://github.com/ch040602/Chatgpt-web-booster_chrome_extentsion/blob/main/README.ko.md"
  });
  const UI_TEXT = Object.freeze({
    en: {
      languageLabel: "Program language",
      openReadme: "English README",
      openReadmeKo: "Korean README",
      updateTitle: "GitHub update",
      checkGitUpdate: "Check update",
      tryChromeAutoUpdate: "Try Chrome auto update",
      downloadGitUpdate: "Download latest ZIP",
      openGitRelease: "Open release",
      openExtensionsPage: "Open extensions",
      reloadExtension: "Reload extension",
      metricsTitle: "Current tab estimate",
      refreshMetrics: "Recalculate",
      metricInitialMain: "Calculating",
      metricInitialSub: "Calculated only while the popup is open.",
      applyFastPreset: "Fast first-load preset",
      reinjectPatch: "Patch reinjection",
      enabledLabel: "Enable extension",
      apiTrimEnabledLabel: "Trim initial API responses",
      safeNetworkModeLabel: "Network Safe Mode",
      cssContainmentEnabledLabel: "CSS rendering containment",
      showStatusLabel: "Show status badge",
      maintenanceEnabledLabel: "Auto-clean while chatting",
      autoCollapseLoadedMessagesLabel: "Re-collapse loaded older messages",
      maintenanceIntervalSecLabel: "Maintenance interval (sec)",
      visibleTurnsLabel: "Recent turns shown first",
      loadMoreBatchLabel: "Load-more batch",
      prefetchBatchesLabel: "API prefetch batches",
      apiCacheEntriesLabel: "Response micro-cache entries",
      apiCacheMaxKbLabel: "Cache item limit (KB)",
      debugLabel: "Debug log",
      exportDebugLog: "Save debug log file",
      clearDebugLog: "Clear log",
      popupHint: "The response micro-cache defaults to 1 entry. v1.4.0 starts with the latest 2 turns for faster first loading and re-collapses older messages loaded through Load more on each maintenance cycle. During active replies, thinking/reasoning, or stream recovery, original conversation responses pass through. Automatic install/update is available only for Chrome Web Store or self-hosted CRX installs; developer-mode unpacked installs must download a release ZIP and replace the folder.",
      saved: "Saved",
      presetSaved: "Preset saved",
      debugLogCleared: "Debug log cleared",
      calculating: "Calculating",
      calculatingSub: "Fetching one snapshot from the current active ChatGPT tab.",
      metricUnavailable: "Unavailable",
      tabMetricsUnavailable: "Tab metrics are not available in this browser.",
      activeTabMissing: "No active tab found.",
      chatGptTabRequired: "Open the extension from a ChatGPT tab to calculate metrics.",
      contentNoResponse: "content script did not respond",
      refreshChatGpt: "Refresh the ChatGPT tab and try again.",
      notConversation: "Not a conversation view",
      notConversationSub: "Metrics are calculated on a ChatGPT new chat or conversation screen.",
      currentUrl: "Current URL",
      detected: "detected",
      estimateSub: (pct) => `Estimated ${pct}% less initial parsing, rendering, and layout work`,
      insufficientBaseline: "Insufficient baseline",
      insufficientBaselineSub: "Estimates appear after API trim records or hidden DOM are detected.",
      apiMessages: "API messages",
      apiSize: "API size (estimated)",
      domMessages: "DOM messages",
      loadMoreButton: "Load-more button",
      liveReplyProtection: "Live reply protection",
      safetyLock: "Safety lock",
      trimState: "Trim state",
      responseCache: "Response micro-cache",
      patchHealth: "Patch status",
      maintenance: "Maintenance",
      calculatedAt: "Calculated at",
      popupOpen: "Popup open",
      notDetected: "not detected",
      shown: "shown",
      hidden: "hidden",
      none: "none",
      hiddenState: "hidden",
      fullLoad: "full load",
      loadMore: "load more",
      visible: "visible",
      idle: "idle",
      active: "active",
      secondsAgo: (n) => `${n} sec ago`,
      protectedRecent: (n) => `${n} recent protected`,
      recoveryWait: (n) => `recovery wait ${n} sec`,
      originalPass: "original pass",
      savedState: "saved",
      unsaved: "not saved",
      remembered: "remembered",
      browserUnsupported: "browser unsupported",
      on: "on",
      off: "off",
      temporarilySuspended: (n) => `suspended ${n} sec`,
      perItemKb: (n) => `per item ~${n}KB`,
      refreshNeeded: "refresh tab needed",
      fallbackInjected: "fallback injected",
      trimStatsAvailable: "trim stats available",
      intervalIdle: (n) => `${n} sec interval · idle`,
      intervalAgo: (interval, age) => `${interval} sec interval · ${age} sec ago`,
      unsupported: "unsupported",
      used: "used",
      updateIdleMain: "Manual check pending",
      updateIdleDetail: "Press Check update to check the fixed repository.",
      checking: "Checking",
      checkingDetail: "Checking GitHub Releases and the main branch manifest.",
      checkFailed: "Check failed",
      noUpdateInfo: "No update info",
      noUpdateInfoDetail: "Could not find a GitHub release or main branch manifest.",
      currentVersion: "Current version",
      updateAvailable: "Update available",
      available: "available",
      localNewer: "Local is newer",
      installedRemote: (installed, remote) => `installed ${installed} / remote ${remote}`,
      latest: "Up to date",
      compareUnavailable: "Cannot compare versions",
      compareUnavailableDetail: "A download URL was found, but the remote version could not be parsed.",
      selectedRemote: "Selected remote",
      download: "Download",
      warning: "Note",
      updateNote: "Developer-mode/unpacked installs cannot replace files automatically. requestUpdateCheck works only for CRX/Web Store/self-hosted installs.",
      noDownload: "none",
      noDownloadDetail: "Could not find a GitHub release asset or source ZIP URL.",
      downloadUnavailable: "Download unavailable",
      downloadFailed: "Download failed",
      downloadStarted: "Download started",
      downloadStartedDetail: (id) => `download id: ${id}. Unzip it and replace the folder in extension management.`,
      downloadPageOpened: "Download page opened",
      downloadPageOpenedDetail: "The downloads API is unavailable, so the URL opened in a new tab.",
      chromeAutoChecking: "Checking Chrome auto update",
      chromeAutoCheckingDetail: "Calling runtime.requestUpdateCheck.",
      installType: "Install type",
      detectedVersion: "Detected version",
      updateDetected: "Update detected",
      updateDetectedDetail: "Reloading the extension so Chrome can apply the received update.",
      autoInstallUnavailable: "Automatic install unavailable",
      autoInstallUnavailableDetail: "This is a developer-mode/unpacked install. Download the release ZIP and replace the folder.",
      chromeNoUpdate: "No Chrome update",
      chromeNoUpdateDetail: "Checking release information as well.",
      fastPresetApplied: "Fast first-load preset applied",
      fastPresetDetail: "Refresh a long conversation tab for the strongest effect.",
      reinjectChatGptOnly: "Patch reinjection can be attempted only from a ChatGPT tab.",
      reinjectComplete: "Patch reinjection complete",
      reinjectCompleteDetail: "Initial fetch trimming is most stable after a refresh.",
      reinjectFailed: "Patch reinjection failed",
      managementOpenFailed: "Failed to open extension management",
      latestRelease: "latest release",
      branch: "branch"
    },
    ko: {
      languageLabel: "프로그램 언어",
      openReadme: "English README",
      openReadmeKo: "한국어 README",
      updateTitle: "GitHub 업데이트",
      checkGitUpdate: "업데이트 확인",
      tryChromeAutoUpdate: "Chrome 자동 업데이트 시도",
      downloadGitUpdate: "최신 ZIP 다운로드",
      openGitRelease: "릴리스 열기",
      openExtensionsPage: "확장 관리 열기",
      reloadExtension: "확장 재로드",
      metricsTitle: "현재 탭 추정",
      refreshMetrics: "다시 계산",
      metricInitialMain: "계산 중",
      metricInitialSub: "팝업이 열려 있을 때만 계산합니다.",
      applyFastPreset: "빠른 초기 로딩 프리셋",
      reinjectPatch: "패치 재주입",
      enabledLabel: "확장 기능 사용",
      apiTrimEnabledLabel: "초기 API 응답 줄이기",
      safeNetworkModeLabel: "네트워크 안전 모드",
      cssContainmentEnabledLabel: "CSS 렌더링 containment",
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
      popupHint: "응답 micro-cache는 기본 1개입니다. v1.4.0 기본값은 첫 로딩을 더 빠르게 하기 위해 최근 2턴 중심으로 시작하며, 더보기로 불러온 과거 메시지는 자동 정리 주기마다 다시 접습니다. 답변 생성·thinking/reasoning·스트림 복구 중에는 원본 conversation 응답을 통과시킵니다. 자동 설치/업데이트는 Chrome Web Store 또는 self-hosted CRX 설치에서만 Chrome update check가 가능하고, 개발자 모드 unpacked 설치는 릴리스 ZIP 다운로드 후 폴더 교체가 필요합니다.",
      saved: "저장됨",
      presetSaved: "프리셋 저장됨",
      debugLogCleared: "디버그 로그 비움",
      calculating: "계산 중",
      calculatingSub: "현재 활성 ChatGPT 탭에서 snapshot을 한 번 가져옵니다.",
      metricUnavailable: "계산 불가",
      tabMetricsUnavailable: "현재 브라우저에서 탭 측정을 사용할 수 없습니다.",
      activeTabMissing: "활성 탭을 찾지 못했습니다.",
      chatGptTabRequired: "ChatGPT 탭에서 확장 아이콘을 눌러야 계산됩니다.",
      contentNoResponse: "content script 응답 없음",
      refreshChatGpt: "ChatGPT 탭을 새로고침한 뒤 다시 여세요.",
      notConversation: "대화 화면 아님",
      notConversationSub: "ChatGPT 새 채팅 또는 대화 화면에서 계산됩니다.",
      currentUrl: "현재 URL",
      detected: "감지됨",
      estimateSub: (pct) => `초기 파싱·렌더링·layout 작업 약 ${pct}% 감소 추정`,
      insufficientBaseline: "기준 부족",
      insufficientBaselineSub: "API trim 기록 또는 숨김 DOM이 감지되면 추정치를 계산합니다.",
      apiMessages: "API 메시지",
      apiSize: "API 크기(추정)",
      domMessages: "DOM 메시지",
      loadMoreButton: "더보기 버튼",
      liveReplyProtection: "응답 진행 보호",
      safetyLock: "보안 안전 잠금",
      trimState: "Trim 상태",
      responseCache: "응답 micro-cache",
      patchHealth: "패치 상태",
      maintenance: "자동 정리",
      calculatedAt: "계산 시점",
      popupOpen: "팝업 열림 상태",
      notDetected: "미감지",
      shown: "표시",
      hidden: "숨김",
      none: "없음",
      hiddenState: "숨김",
      fullLoad: "전체 로드",
      loadMore: "더보기",
      visible: "표시",
      idle: "대기",
      active: "활성",
      secondsAgo: (n) => `${n}초 전`,
      protectedRecent: (n) => `최근 ${n}개 보호`,
      recoveryWait: (n) => `복구 대기 ${n}초`,
      originalPass: "원본 통과",
      savedState: "저장됨",
      unsaved: "미저장",
      remembered: "보존됨",
      browserUnsupported: "브라우저 미지원",
      on: "켜짐",
      off: "꺼짐",
      temporarilySuspended: (n) => `일시중지 ${n}초`,
      perItemKb: (n) => `항목당 ~${n}KB`,
      refreshNeeded: "탭 새로고침 필요",
      fallbackInjected: "fallback 주입",
      trimStatsAvailable: "trim stats 있음",
      intervalIdle: (n) => `${n}초 주기 · 대기`,
      intervalAgo: (interval, age) => `${interval}초 주기 · ${age}초 전`,
      unsupported: "미지원",
      used: "사용",
      updateIdleMain: "수동 확인 전",
      updateIdleDetail: "업데이트 확인 버튼을 누르면 고정된 저장소를 확인합니다.",
      checking: "확인 중",
      checkingDetail: "GitHub release와 main branch manifest를 확인합니다.",
      checkFailed: "확인 실패",
      noUpdateInfo: "업데이트 정보 없음",
      noUpdateInfoDetail: "GitHub release 또는 main branch manifest를 찾지 못했습니다.",
      currentVersion: "현재 버전",
      updateAvailable: "업데이트 있음",
      available: "사용 가능",
      localNewer: "로컬이 더 최신",
      installedRemote: (installed, remote) => `설치 버전 ${installed} / 원격 ${remote}`,
      latest: "최신 상태",
      compareUnavailable: "버전 비교 불가",
      compareUnavailableDetail: "다운로드 URL은 찾았지만 원격 버전을 파싱하지 못했습니다.",
      selectedRemote: "선택된 원격",
      download: "다운로드",
      warning: "주의",
      updateNote: "개발자 모드/unpacked는 자동 파일 교체 불가. CRX/Web Store/self-hosted 설치만 requestUpdateCheck 가능",
      noDownload: "없음",
      noDownloadDetail: "GitHub release asset 또는 source ZIP URL을 찾지 못했습니다.",
      downloadUnavailable: "다운로드 불가",
      downloadFailed: "다운로드 실패",
      downloadStarted: "다운로드 시작",
      downloadStartedDetail: (id) => `download id: ${id}. 압축 해제 후 확장 관리에서 교체하세요.`,
      downloadPageOpened: "다운로드 페이지 열림",
      downloadPageOpenedDetail: "downloads API를 사용할 수 없어 URL을 새 탭으로 열었습니다.",
      chromeAutoChecking: "Chrome 자동 업데이트 확인 중",
      chromeAutoCheckingDetail: "runtime.requestUpdateCheck를 호출합니다.",
      installType: "설치 유형",
      detectedVersion: "감지 버전",
      updateDetected: "업데이트 감지",
      updateDetectedDetail: "Chrome이 받은 업데이트를 적용하기 위해 확장을 재로드합니다.",
      autoInstallUnavailable: "자동 설치 불가",
      autoInstallUnavailableDetail: "현재 개발자 모드/unpacked 설치입니다. 릴리스 ZIP 다운로드 후 폴더 교체가 필요합니다.",
      chromeNoUpdate: "Chrome 업데이트 없음",
      chromeNoUpdateDetail: "릴리스 정보도 함께 확인합니다.",
      fastPresetApplied: "빠른 초기 로딩 프리셋 적용",
      fastPresetDetail: "긴 대화 탭을 새로고침하면 가장 효과가 큽니다.",
      reinjectChatGptOnly: "ChatGPT 탭에서만 패치 재주입을 시도할 수 있습니다.",
      reinjectComplete: "패치 재주입 완료",
      reinjectCompleteDetail: "초기 fetch는 새로고침 후 가장 안정적으로 줄어듭니다.",
      reinjectFailed: "패치 재주입 실패",
      managementOpenFailed: "관리 페이지 열기 실패",
      latestRelease: "latest release",
      branch: "branch"
    }
  });

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const stored = await storageGetAll();
    currentLanguage = normalizeLanguage(stored[UI_LANGUAGE_KEY]);
    const settings = normalize(stored);
    renderSettings(settings);
    applyLanguage(currentLanguage);
    await storageSet(settings);

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.addEventListener("change", saveFromForm);
      if (el.type === "number") el.addEventListener("input", saveFromForm);
    }

    const uiLanguage = document.getElementById("uiLanguage");
    if (uiLanguage) uiLanguage.addEventListener("change", saveLanguageMode);
    if (refreshMetrics) refreshMetrics.addEventListener("click", requestMetricsOnce);
    if (openReadme) openReadme.addEventListener("click", () => openExternalPage(README_URLS.en));
    if (openReadmeKo) openReadmeKo.addEventListener("click", () => openExternalPage(README_URLS.ko));
    if (exportDebugLog) exportDebugLog.addEventListener("click", exportDebugLogFile);
    if (clearDebugLog) clearDebugLog.addEventListener("click", clearDebugLogEntries);
    if (checkGitUpdate) checkGitUpdate.addEventListener("click", checkGitHubUpdate);
    if (downloadGitUpdate) downloadGitUpdate.addEventListener("click", downloadLatestUpdate);
    if (openGitRelease) openGitRelease.addEventListener("click", openLatestReleasePage);
    if (openExtensionsPage) openExtensionsPage.addEventListener("click", openChromeExtensionsPage);
    if (reloadExtension) reloadExtension.addEventListener("click", () => chrome.runtime.reload());
    if (tryChromeAutoUpdateButton) tryChromeAutoUpdateButton.addEventListener("click", tryChromeAutoUpdate);
    if (applyFastPresetButton) applyFastPresetButton.addEventListener("click", applyFastPreset);
    if (reinjectPatchButton) reinjectPatchButton.addEventListener("click", reinjectCurrentTabPatch);

    renderUpdateIdle();
    requestMetricsOnce();
  }

  function normalizeLanguage(value) {
    return value === "en" ? "en" : "ko";
  }

  function t(key, ...args) {
    const table = UI_TEXT[currentLanguage] || UI_TEXT.ko;
    const value = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : UI_TEXT.ko[key];
    return typeof value === "function" ? value(...args) : String(value ?? key);
  }

  function applyLanguage(language) {
    currentLanguage = normalizeLanguage(language);
    if (document.documentElement) document.documentElement.lang = currentLanguage;
    const uiLanguage = document.getElementById("uiLanguage");
    if (uiLanguage) uiLanguage.value = currentLanguage;

    const textIds = [
      "languageLabel",
      "openReadme",
      "openReadmeKo",
      "updateTitle",
      "checkGitUpdate",
      "tryChromeAutoUpdate",
      "downloadGitUpdate",
      "openGitRelease",
      "openExtensionsPage",
      "reloadExtension",
      "metricsTitle",
      "refreshMetrics",
      "applyFastPreset",
      "reinjectPatch",
      "enabledLabel",
      "apiTrimEnabledLabel",
      "safeNetworkModeLabel",
      "cssContainmentEnabledLabel",
      "showStatusLabel",
      "maintenanceEnabledLabel",
      "autoCollapseLoadedMessagesLabel",
      "maintenanceIntervalSecLabel",
      "visibleTurnsLabel",
      "loadMoreBatchLabel",
      "prefetchBatchesLabel",
      "apiCacheEntriesLabel",
      "apiCacheMaxKbLabel",
      "debugLabel",
      "exportDebugLog",
      "clearDebugLog",
      "popupHint"
    ];
    for (const id of textIds) {
      const el = document.getElementById(id);
      if (el) el.textContent = t(id);
    }
  }

  async function saveLanguageMode() {
    const uiLanguage = document.getElementById("uiLanguage");
    const language = normalizeLanguage(uiLanguage && uiLanguage.value);
    applyLanguage(language);
    await storageSet({ [UI_LANGUAGE_KEY]: language });
    renderUpdateIdle();
    scheduleMetricRefresh();
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
      const payload = value && typeof value === "object" ? { ...value, "cgptLongChatLoader.defaultsVersion": "1.4.0" } : value;
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
      else if (TEXT_SETTING_IDS.has(id)) next[id] = normalizeGitHubRepo(el.value, DEFAULT_SETTINGS[id]);
      else next[id] = el.value;
    }

    const normalized = normalize(next);
    renderSettings(normalized);
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
    const defaultsVersion = String(source.cgptLongChatLoaderDefaultsVersion || source["cgptLongChatLoader.defaultsVersion"] || "");
    const looksLikeOldDefault =
      (!Object.prototype.hasOwnProperty.call(source, "visibleTurns") || Number(source.visibleTurns) === 3) &&
      (!Object.prototype.hasOwnProperty.call(source, "loadMoreBatch") || Number(source.loadMoreBatch) === 3 || Number(source.loadMoreBatch) === 4) &&
      (!Object.prototype.hasOwnProperty.call(source, "prefetchBatches") || Number(source.prefetchBatches) === 1) &&
      (!Object.prototype.hasOwnProperty.call(source, "apiCacheMaxKb") || Number(source.apiCacheMaxKb) === 512) &&
      (!Object.prototype.hasOwnProperty.call(source, "maintenanceIntervalSec") || Number(source.maintenanceIntervalSec) === 45);
    if (defaultsVersion !== "1.4.0" && looksLikeOldDefault) {
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
      showStatus: Boolean(merged.showStatus),
      debug: Boolean(merged.debug)
    };
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
    setMetricState(t("calculating"), t("calculatingSub"));
    clearMetricLines();

    if (!chrome.tabs || !chrome.runtime) {
      renderMetricUnavailable(t("tabMetricsUnavailable"));
      return;
    }

    const tab = await getActiveTab();
    const tabId = tab && tab.id;
    if (!tabId) {
      renderMetricUnavailable(t("activeTabMissing"));
      return;
    }

    let result = await sendMetricsMessage(tabId);
    if (!result.response || !result.response.ok) {
      const injected = await injectContentScripts(tab);
      if (injected.ok) {
        await delay(160);
        result = await sendMetricsMessage(tabId);
      } else if (injected.error && !isProbablyChatGptUrl(tab.url)) {
        renderMetricUnavailable(t("chatGptTabRequired"));
        return;
      }
    }

    if (!result.response || !result.response.ok) {
      const detail = result.error ? ` · ${result.error}` : "";
      renderMetricUnavailable(`${t("contentNoResponse")}${detail}. ${t("refreshChatGpt")}`);
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
    setMetricState(t("metricUnavailable"), message);
    clearMetricLines();
  }

  function renderMetrics(metrics) {
    clearMetricLines();
    const estimate = estimateImprovement(metrics);

    if (!metrics.routeActive) {
      setMetricState(t("notConversation"), t("notConversationSub"));
      appendMetricLine(t("currentUrl"), shortenUrl(metrics.url));
      appendMetricLine("content script", metrics.contentVersion || t("detected"));
      return;
    }

    if (estimate) {
      setMetricState(
        currentLanguage === "ko"
          ? `${estimate.multiplierLow.toFixed(1)}~${estimate.multiplierHigh.toFixed(1)}배`
          : `${estimate.multiplierLow.toFixed(1)}~${estimate.multiplierHigh.toFixed(1)}x`,
        t("estimateSub", estimate.reductionPct)
      );
    } else {
      setMetricState(t("insufficientBaseline"), t("insufficientBaselineSub"));
    }

    appendMetricLine(t("apiMessages"), formatApiMessages(metrics.api));
    appendMetricLine(t("apiSize"), formatApiSize(metrics.api));
    appendMetricLine(t("domMessages"), formatDom(metrics.dom));
    appendMetricLine(t("loadMoreButton"), formatLoadMore(metrics.loadMore));
    appendMetricLine(t("liveReplyProtection"), formatLiveReply(metrics.liveReply));
    appendMetricLine("Live API rewrite", formatLiveTrimBypass(metrics.liveTrimBypass));
    appendMetricLine("Thinking shield", formatThinkingShield(metrics));
    appendMetricLine(t("safetyLock"), formatSafetyLock(metrics.safetyLock));
    appendMetricLine("Safe original pass", formatSafeBypass(metrics.safeBypass));
    appendMetricLine(t("trimState"), formatTrimState(metrics.trimState));
    appendMetricLine(t("responseCache"), formatCache(metrics));
    appendMetricLine("API patch", formatApiPatch(metrics));
    appendMetricLine(t("patchHealth"), formatPatchHealth(metrics.patchHealth));
    appendMetricLine("CSS containment", formatCss(metrics));
    appendMetricLine(t("maintenance"), formatMaintenance(metrics.maintenance));
    appendMetricLine("JS heap", formatMemory(metrics.memory));
    appendMetricLine("DOM nodes", formatNumber(metrics.dom && metrics.dom.nodes));
    appendMetricLine(t("calculatedAt"), t("popupOpen"));
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
    if (!api) return t("notDetected");
    const total = positiveNumber(api.totalRenderableMessages || api.totalVisibleMessages);
    const kept = positiveNumber(api.keptRenderableMessages || api.keptVisibleMessages);
    if (!total) return t("notDetected");
    return `${formatNumber(kept || total)}/${formatNumber(total)}`;
  }

  function formatApiSize(api) {
    if (!api) return t("notDetected");
    const original = positiveNumber(api.originalChars || api.originalBytes);
    const trimmed = positiveNumber(api.trimmedChars || api.trimmedBytes) || original;
    if (!original) return t("notDetected");
    const saved = Math.max(0, original - trimmed);
    const pct = Math.round((saved / original) * 100);
    return `${formatApproxBytes(trimmed)} / ${formatApproxBytes(original)} · -${pct}%`;
  }

  function formatDom(dom) {
    if (!dom || !positiveNumber(dom.total)) return t("notDetected");
    return `${formatNumber(dom.visible)}/${formatNumber(dom.total)} ${t("shown")} · ${t("hidden")} ${formatNumber(dom.hidden)}`;
  }

  function formatLoadMore(loadMore) {
    if (!loadMore || !loadMore.inDom) return t("none");
    if (!loadMore.visible) return t("hiddenState");
    const mode = loadMore.mode === "full" ? t("fullLoad") : loadMore.mode === "more" ? t("loadMore") : loadMore.mode;
    const placement = loadMore.placement && loadMore.placement !== "none" ? ` · ${loadMore.placement}` : "";
    return `${mode} · ${loadMore.reason || t("visible")}${placement}`;
  }

  function formatLiveReply(liveReply) {
    if (!liveReply || !liveReply.active) return t("idle");
    const age = positiveNumber(liveReply.ageSec) ? ` · ${t("secondsAgo", formatNumber(liveReply.ageSec))}` : "";
    const count = positiveNumber(liveReply.protectedCount) ? ` · ${t("protectedRecent", formatNumber(liveReply.protectedCount))}` : "";
    const recovery = liveReply.streamRecovery ? ` · ${t("recoveryWait", formatNumber(liveReply.streamRecoveryAgeSec || 0))}` : "";
    return `${t("active")} · ${liveReply.reason || "reply"}${age}${count}${recovery}`;
  }

  function formatLiveTrimBypass(state) {
    if (!state || !state.active) return t("idle");
    return `${t("originalPass")} · ${formatNumber(state.remainingSec)}${currentLanguage === "ko" ? "초" : " sec"} · ${state.reason || "active reply"}`;
  }

  function formatThinkingShield(metrics) {
    const live = metrics && metrics.liveReply ? metrics.liveReply : {};
    const bypass = metrics && metrics.liveTrimBypass ? metrics.liveTrimBypass : {};
    const reason = String(live.reason || bypass.reason || "");
    const active = Boolean((live.active || bypass.active) && /think|reason|analysis|analyz|추론|생각|분석/i.test(reason));
    if (!active) return t("idle");
    const remaining = positiveNumber(bypass.remainingSec) ? ` · ${formatNumber(bypass.remainingSec)}${currentLanguage === "ko" ? "초" : " sec"} ${t("originalPass")}` : "";
    return `${t("active")} · ${reason}${remaining}`;
  }

  function formatSafetyLock(lock) {
    if (!lock || !lock.active) return t("idle");
    return `${t("active")} · ${formatNumber(lock.remainingSec)}${currentLanguage === "ko" ? "초" : " sec"} · ${lock.reason || "safety"}`;
  }

  function formatSafeBypass(state) {
    if (!state || !state.active) return t("idle");
    const age = positiveNumber(state.ageSec) ? ` · ${t("secondsAgo", formatNumber(state.ageSec))}` : "";
    return `${t("originalPass")} · ${state.reason || "safe mode"}${age}`;
  }

  function formatTrimState(trimState) {
    if (!trimState || !trimState.active) return t("none");
    const source = trimState.statsSource === "session-marker" ? "marker" : trimState.statsSource === "live-or-recent" ? "live" : trimState.statsSource || "active";
    const age = positiveNumber(trimState.ageSec) ? ` · ${formatNumber(trimState.ageSec)}${currentLanguage === "ko" ? "초" : " sec"}` : "";
    return `${trimState.remembered ? t("remembered") : t("detected")} · ${source}${age}`;
  }

  function formatCss(metrics) {
    const supported = Boolean(metrics && metrics.css && metrics.css.contentVisibilitySupported);
    const enabled = Boolean(metrics && metrics.settings && metrics.settings.cssContainmentEnabled);
    if (!supported) return t("browserUnsupported");
    return enabled ? t("on") : t("off");
  }

  function formatCache(metrics) {
    const settings = metrics && metrics.settings ? metrics.settings : {};
    const api = metrics && metrics.api ? metrics.api : null;
    const cache = metrics && metrics.cache ? metrics.cache : {};
    const entries = positiveNumber(settings.apiCacheEntries) || positiveNumber(cache.entries) || 1;
    const maxKb = positiveNumber(settings.apiCacheMaxKb) || positiveNumber(cache.maxKb) || 256;
    let suffix = settings.safeNetworkMode ? " · safe initial-only" : "";
    if (cache && cache.suspended) suffix += ` · ${t("temporarilySuspended", formatNumber(cache.suspendedForSec))} · ${cache.suspendedReason || "active"}`;
    else if (api && api.cacheHit) suffix += " · hit";
    else if (api && api.cacheStored) suffix += ` · ${t("savedState")}`;
    else if (api && api.cacheEligible === false) suffix += ` · ${t("unsaved")}`;
    return `${formatNumber(entries)}${currentLanguage === "ko" ? "개" : ""} · ${t("perItemKb", formatNumber(maxKb))}${suffix}`;
  }

  function formatApiPatch(metrics) {
    if (!metrics) return t("notDetected");
    if (metrics.mainWorldVersion) return `MAIN ${metrics.mainWorldVersion}`;
    return `${t("notDetected")} · ${t("refreshNeeded")}`;
  }

  function formatPatchHealth(health) {
    if (!health) return t("notDetected");
    const parts = [];
    parts.push(health.mainWorldDetected ? `MAIN ${t("detected")}` : `MAIN ${t("notDetected")}`);
    if (health.fallbackInjected) parts.push(t("fallbackInjected"));
    if (health.stableInitialTrim) parts.push(`stable trim ${t("secondsAgo", formatNumber(health.stableInitialTrimAgeSec || 0))}`);
    else if (health.hasTrimStats) parts.push(t("trimStatsAvailable"));
    return parts.join(" · ");
  }

  function formatMaintenance(maintenance) {
    if (!maintenance || !maintenance.enabled) return t("off");
    const last = Number(maintenance.lastRunAt);
    if (!last) return t("intervalIdle", maintenance.intervalSec || 30);
    const ageSec = Math.max(0, Math.round((Date.now() - last) / 1000));
    return t("intervalAgo", maintenance.intervalSec || 30, ageSec);
  }

  function formatMemory(memory) {
    if (!memory || !positiveNumber(memory.usedJSHeapSize)) return t("unsupported");
    const used = formatApproxBytes(memory.usedJSHeapSize);
    const total = positiveNumber(memory.totalJSHeapSize) ? formatApproxBytes(memory.totalJSHeapSize) : null;
    return total ? `${used} / ${total}` : `${used} ${t("used")}`;
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
    return Math.round(n).toLocaleString(currentLanguage === "en" ? "en-US" : "ko-KR");
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
    setUpdateStatus(t("updateIdleMain"), t("updateIdleDetail"));
    clearUpdateLines();
    setDownloadButtonEnabled(false);
  }

  async function checkGitHubUpdate() {
    const repo = GITHUB_REPO;

    setDownloadButtonEnabled(false);
    setUpdateStatus(t("checking"), t("checkingDetail"));
    clearUpdateLines();

    try {
      const info = await fetchUpdateInfo(repo);
      latestUpdateInfo = info;
      renderUpdateInfo(info);
      return info;
    } catch (error) {
      latestUpdateInfo = null;
      setUpdateStatus(t("checkFailed"), String(error && error.message ? error.message : error));
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
        label: t("latestRelease"),
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
        label: `${defaultBranch} ${t("branch")}`,
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
    if (!best) {
      setUpdateStatus(t("noUpdateInfo"), t("noUpdateInfoDetail"));
      appendUpdateLine(t("currentVersion"), info ? info.currentVersion : getCurrentVersion());
      setDownloadButtonEnabled(false);
      return;
    }

    if (info.updateAvailable) {
      setUpdateStatus(t("updateAvailable"), `${best.label} ${best.version} ${t("available")}`);
    } else if (best.version && info.compare < 0) {
      setUpdateStatus(t("localNewer"), t("installedRemote", info.currentVersion, best.version));
    } else if (best.version) {
      setUpdateStatus(t("latest"), t("installedRemote", info.currentVersion, best.version));
    } else {
      setUpdateStatus(t("compareUnavailable"), t("compareUnavailableDetail"));
    }

    appendUpdateLine(t("currentVersion"), info.currentVersion);
    appendUpdateLine(t("selectedRemote"), `${best.label}${best.version ? ` · ${best.version}` : ""}`);
    appendUpdateLine("Release", formatReleaseSummary(info.release));
    appendUpdateLine("main manifest", info.mainManifest && info.mainManifest.version ? info.mainManifest.version : (info.mainError || t("notDetected")));
    appendUpdateLine(t("download"), best.downloadUrl ? `${best.downloadKind || "zip"} · ${best.downloadName || "latest"}` : t("noDownload"));
    appendUpdateLine(t("warning"), t("updateNote"));
    setDownloadButtonEnabled(Boolean(best.downloadUrl));
  }

  function formatReleaseSummary(release) {
    if (!release) return t("notDetected");
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
      setUpdateStatus(t("downloadUnavailable"), t("noDownloadDetail"));
      return;
    }

    const filename = sanitizeFilename(best.downloadName || `chatgpt-long-chat-loader-${best.version || "latest"}.zip`);
    if (chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download({ url: best.downloadUrl, filename, saveAs: true }, (downloadId) => {
        if (chrome.runtime.lastError) {
          setUpdateStatus(t("downloadFailed"), chrome.runtime.lastError.message || "downloads API error");
          return;
        }
        setUpdateStatus(t("downloadStarted"), t("downloadStartedDetail", downloadId));
      });
    } else {
      openExternalPage(best.downloadUrl);
      setUpdateStatus(t("downloadPageOpened"), t("downloadPageOpenedDetail"));
    }
  }

  async function tryChromeAutoUpdate() {
    setUpdateStatus(t("chromeAutoChecking"), t("chromeAutoCheckingDetail"));
    clearUpdateLines();
    const self = await getSelfInfo();
    if (self && self.installType) appendUpdateLine(t("installType"), self.installType);

    const result = await requestChromeUpdateCheck();
    appendUpdateLine("Chrome update check", result.status || result.error || "unknown");
    if (result.version) appendUpdateLine(t("detectedVersion"), result.version);

    if (result.status === "update_available") {
      setUpdateStatus(t("updateDetected"), t("updateDetectedDetail"));
      setTimeout(() => chrome.runtime.reload(), 500);
      return;
    }

    if (self && self.installType === "development") {
      setUpdateStatus(t("autoInstallUnavailable"), t("autoInstallUnavailableDetail"));
      await checkGitHubUpdate();
      return;
    }

    setUpdateStatus(t("chromeNoUpdate"), t("chromeNoUpdateDetail"));
    await checkGitHubUpdate();
  }

  function getSelfInfo() {
    return new Promise((resolve) => {
      try {
        if (!chrome.management || !chrome.management.getSelf) return resolve(null);
        chrome.management.getSelf((info) => {
          if (chrome.runtime.lastError) return resolve(null);
          resolve(info || null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  function requestChromeUpdateCheck() {
    return new Promise((resolve) => {
      try {
        if (!chrome.runtime || !chrome.runtime.requestUpdateCheck) return resolve({ error: "requestUpdateCheck unavailable" });
        chrome.runtime.requestUpdateCheck((status, details) => {
          const error = chrome.runtime.lastError ? chrome.runtime.lastError.message : "";
          if (error) return resolve({ error });
          resolve({ status, version: details && details.version });
        });
      } catch (error) {
        resolve({ error: String(error && error.message ? error.message : error) });
      }
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
      showStatus: false
    });
    renderSettings(next);
    await storageSet(next);
    setMetricState(t("fastPresetApplied"), t("fastPresetDetail"));
    if (saved) saved.textContent = t("presetSaved");
    await reinjectCurrentTabPatch(false);
  }

  async function reinjectCurrentTabPatch(showStatus = true) {
    const tab = await getActiveTab();
    if (!tab || !tab.id || !isProbablyChatGptUrl(tab.url)) {
      if (showStatus) renderMetricUnavailable(t("reinjectChatGptOnly"));
      return { ok: false };
    }
    const injected = await injectContentScripts(tab);
    if (showStatus) {
      if (injected.ok) {
        setMetricState(t("reinjectComplete"), t("reinjectCompleteDetail"));
        await delay(180);
        await requestMetricsOnce();
      } else {
        renderMetricUnavailable(`${t("reinjectFailed")} · ${injected.error || "unknown"}`);
      }
    }
    return injected;
  }

  function openLatestReleasePage() {
    const repo = GITHUB_REPO;
    const url = latestUpdateInfo && latestUpdateInfo.best && latestUpdateInfo.best.htmlUrl
      ? latestUpdateInfo.best.htmlUrl
      : `https://github.com/${repo}/releases/latest`;
    openExternalPage(url);
  }

  function openChromeExtensionsPage() {
    try {
      chrome.tabs.create({ url: "chrome://extensions/" }, () => {
        if (chrome.runtime.lastError) setUpdateStatus(t("managementOpenFailed"), chrome.runtime.lastError.message);
      });
    } catch (error) {
      setUpdateStatus(t("managementOpenFailed"), String(error && error.message ? error.message : error));
    }
  }

  function setUpdateStatus(main, detail) {
    if (!gitUpdateStatus) return;
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
    return date.toLocaleDateString(currentLanguage === "en" ? "en-US" : "ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
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
      saved.textContent = t("debugLogCleared");
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
