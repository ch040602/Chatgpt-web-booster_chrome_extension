(() => {
  "use strict";

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

  const ids = Object.keys(DEFAULT_SETTINGS);
  const saved = document.getElementById("saved");
  const metricMain = document.getElementById("metricMain");
  const metricSub = document.getElementById("metricSub");
  const metricLines = document.getElementById("metricLines");
  const refreshMetrics = document.getElementById("refreshMetrics");

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    chrome.storage.local.get(null, (value) => {
      renderSettings(normalize(value || {}));
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        el.addEventListener("change", saveFromForm);
        if (el.type === "number") {
          el.addEventListener("input", saveFromForm);
        }
      }
      requestMetricsOnce();
    });

    if (refreshMetrics) {
      refreshMetrics.addEventListener("click", requestMetricsOnce);
    }
  }

  function renderSettings(settings) {
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

    const normalized = normalize(next);
    chrome.storage.local.set(normalized, () => {
      if (saved) {
        saved.textContent = "저장됨";
        clearTimeout(saveFromForm.timer);
        saveFromForm.timer = setTimeout(() => {
          saved.textContent = "";
        }, 900);
      }
      scheduleMetricRefresh();
    });
  }

  function normalize(value) {
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

  function scheduleMetricRefresh() {
    clearTimeout(scheduleMetricRefresh.timer);
    scheduleMetricRefresh.timer = setTimeout(requestMetricsOnce, 250);
  }

  function requestMetricsOnce() {
    setMetricState("계산 중", "팝업이 열린 상태에서 현재 탭 snapshot을 한 번 가져옵니다.");
    clearMetricLines();

    if (!chrome.tabs || !chrome.runtime) {
      renderMetricUnavailable("현재 브라우저에서 탭 측정을 사용할 수 없습니다.");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs && tabs[0] && tabs[0].id;
      if (!tabId) {
        renderMetricUnavailable("활성 탭을 찾지 못했습니다.");
        return;
      }

      chrome.tabs.sendMessage(tabId, { type: "cgpt-lb-get-metrics" }, (response) => {
        if (chrome.runtime.lastError || !response || !response.ok) {
          renderMetricUnavailable("ChatGPT 탭에서 확장 아이콘을 눌렀을 때만 계산됩니다.");
          return;
        }
        renderMetrics(response);
      });
    });
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
      appendMetricLine("현재 URL", shortenUrl(metrics.url));
      return;
    }

    if (!estimate) {
      setMetricState("기준 부족", "긴 대화 API trim 또는 숨김 DOM이 감지되면 추정치를 계산합니다.");
      appendMetricLine("API 메시지", formatApiMessages(metrics.api));
      appendMetricLine("DOM 메시지", formatDom(metrics.dom));
      appendMetricLine("CSS containment", formatCss(metrics));
      appendMetricLine("JS heap", formatMemory(metrics.memory));
      appendMetricLine("DOM nodes", formatNumber(metrics.dom && metrics.dom.nodes));
      return;
    }

    setMetricState(
      `${estimate.multiplierLow.toFixed(1)}~${estimate.multiplierHigh.toFixed(1)}배`,
      `초기 파싱·렌더링·layout 작업 약 ${estimate.reductionPct}% 감소 추정`
    );
    appendMetricLine("API 메시지", formatApiMessages(metrics.api));
    appendMetricLine("API 크기(추정)", formatApiSize(metrics.api));
    appendMetricLine("DOM 메시지", formatDom(metrics.dom));
    appendMetricLine("CSS containment", formatCss(metrics));
    appendMetricLine("JS heap", formatMemory(metrics.memory));
    appendMetricLine("계산 시점", "팝업 열림 상태");
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
      parts.push({ value: clamp01((positiveNumber(dom.hidden) || 0) / dom.total), weight: 0.15 });
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

  function formatCss(metrics) {
    const supported = Boolean(metrics && metrics.css && metrics.css.contentVisibilitySupported);
    const enabled = Boolean(metrics && metrics.settings && metrics.settings.cssContainmentEnabled);
    if (!supported) return "브라우저 미지원";
    return enabled ? "켜짐" : "꺼짐";
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
    return Math.round(n).toLocaleString("ko-KR");
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
})();
