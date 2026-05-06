(() => {
  "use strict";

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    apiTrimEnabled: true,
    visibleTurns: 6,
    loadMoreBatch: 6,
    prefetchBatches: 10,
    showStatus: true,
    debug: false
  });

  const ids = Object.keys(DEFAULT_SETTINGS);
  const saved = document.getElementById("saved");

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    chrome.storage.local.get(DEFAULT_SETTINGS, (value) => {
      render(normalize(value));
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        el.addEventListener("change", saveFromForm);
        el.addEventListener("input", () => {
          if (el.type === "number") saveFromForm();
        });
      }
    });
  }

  function render(settings) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === "checkbox") el.checked = Boolean(settings[id]);
      else el.value = String(settings[id]);
    }
  }

  function saveFromForm() {
    const next = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === "checkbox") next[id] = el.checked;
      else next[id] = clampInt(el.value, Number(el.min), Number(el.max), DEFAULT_SETTINGS[id]);
    }
    chrome.storage.local.set(normalize(next), () => {
      if (!saved) return;
      saved.textContent = "저장됨";
      clearTimeout(saveFromForm.timer);
      saveFromForm.timer = setTimeout(() => {
        saved.textContent = "";
      }, 900);
    });
  }

  function normalize(value) {
    return {
      enabled: Boolean(value.enabled),
      apiTrimEnabled: Boolean(value.apiTrimEnabled),
      visibleTurns: clampInt(value.visibleTurns, 1, 100, DEFAULT_SETTINGS.visibleTurns),
      loadMoreBatch: clampInt(value.loadMoreBatch, 1, 100, DEFAULT_SETTINGS.loadMoreBatch),
      prefetchBatches: clampInt(value.prefetchBatches, 0, 30, DEFAULT_SETTINGS.prefetchBatches),
      showStatus: Boolean(value.showStatus),
      debug: Boolean(value.debug)
    };
  }

  function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(String(value), 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }
})();
