# ChatGPT Long Chat Loader v0.8.0

[한국어 README](README.ko.md)

Chrome MV3 extension for reducing ChatGPT long-conversation loading, rendering, and RAM pressure while preserving live answer progress.

## What changed in v0.8.0

This release adds a GitHub update helper to the popup while keeping the v0.7 streaming-safety fixes. The helper can check the configured GitHub repository, compare the installed manifest version with the latest release and default-branch `manifest.json`, download the latest ZIP, open the release page, open Chrome extension management, and reload the extension after the user replaces files.

Chrome does not let an unpacked extension silently replace its own files from a popup. The fast-update flow is therefore: check GitHub, download the ZIP, unzip it, replace or load the unpacked folder, then reload the extension.

Previous v0.7 change recap: it fixed a case where an answer could look stalled or disconnected until the page was refreshed.

1. **Streaming-safe micro-cache.** The response micro-cache is suspended after conversation mutation requests and while an active answer is detected. This prevents the extension from serving a stale trimmed conversation while ChatGPT is still generating.
2. **In-progress assistant node preservation.** The API trim step now keeps active or very recent assistant nodes even if ChatGPT has not yet moved `current_node` to that node. If the active assistant is a descendant of the latest user message, the trimmed response can point `current_node` to that in-progress node.
3. **Live DOM protection.** The latest live turns are never hidden and do not receive `content-visibility:auto`. This avoids hiding or deferring paint for the response currently being generated.
4. **Streaming mutation detection.** The observer now watches `childList`, `characterData`, and selected attributes, so streamed text updates can refresh protection state.
5. **Maintenance pause during active replies.** Periodic cleanup does not run while a reply is protected. Cache pruning and stale-stat cleanup resume after the active window ends.
6. **Popup diagnostics.** The popup now shows active-reply protection and cache-suspension state. Estimated speedup is still calculated only while the popup is open.

## Problem cause

Long ChatGPT conversations can become slow because the browser receives a large conversation graph, parses it into JavaScript objects, lets the ChatGPT React app build state for old messages, and then keeps many Markdown/code/tool DOM nodes alive.

A separate issue appears during generation: ChatGPT can receive or refetch conversation data while an assistant response is still in progress. If an extension returns a cached trimmed response from just before the latest assistant node was finalized, the UI can appear to stop even though the answer exists server-side. Refreshing the page clears the runtime cache, so the completed answer appears.

## What this extension does

1. Patches `window.fetch` in the page MAIN world at `document_start`.
2. Intercepts `GET /backend-api/conversation/<id>` and `GET /backend-api/f/conversation/<id>` JSON responses.
3. Keeps only the recent conversation graph tail before ChatGPT React consumes it.
4. Preserves in-progress or recent assistant nodes that may not yet be the API `current_node`.
5. Clears and suspends the micro-cache after conversation mutation requests such as sending a message.
6. Uses a bounded one-entry micro-cache by default when no active reply is in progress.
7. Keeps old DOM turns hidden behind a floating `Load more` control when the full DOM is already present.
8. Preserves a lightweight trim marker so the `Load full conversation` button remains available after cache/stat cleanup.
9. Protects the currently generating reply from DOM hiding and CSS containment.
10. Calculates estimated speedup only when the extension popup is opened.

## Cache policy

| Item | Default |
|---|---:|
| Response micro-cache entries | 1 |
| Maximum entries | 2 |
| Per-entry body limit | 1024 KB |
| Entry TTL | 60 seconds |
| Send/conversation mutation | cache cleared and suspended |
| Active reply detected | cache cleared and suspended |
| Memory pressure | cache cleared |
| Route change | cache cleared |

The cache stores only the trimmed response body, not the original full conversation body. The configured cache size is never normalized below 1, but the runtime cache map can still be temporarily empty after route changes, TTL expiry, memory pressure, active reply protection, or when a trimmed body exceeds the size limit.

## Live answer protection

When the user sends a prompt, when a stop/generating control is visible, or when streaming text mutations are detected, the extension enters an active-reply protection window.

During this window:

- the response micro-cache is not used or stored,
- the latest live turns are forced visible,
- CSS containment is removed from the protected turns,
- periodic maintenance is skipped,
- the popup shows `Active reply protection` and `micro-cache suspended`.

This is intended to make answer progress visible without requiring a manual page refresh.

## Trim-state marker

The load-more/full-load button must not depend on cache bodies. The extension stores a small per-route marker in `sessionStorage` after an API response is trimmed. The marker contains only counts, timestamps, and the route key; it does not contain message text.

The marker is removed when:

- the route changes to a different conversation,
- API trim is disabled,
- the user clicks `Load full conversation`, or
- the marker is older than 6 hours.



## GitHub update helper

The popup now includes a **GitHub update** section.

Default repository:

```text
ch040602/Chatgpt-web-booster_chrome_extentsion
```

Buttons:

| Button | Action |
|---|---|
| Check update | Calls GitHub API for the latest release and default-branch `manifest.json` |
| Download latest ZIP | Downloads the selected release asset ZIP, or source ZIP fallback |
| Open release | Opens the selected GitHub release page |
| Open extension management | Opens `chrome://extensions` when Chrome allows it |
| Reload extension | Calls `chrome.runtime.reload()` after files are replaced |

The extension requests the `downloads` permission only for the ZIP download button and host access to GitHub only for update checks. Update checks run only from the popup; there is no background polling.

## Popup-only estimated speedup

The extension does not continuously calculate speedup on the page. When the popup opens, it requests a one-time snapshot from the active tab and estimates improvement from API message reduction, API JSON size reduction, hidden DOM ratio, `content-visibility` support, and JS heap information when Chromium exposes it.

This is an estimate, not a controlled benchmark.

## GPU and RAM notes

- The extension does not force `will-change`, `translateZ(0)`, or layer promotion.
- The extension cannot toggle Chrome hardware acceleration. Check `chrome://gpu` manually if GPU compositing is suspected.
- The most important RAM reduction is avoiding full React state/DOM creation for old messages during conversation load.
- A JSON response must still be read and parsed once to rewrite it. That peak cannot be fully eliminated from an extension that rewrites `fetch` responses.
- The micro-cache is intentionally small. It avoids repeated parse work but is disabled during active generation to prevent stale UI state.

## Install

1. Unzip this package.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click **Load unpacked**.
5. Select the extracted extension folder.
6. Open or reload a long conversation on `https://chatgpt.com`.
7. Click the extension icon to view the current-tab estimate and settings.

After updating from an older build, reload the ChatGPT tab. Existing tabs may still have an older content script or MAIN-world fetch patch in memory until the page reloads.

If the popup reports `API patch: missing`, reload the ChatGPT tab. The DOM optimizer and estimate fallback can be injected into an already-open tab, but the early MAIN-world fetch patch works best after a page reload.

## Limitations

- Authenticated long-conversation E2E testing is required for final performance numbers.
- ChatGPT internal DOM/API changes may require selector or endpoint updates.
- Full-history search, old message editing, and old branch navigation require the `Load full conversation` bypass.
- Server-side model context is not reduced; only browser UI loading/rendering pressure is reduced.
- Shared chats may use different delivery paths; DOM windowing may still help, but API trim is not guaranteed there.

## Privacy

No message content is sent to an external server. Settings are stored in `chrome.storage.local`; a small trim marker with counts/timestamps is stored in tab-scoped `sessionStorage`; and settings are bridged to the page via `localStorage` for MAIN-world access. Debug export is local-only and only created when the user clicks the export button.
