const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const contentScript = fs.readFileSync(path.join(rootDir, "content.js"), "utf8");

const DEBUG_LOG_KEY = "cgptLongChatLoader.debugLog.v1";

class ElementMock {}

function createEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    dispatchEvent(event) {
      for (const handler of listeners.get(event.type) || []) handler(event);
      return true;
    }
  };
}

async function loadContent(storageData) {
  const windowTarget = createEventTarget();
  const documentTarget = createEventTarget();
  const html = new ElementMock();
  html.setAttribute = () => {};
  html.contains = () => true;
  html.querySelector = () => null;
  html.querySelectorAll = () => [];
  const body = new ElementMock();
  body.tagName = "BODY";
  body.nodeName = "BODY";
  body.matches = () => false;
  body.querySelector = () => null;
  body.querySelectorAll = () => [];

  const context = {
    URL,
    console,
    location: {
      href: "https://chatgpt.com/c/example",
      origin: "https://chatgpt.com",
      pathname: "/c/example"
    },
    localStorage: {
      setItem() {},
      getItem() {
        return null;
      },
      removeItem() {}
    },
    sessionStorage: {
      setItem() {},
      getItem() {
        return null;
      },
      removeItem() {}
    },
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init && init.detail;
      }
    },
    Element: ElementMock,
    MutationObserver: class MutationObserver {
      observe() {}
      disconnect() {}
    },
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    setInterval() {
      return 1;
    },
    clearInterval() {},
    document: {
      ...documentTarget,
      readyState: "loading",
      documentElement: html,
      body,
      hidden: false,
      createElement() {
        return new ElementMock();
      },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      getElementsByTagName() {
        return [];
      }
    },
    window: null,
    chrome: {
      runtime: {
        onMessage: { addListener() {} }
      },
      storage: {
        onChanged: { addListener() {} },
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
            if (callback) callback();
          }
        }
      }
    }
  };
  context.window = { ...windowTarget };
  context.window.setTimeout = context.setTimeout;
  context.window.clearTimeout = context.clearTimeout;
  context.window.setInterval = context.setInterval;
  context.window.clearInterval = context.clearInterval;

  vm.runInNewContext(contentScript, context, { filename: "content.js" });
  await Promise.resolve();

  return { context, storageData };
}

(async () => {
  const { context, storageData } = await loadContent({ debug: true });

  context.window.dispatchEvent(new context.CustomEvent("cgpt-lb-debug-log", {
    detail: {
      source: "main",
      args: ["cache hit", "https://chatgpt.com/backend-api/conversation/example"]
    }
  }));
  for (let i = 0; i < 10; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }

  const mainEntry = storageData[DEBUG_LOG_KEY].find((entry) => entry.source === "main");
  assert.ok(mainEntry);
  assert.match(mainEntry.message, /cache hit/);
  assert.equal(mainEntry.pageUrl, "https://chatgpt.com/c/example");
})();
