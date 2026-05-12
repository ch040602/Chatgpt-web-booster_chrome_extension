# ChatGPT Long Chat Loader v0.9.0

[한국어 README](README.ko.md)

Chrome MV3 extension for reducing ChatGPT long-conversation loading, rendering, and RAM pressure while preserving live answer progress.

## What changed in v0.9.0

v0.9.0 focuses on a live-answer stall seen as:

```text
Streaming stopped. Waiting for message completion...
```

or, in Korean UI:

```text
스트리밍이 중지되었습니다. 메시지 완료를 기다리는 중입니다…
```

In earlier builds, the extension suspended the response micro-cache during generation but could still rewrite `GET /backend-api/conversation/...` responses while ChatGPT was trying to recover or finalize the answer. v0.9.0 changes the priority during live replies: **showing the correct in-progress/final answer is more important than trimming that specific live fetch**.

### v0.9.0 fixes

1. **Live API rewrite bypass.** During message generation, conversation mutation, active reply protection, or stream-recovery waiting, conversation GET responses pass through unmodified. The extension still clears/suspends the micro-cache in this state.
2. **Stream-recovery text detection.** The content script detects the “streaming stopped / waiting for message completion” notice and keeps the latest turns protected while ChatGPT finalizes the message.
3. **Active-reply watchdog.** While an active or recovery state is detected, a lightweight watchdog refreshes the protection signal so the MAIN-world fetch patch does not resume stale cache/trim behavior too early.
4. **Faster recovery to normal mode.** If no stop button, busy marker, streaming marker, or recovery notice is seen for a short window, the extension clears active-reply protection and resumes normal trimming/cache behavior.
5. **Popup diagnostics.** The popup now shows `Live API rewrite` state, indicating whether conversation GET responses are currently passing through unmodified.
6. **Fixed GitHub update target.** The GitHub repository is fixed internally. The popup no longer displays or edits the repository link.

## Problem cause

Long ChatGPT conversations can become slow because the browser receives a large conversation graph, parses it into JavaScript objects, lets the ChatGPT React app build state for old messages, and then keeps many Markdown/code/tool DOM nodes alive.

A separate issue appears during generation. ChatGPT can temporarily show a stream-recovery notice while it waits for message completion. If an extension rewrites or serves a stale conversation response during that recovery period, the UI can remain stuck until a manual page refresh. v0.9.0 avoids rewriting live/recovery conversation GET responses.

## What this extension does

1. Patches `window.fetch` in the page MAIN world at `document_start`.
2. Intercepts `GET /backend-api/conversation/<id>` and `GET /backend-api/f/conversation/<id>` JSON responses.
3. Keeps only the recent conversation graph tail before ChatGPT React consumes it when no live answer is in progress.
4. Passes conversation GET responses through unmodified during generation, stream recovery, or shortly after a send/mutation request.
5. Clears and suspends the micro-cache after conversation mutation requests such as sending a message.
6. Uses a bounded one-entry micro-cache by default when no active reply is in progress.
7. Keeps old DOM turns hidden behind a floating `Load more` control when the full DOM is already present.
8. Preserves a lightweight trim marker so the `Load full conversation` button remains available after cache/stat cleanup.
9. Protects the currently generating reply from DOM hiding and CSS containment.
10. Calculates estimated speedup only when the extension popup is opened.

## Cache and live rewrite policy

| State | Micro-cache | API trim/rewrite |
|---|---|---|
| Idle long conversation load | enabled, bounded | enabled |
| Same conversation refetch while idle | may use 1-entry cache | enabled |
| Message send / conversation mutation | cleared and suspended | bypassed temporarily |
| Active reply detected | cleared and suspended | bypassed temporarily |
| Stream-recovery notice detected | cleared and suspended | bypassed while notice remains |
| Memory pressure | cleared | still follows active/idle state |
| Route change | cleared | reset |

Default cache settings:

| Item | Default |
|---|---:|
| Response micro-cache entries | 1 |
| Maximum entries | 2 |
| Per-entry body limit | 1024 KB |
| Entry TTL | 60 seconds |

The cache stores only the trimmed response body, not the original full conversation body. The configured cache size is never normalized below 1, but the runtime cache map can still be temporarily empty after route changes, TTL expiry, memory pressure, active reply protection, or when a trimmed body exceeds the size limit.

## Live answer protection

When the user sends a prompt, when a stop/generating control is visible, when streaming text mutations are detected, or when the stream-recovery notice is present, the extension enters active-reply protection.

During this window:

- the response micro-cache is not used or stored,
- conversation GET rewrite/trim is bypassed,
- the latest live turns are forced visible,
- CSS containment is removed from the protected turns,
- periodic maintenance is skipped,
- the popup shows `Active reply protection`, `micro-cache suspended`, and `Live API rewrite`.

This is intended to make answer progress visible without requiring a manual page refresh.

## GitHub update helper

The popup includes a **GitHub update** section with a fixed repository target. The repository link is not displayed or editable in the popup.

Buttons:

| Button | Action |
|---|---|
| Check update | Calls GitHub API for the latest release and default-branch `manifest.json` |
| Download latest ZIP | Downloads the selected release asset ZIP, or source ZIP fallback |
| Open release | Opens the selected GitHub release page |
| Open extension management | Opens `chrome://extensions` when Chrome allows it |
| Reload extension | Calls `chrome.runtime.reload()` after files are replaced |

Chrome does not let an unpacked extension silently replace its own files from a popup. The fast-update flow is therefore: check GitHub, download the ZIP, unzip it, replace or load the unpacked folder, then reload the extension.

The extension requests the `downloads` permission only for the ZIP download button and host access to GitHub only for update checks. Update checks run only from the popup; there is no background polling.

## Popup-only estimated speedup

The extension does not continuously calculate speedup on the page. When the popup opens, it requests a one-time snapshot from the active tab and estimates improvement from API message reduction, API JSON size reduction, hidden DOM ratio, `content-visibility` support, and JS heap information when Chromium exposes it.

This is an estimate, not a controlled benchmark.

## GPU and RAM notes

- The extension does not force `will-change`, `translateZ(0)`, or layer promotion.
- The extension cannot toggle Chrome hardware acceleration. Check `chrome://gpu` manually if GPU compositing is suspected.
- The most important RAM reduction is avoiding full React state/DOM creation for old messages during idle conversation load.
- During live answer generation or stream recovery, correctness is prioritized and conversation GET responses are passed through unmodified.
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
