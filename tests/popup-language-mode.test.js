const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const popupScript = fs.readFileSync(path.join(rootDir, "popup.js"), "utf8");

function createElement(id) {
  const listeners = {};
  return {
    id,
    type: id === "languageMode" ? "select" : id.endsWith("Shortcut") ? "text" : id.endsWith("Enabled") || id === "enabled" || id === "showStatus" || id === "debug" ? "checkbox" : "button",
    value: "",
    checked: false,
    textContent: "",
    className: "",
    disabled: false,
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    append() {},
    appendChild() {},
    click() {
      if (listeners.click) return listeners.click();
      return undefined;
    },
    change() {
      if (listeners.change) return listeners.change({ target: this });
      return undefined;
    },
    keydown(event) {
      if (listeners.keydown) return listeners.keydown({ target: this, ...event });
      return undefined;
    }
  };
}

async function loadPopup(storageData = {}) {
  const elements = new Map();
  const documentListeners = {};
  const createdTabs = [];

  const document = {
    documentElement: { lang: "" },
    addEventListener(type, handler) {
      documentListeners[type] = handler;
    },
    createElement(tagName) {
      return createElement(tagName);
    },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement(id));
      return elements.get(id);
    }
  };

  const context = {
    URL,
    console,
    setTimeout,
    clearTimeout,
    document,
    chrome: {
      runtime: {
        lastError: null,
        getManifest() {
          return { version: "1.4.0" };
        },
        getURL(filePath) {
          return `chrome-extension://test/${filePath}`;
        }
      },
      storage: {
        local: {
          get(_keys, callback) {
            callback({ ...storageData });
          },
          set(value, callback) {
            Object.assign(storageData, value);
            if (callback) callback();
          }
        }
      },
      tabs: {
        create(tab) {
          createdTabs.push(tab);
        },
        query(_query, callback) {
          callback([]);
        }
      }
    }
  };

  vm.runInNewContext(popupScript, context, { filename: "popup.js" });
  await documentListeners.DOMContentLoaded();

  return { elements, document, createdTabs, storageData };
}

(async () => {
  const koPopup = await loadPopup({ "cgptLongChatLoader.uiLanguage": "ko" });

  assert.equal(koPopup.document.documentElement.lang, "ko");
  assert.equal(koPopup.elements.get("languageMode").value, "ko");
  assert.equal(koPopup.elements.get("enabledLabel").textContent, "확장 기능 사용");
  assert.equal(koPopup.elements.get("openReadme").textContent, "Open README");

  koPopup.elements.get("openReadme").click();
  assert.equal(
    koPopup.createdTabs.at(-1).url,
    "https://github.com/ch040602/Chatgpt-web-booster_chrome_extentsion/blob/main/README.ko.md"
  );

  const enPopup = await loadPopup({ "cgptLongChatLoader.uiLanguage": "en" });

  assert.equal(enPopup.document.documentElement.lang, "en");
  assert.equal(enPopup.elements.get("languageMode").value, "en");
  assert.equal(enPopup.elements.get("enabledLabel").textContent, "Enable extension");
  assert.equal(enPopup.elements.get("openReadme").textContent, "Open README");

  const language = enPopup.elements.get("languageMode");
  language.value = "ko";
  await language.change();

  assert.equal(enPopup.storageData.languageMode, "ko");
  assert.equal(enPopup.document.documentElement.lang, "ko");
  assert.equal(enPopup.elements.get("enabledLabel").textContent, "확장 기능 사용");

  const shortcut = enPopup.elements.get("nextPromptQueueShortcut");
  let prevented = false;
  await shortcut.keydown({
    key: "k",
    ctrlKey: true,
    altKey: false,
    shiftKey: true,
    metaKey: false,
    preventDefault() { prevented = true; },
    stopPropagation() {}
  });

  assert.equal(prevented, true);
  assert.equal(shortcut.value, "Ctrl+Shift+K");
  assert.equal(enPopup.storageData.nextPromptQueueShortcut, "Ctrl+Shift+K");

  const panelShortcut = enPopup.elements.get("nextPromptQueuePanelShortcut");
  await panelShortcut.keydown({
    key: "q",
    ctrlKey: false,
    altKey: true,
    shiftKey: false,
    metaKey: false,
    preventDefault() {},
    stopPropagation() {}
  });

  assert.equal(panelShortcut.value, "Alt+Q");
  assert.equal(enPopup.storageData.nextPromptQueuePanelShortcut, "Alt+Q");
})();
