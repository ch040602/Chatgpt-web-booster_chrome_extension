(() => {
  "use strict";

  const DEFAULTS_VERSION_KEY = "cgptLongChatLoader.defaultsVersion";

  if (chrome.runtime && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(() => {
      chrome.storage.local.get(null, (value) => {
        const current = value || {};
        const patch = {};
        const defaultsVersion = String(current[DEFAULTS_VERSION_KEY] || "");
        const looksLikeOldDefault =
          (!Object.prototype.hasOwnProperty.call(current, "visibleTurns") || Number(current.visibleTurns) === 3) &&
          (!Object.prototype.hasOwnProperty.call(current, "loadMoreBatch") || Number(current.loadMoreBatch) === 3 || Number(current.loadMoreBatch) === 4) &&
          (!Object.prototype.hasOwnProperty.call(current, "prefetchBatches") || Number(current.prefetchBatches) === 1) &&
          (!Object.prototype.hasOwnProperty.call(current, "apiCacheMaxKb") || Number(current.apiCacheMaxKb) === 512) &&
          (!Object.prototype.hasOwnProperty.call(current, "maintenanceIntervalSec") || Number(current.maintenanceIntervalSec) === 45);

        const visibleTurnsNum = Number(current.visibleTurns);
        const loadMoreBatchNum = Number(current.loadMoreBatch);
        const prefetchBatchesNum = Number(current.prefetchBatches);

        if (defaultsVersion !== "1.5.3" && looksLikeOldDefault) {
          patch.visibleTurns = 2;
          patch.loadMoreBatch = 2;
          patch.prefetchBatches = 0;
          patch.apiCacheMaxKb = 256;
          patch.maintenanceIntervalSec = 60;
          patch.autoCollapseLoadedMessages = true;
        }

        if (!Number.isFinite(visibleTurnsNum) || visibleTurnsNum > 8) patch.visibleTurns = 2;
        if (!Number.isFinite(loadMoreBatchNum) || loadMoreBatchNum > 12) patch.loadMoreBatch = 2;
        if (!Number.isFinite(prefetchBatchesNum) || prefetchBatchesNum > 2) patch.prefetchBatches = 0;

        if (!Object.prototype.hasOwnProperty.call(current, "languageMode")) patch.languageMode = "ko";
        if (!Number.isFinite(Number(current.apiCacheEntries)) || Number(current.apiCacheEntries) < 1) patch.apiCacheEntries = 1;
        if (!Number.isFinite(Number(current.apiCacheMaxKb)) || Number(current.apiCacheMaxKb) > 4096) patch.apiCacheMaxKb = 256;
        if (!Object.prototype.hasOwnProperty.call(current, "safeNetworkMode")) patch.safeNetworkMode = true;
        if (!Object.prototype.hasOwnProperty.call(current, "autoCollapseLoadedMessages")) patch.autoCollapseLoadedMessages = true;
        if (!Object.prototype.hasOwnProperty.call(current, "mathCopyEnabled")) patch.mathCopyEnabled = true;
        if (!Object.prototype.hasOwnProperty.call(current, "mathCopyAutoOnCopy")) patch.mathCopyAutoOnCopy = true;
        if (!Object.prototype.hasOwnProperty.call(current, "mathCopyShowSelectionButton")) patch.mathCopyShowSelectionButton = true;
        if (!Object.prototype.hasOwnProperty.call(current, "mathCopyPreferPngFallback")) patch.mathCopyPreferPngFallback = true;
        if (!Object.prototype.hasOwnProperty.call(current, "branchTrackerEnabled")) patch.branchTrackerEnabled = true;
        if (!Object.prototype.hasOwnProperty.call(current, "branchTrackerShortcut")) patch.branchTrackerShortcut = "Alt+B";
        if (!Object.prototype.hasOwnProperty.call(current, "nextPromptQueueEnabled")) patch.nextPromptQueueEnabled = true;
        if (!Object.prototype.hasOwnProperty.call(current, "nextPromptQueueShortcut")) patch.nextPromptQueueShortcut = "Tab";
        if (!Object.prototype.hasOwnProperty.call(current, "nextPromptQueuePanelShortcut")) patch.nextPromptQueuePanelShortcut = "Alt+Q";

        patch[DEFAULTS_VERSION_KEY] = "1.5.3";
        if (Object.keys(patch).length) chrome.storage.local.set(patch);
      });
    });
  }
})();
