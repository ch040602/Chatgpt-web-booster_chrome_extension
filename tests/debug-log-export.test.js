const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const popupScript = fs.readFileSync(path.join(rootDir, "popup.js"), "utf8");

const DEBUG_LOG_KEY = "cgptLongChatLoader.debugLog.v1";

function createElement(id, document) {
  const listeners = {};
  return {
    id,
    type: id === "debug" ? "checkbox" : "button",
    value: "",
    checked: false,
    textContent: "",
    className: "",
    style: {},
    href: "",
    download: "",
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    append() {},
    appendChild() {},
    remove() {},
    click() {
      document.clickedElements.push(this);
      if (listeners.click) return listeners.click();
      return undefined;
    }
  };
}

async function loadPopup(storageData) {
  const elements = new Map();
  const documentListeners = {};
  const document = {
    body: {
      appendChild(element) {
        document.appendedElements.push(element);
      }
    },
    appendedElements: [],
    clickedElements: [],
    addEventListener(type, handler) {
      documentListeners[type] = handler;
    },
    createElement(tagName) {
      return createElement(tagName, document);
    },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement(id, document));
      return elements.get(id);
    }
  };

  const blobs = [];
  const objectUrls = [];
  const revokedUrls = [];

  const context = {
    URL: {
      createObjectURL(blob) {
        blobs.push(blob);
        const url = `blob:test-${blobs.length}`;
        objectUrls.push(url);
        return url;
      },
      revokeObjectURL(url) {
        revokedUrls.push(url);
      }
    },
    Blob: class BlobMock {
      constructor(parts, options) {
        this.parts = parts;
        this.type = options && options.type;
      }
    },
    console,
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearTimeout() {},
    document,
    chrome: {
      runtime: { lastError: null },
      storage: {
        local: {
          get(keys, callback) {
            if (Array.isArray(keys)) {
              const picked = {};
              for (const key of keys) picked[key] = storageData[key];
              callback(picked);
              return;
            }
            callback(storageData);
          },
          set(value, callback) {
            Object.assign(storageData, value);
            callback();
          },
          remove(key, callback) {
            delete storageData[key];
            callback();
          }
        }
      },
      tabs: {
        create() {},
        query(_query, callback) {
          callback([]);
        }
      }
    }
  };

  vm.runInNewContext(popupScript, context, { filename: "popup.js" });
  await documentListeners.DOMContentLoaded();

  return { elements, document, blobs, objectUrls, revokedUrls, storageData };
}

(async () => {
  const { elements, document, blobs, objectUrls } = await loadPopup({
    [DEBUG_LOG_KEY]: [
      {
        timestamp: "2026-05-11T00:00:00.000Z",
        source: "content",
        message: "observer target BODY",
        args: ["observer target", "BODY"],
        pageUrl: "https://chatgpt.com/c/example"
      }
    ]
  });

  await elements.get("exportDebugLog").click();

  assert.equal(blobs.length, 1);
  assert.equal(blobs[0].type, "application/json");
  assert.match(document.clickedElements.at(-1).download, /^chatgpt-long-chat-loader-debug-\d{8}-\d{6}\.json$/);
  assert.equal(document.clickedElements.at(-1).href, objectUrls[0]);

  const exported = JSON.parse(blobs[0].parts.join(""));
  assert.equal(exported.schemaVersion, 1);
  assert.equal(exported.entries.length, 1);
  assert.equal(exported.entries[0].source, "content");
  assert.equal(exported.entries[0].message, "observer target BODY");
})();
