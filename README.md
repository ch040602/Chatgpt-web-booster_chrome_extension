# ChatGPT Long Chat Loader

Chrome MV3 extension for reducing long ChatGPT conversation loading/RAM pressure and for copying ChatGPT formulas into Word/PowerPoint more safely.

- Default documentation: English
- Korean documentation: [`README.ko.md`](./README.ko.md)
- Version: `1.5.3`

## v1.5.3 focus

v1.5.3 adds visible ChatGPT branch-path tracking and a next-prompt queue while preserving the v1.5.2 long-chat and Office formula fixes.

Main changes:

- Separate Korean/English program mode in the popup.
- Keep a single **Open README** button; it opens the README that matches the selected program language.
- Keep only two update actions: **Check update** and **Download latest ZIP**.
- Show only **Installed version** and **Remote version** after checking for updates.
- Remove the previous long micro-cache guidance text from the popup.
- Keep GitHub repository information internal; it is not shown as an editable popup field.
- Add clearer copyright, license, third-party notice, and release-upload guidance.
- Prevent duplicate PowerPoint pastes by writing only one Office-facing math clipboard format at a time.
- Show a compact branch tree panel for the current ChatGPT conversation route, including connected branch variants with prompt previews around branch points.
- Queue prompts with `Tab` by default, review/edit them in a queue panel, and send them one at a time after the current response and request-limit notices clear.

## Features

### Long conversation loading

The extension reduces browser-side work in long ChatGPT conversations by:

- trimming stable conversation API responses before ChatGPT's React app receives them,
- hiding old DOM turns and revealing them in small batches,
- periodically collapsing previously loaded old turns when no live reply is active,
- preserving the current answer/thinking/status area so generation progress is not interrupted.

This does **not** reduce server-side model context. It targets browser loading, rendering, layout, and memory pressure.

### Office formula copy

When selected ChatGPT content contains rendered math, the extension can correct the clipboard output:

- `Ctrl+C` / `Cmd+C`: writes one fallback format first: LaTeX plain text. If PNG fallback is enabled, the extension then replaces it with a single PPT-safe PNG clipboard item.
- Floating formula button: writes a single PPT-safe PNG when PNG fallback is enabled. If PNG creation fails, it falls back to LaTeX plain text.
- The extension no longer writes HTML/MathML and plain text together, because that can produce duplicate PowerPoint pastes.

For PowerPoint slides where the final visual result must be correct, use the floating formula-copy button first, or wait for the Ctrl/Cmd+C toast to report PNG copy completion before pasting.

### Branch path and next prompt queue

When **Show branch path** is enabled, the ChatGPT tab shows a compact branch panel for the current conversation path plus connected branch variants previously observed in the tab. Use **Branch panel shortcut** to open or collapse it; the default is `Alt+B`. The collapsed mini overlay stays clickable and shows only a simple graph without prompt text. The panel records visible message IDs and short previews in `sessionStorage` for the current tab. At a detected branch point, it shows the last user prompt before the split and the first user prompts at the branch starts.

When **Queue next prompt** is enabled, type a prompt while ChatGPT is answering and press the configured queue shortcut. The default is `Tab`. Each queued prompt appears in an editable queue panel. Open or collapse that panel with **Queue panel shortcut**; the default is `Alt+Q`, and the floating **Queue** button or collapsed queue mini overlay opens it by click. To change either shortcut, focus its popup field and press the exact key combination once. The extension sends queued prompts one by one, waiting until live response indicators disappear and request-limit text such as `Too many requests` or `rate limit` clears.

## Popup layout

### Language

Use **Program language** to select:

- `한국어`
- `English`

The selected language changes the popup labels and determines which README the single **Open README** button opens.

### Update helper

The update section intentionally contains only:

- **Check update**
- **Download latest ZIP**

After checking, the popup shows only:

- **Installed version**
- **Remote version**

The extension checks the fixed GitHub repository internally. It does not expose or edit the repository link in the popup.

For developer-mode/unpacked installs, Chrome cannot replace the local extension folder automatically. Use **Download latest ZIP**, extract it, then replace the unpacked extension folder in `chrome://extensions`.

## Installation

1. Download the latest release ZIP.
2. Extract the ZIP.
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted extension folder.
7. Refresh existing ChatGPT tabs.
8. Open the popup and confirm `API patch: MAIN 1.5.3`.

## Recommended settings

| Setting | Recommended |
|---|---:|
| Enabled | on |
| Initial API trimming | on |
| Network safe mode | on |
| Recent turns shown first | 2 |
| Load-more batch | 2 |
| API prefetch batches | 0 |
| Response micro-cache entries | 1 |
| Cache item limit | 256 KB |
| Auto cleanup during chat | on |
| Periodically collapse loaded older messages | on |
| Show branch path | on |
| Branch panel shortcut | `Alt+B` |
| Queue next prompt | on |
| Queue shortcut | `Tab` |
| Queue panel shortcut | `Alt+Q` |
| Status badge | off |

## If trimming does not happen

Open the popup and check:

- `API patch`: should be `MAIN 1.5.3`.
- `Patch status`: should include `MAIN detected`.
- DOM hidden count should be greater than zero in a long conversation.
- `Thinking shield` should return to idle after the answer completes.

For the fastest initial load, apply **Fast first-load preset** and refresh the ChatGPT tab.

## If formula copy fails in PowerPoint

Use the floating formula-copy button rather than plain `Ctrl+C`. The button path gives PowerPoint a single PNG representation, which avoids the common duplicate paste of a plain-looking formula plus a LaTeX formula.

If an editable equation is required, use `Ctrl+C` and paste into an Office equation-capable context. Office version and paste location can still affect whether the result becomes editable math.

## Privacy

The extension does not send message content to an external server.

Stored data:

- extension settings in `chrome.storage.local`,
- short-lived page bridge settings in the ChatGPT tab,
- optional local debug log only when debug logging is enabled.

GitHub update checking calls GitHub APIs only when the user presses **Check update** or **Download latest ZIP**.

## License and copyright

Copyright (c) 2026 ch040602.

This project is released under the MIT License. See [`LICENSE`](./LICENSE).

If you publish a fork, update the copyright holder, repository name, release asset names, and README links.

## Third-party notices

This package is an original implementation. It was inspired by public approaches to long-chat optimization, but no source file from those repositories is copied verbatim. See [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

## GitHub release checklist

Before uploading a release:

1. Confirm `manifest.json` version is `1.5.3`.
2. Confirm popup update UI shows only **Check update** and **Download latest ZIP**.
3. Confirm both README files are present.
4. Confirm `LICENSE` and `THIRD_PARTY_NOTICES.md` are included.
5. Build the ZIP from the extension folder root.
6. Upload the ZIP as a GitHub Release asset.
7. Verify the popup can detect the remote version and download the ZIP.

## Limitations

- The original ChatGPT network response still has to be downloaded before the extension can trim it.
- ChatGPT DOM/API changes may require selector or trim-logic updates.
- Office formula paste behavior varies by Office version and platform.
- Authenticated long-conversation E2E benchmarks must be run in an actual ChatGPT session.
