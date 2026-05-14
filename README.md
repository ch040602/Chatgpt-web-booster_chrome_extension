# ChatGPT Long Chat Loader

[한국어 README](./README.ko.md) | [License](./LICENSE) | [Third-party notices](./THIRD_PARTY_NOTICES.md) | [Update hosting](./UPDATE_HOSTING.md)

Chrome Manifest V3 extension for reducing long ChatGPT conversation loading, rendering, and memory pressure in the browser.

The popup now has a dedicated **Program language** mode. Choose **English** or **한국어** in the popup; README buttons open the matching GitHub documentation page.

## What It Does

- Trims large ChatGPT conversation API payloads before they reach the page app when it is safe to do so.
- Keeps only a recent visible DOM window and hides older rendered messages.
- Protects active replies, thinking/reasoning panels, and stream recovery from being hidden or rewritten.
- Re-collapses older messages loaded through **Load more** on the next maintenance cycle.
- Shows popup diagnostics for API trimming, DOM visibility, live reply protection, patch health, cache state, and update checks.
- Provides GitHub release ZIP and Chrome-managed update helper actions.

## v1.4.0 Focus

v1.4.0 fixes cases where the extension appeared to run but did not trim or window the conversation. It continuously trims stable conversation refreshes, forces DOM windowing during maintenance, and lowers the default first-load footprint.

### Fixed / Changed

- Fixed a route-state bug where a live/thinking bypass could consume the one initial-trim slot.
- Stable conversation refreshes are trimmed continuously instead of passing the full transcript after the first trimmed GET.
- Stable trim completion is recorded only after a stable conversation response is parsed and either trimmed or confirmed small enough.
- Active generation, thinking, reasoning, and recovery responses no longer mark a route as already optimized.
- DOM windowing re-applies during maintenance even when live-reply protection is active.
- Historical completed thinking/reasoning snippets no longer protect old messages from being hidden.
- Loaded older messages are automatically folded back to the configured recent window.
- Added a MAIN-world fallback injection path for already-open tabs.
- Added popup actions for **Fast first-load preset**, **Patch reinjection**, and GitHub update helpers.
- Added separate Korean/English popup modes and matching README links.

## Defaults

| Setting | Default |
|---|---:|
| Enabled | on |
| Initial API trimming | on |
| Network Safe Mode | on |
| Recent turns | 2 |
| Load-more batch | 2 |
| API prefetch batches | 0 |
| Response micro-cache entries | 1 |
| Cache item limit | 256 KB |
| Maintenance interval | 60 sec |
| Auto-collapse loaded older messages | on |
| Status badge | off |

These defaults keep only the newest message window visible. Older DOM messages are hidden and can be revealed in batches. If older messages were removed before ChatGPT rendered them, use the full-load button in ChatGPT.

## Installation

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this extension folder.
6. Refresh existing ChatGPT tabs.
7. Open the popup and confirm `API patch: MAIN 1.4.0`.

## Popup Diagnostics

The popup estimates performance only while it is open. It can show:

- estimated loading improvement
- API trim count and estimated size reduction
- DOM visible/hidden counts
- response live-protection state
- Thinking Shield state
- live API original-pass state
- safety lock state
- micro-cache state
- patch health and fallback injection state
- content/main script versions

## If Trimming Does Not Happen

Open the popup and check:

- `API patch`: should be `MAIN 1.4.0`.
- `Patch status`: should include `MAIN detected`.
- `Safe original pass`: should not stay active while the page is idle.
- DOM hidden count: should be greater than zero in a long conversation.
- `Thinking shield`: should be idle after the answer is complete.

Use **Patch reinjection** for an already-open tab. For the fastest initial load, apply **Fast first-load preset** and refresh the ChatGPT tab.

## Update Helper

The popup includes GitHub update buttons. The repository URL is fixed internally and is not shown as an editable field.

- **Chrome auto update check** calls `chrome.runtime.requestUpdateCheck()`.
- **Latest ZIP download** downloads the newest release/source ZIP from GitHub.

Developer-mode unpacked extensions cannot replace their own local files automatically. For release-based automatic updates, package the extension as a CRX with a stable key and publish a Chrome-managed update manifest. See [Update hosting](./UPDATE_HOSTING.md).

## Limitations

- The ChatGPT network response still has to be downloaded before the extension can trim it.
- The extension targets browser loading, rendering, and memory pressure. It does not reduce server-side model context.
- Authenticated long-conversation E2E benchmarks must be run in your own ChatGPT session.
- ChatGPT DOM/API changes may require selector or trim-logic updates.
- The extension does not bypass OpenAI security systems. If ChatGPT displays unusual activity warnings, the extension enters a passive safety lock and temporarily stops response rewriting.

## License

Copyright (c) 2026 ch040602.

This project is released as open source under the [MIT License](./LICENSE). You may use, copy, modify, publish, distribute, sublicense, and sell copies of the software as long as the copyright and license notice are included.

ChatGPT and OpenAI are trademarks or registered trademarks of OpenAI. This project is independent and is not affiliated with, endorsed by, or sponsored by OpenAI.

See [Third-party notices](./THIRD_PARTY_NOTICES.md) for reviewed references and attribution notes.
