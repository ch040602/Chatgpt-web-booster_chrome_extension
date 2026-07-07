const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const contentScript = fs.readFileSync(path.join(rootDir, "content.js"), "utf8");

class ElementMock {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.nodeName = this.tagName;
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
    this.listeners = new Map();
    this.dataset = {};
    this.style = {
      setProperty: (name, value) => {
        this.style[name] = value;
      },
      removeProperty: (name) => {
        delete this.style[name];
      }
    };
    this.classList = {
      values: new Set(),
      add: (...names) => names.forEach((name) => this.classList.values.add(name)),
      remove: (...names) => names.forEach((name) => this.classList.values.delete(name)),
      contains: (name) => this.classList.values.has(name)
    };
    this.hidden = false;
    if (this.tagName === "TEXTAREA" || this.tagName === "INPUT") this.value = "";
    this._textContent = "";
    this.clickCount = 0;
    this.scrollIntoViewCount = 0;
    this.lastScrollIntoViewArg = null;
    this.rect = null;
  }

  get id() {
    return this.getAttribute("id") || "";
  }

  set id(value) {
    this.setAttribute("id", value);
  }

  get className() {
    return Array.from(this.classList.values).join(" ");
  }

  set className(value) {
    this.setAttribute("class", value);
  }

  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this._textContent = String(value || "");
    this.children = [];
  }

  get childNodes() {
    const nodes = [];
    if (this._textContent) nodes.push({ textContent: this._textContent });
    return nodes.concat(this.children);
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  append(...children) {
    children.forEach((child) => this.appendChild(child));
  }

  prepend(child) {
    child.parentElement = this;
    this.children.unshift(child);
    return child;
  }

  insertBefore(child, beforeNode) {
    child.parentElement = this;
    const index = this.children.indexOf(beforeNode);
    if (index < 0) this.children.push(child);
    else this.children.splice(index, 0, child);
    return child;
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }

  setAttribute(name, value) {
    const text = String(value);
    this.attributes.set(name, text);
    if (name === "class") {
      this.classList.values = new Set(text.split(/\s+/).filter(Boolean));
    }
    if (name === "hidden") this.hidden = true;
    if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      this.dataset[key] = text;
    }
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === "hidden") this.hidden = false;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }

  dispatchEvent(event) {
    event.target = event.target || this;
    for (const handler of this.listeners.get(event.type) || []) handler(event);
    return true;
  }

  click() {
    this.clickCount += 1;
    this.dispatchEvent({ type: "click", target: this });
  }

  focus() {}
  select() {}
  scrollIntoView(arg) {
    this.scrollIntoViewCount += 1;
    this.lastScrollIntoViewArg = arg;
  }
  getBoundingClientRect() {
    return this.rect || { top: 1000, bottom: 1100, width: 100, height: 100 };
  }

  contains(node) {
    if (node === this) return true;
    return this.children.some((child) => child.contains(node));
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (node.matches(selector)) return node;
      node = node.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const result = [];
    const visit = (node) => {
      for (const child of node.children) {
        if (child.matches(selector)) result.push(child);
        visit(child);
      }
    };
    visit(this);
    return result;
  }

  matches(selector) {
    return selector.split(",").some((part) => matchesSimpleSelector(this, part.trim()));
  }

  input() {
    this.dispatchEvent({ type: "input", target: this });
  }

  compareDocumentPosition(other) {
    const root = getRoot(this);
    const ordered = [];
    const visit = (node) => {
      ordered.push(node);
      node.children.forEach(visit);
    };
    visit(root);
    return ordered.indexOf(this) < ordered.indexOf(other) ? 4 : 2;
  }
}

function getRoot(node) {
  let current = node;
  while (current.parentElement) current = current.parentElement;
  return current;
}

function matchesSimpleSelector(el, selector) {
  if (!selector) return false;
  if (selector === "*") return true;
  if (selector.includes(" ")) {
    const parts = selector.split(/\s+/);
    return matchesSimpleSelector(el, parts.at(-1)) && Boolean(el.closest(parts.slice(0, -1).join(" ")));
  }
  if (selector.startsWith("#")) return el.id === selector.slice(1);
  if (selector.startsWith(".")) return el.classList.contains(selector.slice(1));
  if (/^[a-z]+$/i.test(selector)) return el.tagName.toLowerCase() === selector.toLowerCase();

  const tagMatch = selector.match(/^([a-z]+)?(\[.+\])$/i);
  if (tagMatch && tagMatch[1] && el.tagName.toLowerCase() !== tagMatch[1].toLowerCase()) return false;

  const attrParts = Array.from(selector.matchAll(/\[([^\]=~^*$\s]+)([*^$]?=)?["']?([^"'\]]*)["']?(?:\s+i)?\]/g));
  if (!attrParts.length) return false;
  return attrParts.every(([, name, op, expected]) => {
    const actual = el.getAttribute(name);
    if (actual === null) return false;
    if (!op) return true;
    const a = String(actual).toLowerCase();
    const e = String(expected).toLowerCase();
    if (op === "=") return a === e;
    if (op === "^=") return a.startsWith(e);
    if (op === "*=") return a.includes(e);
    if (op === "$=") return a.endsWith(e);
    return false;
  });
}

function makeTurn(id, role, text) {
  const turn = new ElementMock("article");
  turn.setAttribute("data-testid", `conversation-turn-${id}`);
  turn.setAttribute("data-message-id", id);
  const roleEl = new ElementMock("span");
  roleEl.setAttribute("data-message-author-role", role);
  roleEl.textContent = role;
  const body = new ElementMock("div");
  body.classList.add("markdown");
  body.textContent = text;
  turn.append(roleEl, body);
  return turn;
}

function createKeyEvent(key, target) {
  return {
    type: "keydown",
    key,
    target,
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {}
  };
}

function createModifiedKeyEvent(key, target, modifiers = {}) {
  return {
    ...createKeyEvent(key, target),
    ctrlKey: Boolean(modifiers.ctrlKey),
    altKey: Boolean(modifiers.altKey),
    shiftKey: Boolean(modifiers.shiftKey),
    metaKey: Boolean(modifiers.metaKey)
  };
}

async function loadContent(storageData = {}, initialSessionValues = {}, options = {}) {
  const intervals = [];
  const documentElement = new ElementMock("html");
  const head = new ElementMock("head");
  const body = new ElementMock("body");
  const main = new ElementMock("main");
  const composer = new ElementMock("div");
  composer.setAttribute("contenteditable", "true");
  composer.setAttribute("role", "textbox");
  composer.textContent = "follow up question";
  const sendButton = new ElementMock("button");
  sendButton.setAttribute("data-testid", "send-button");
  sendButton.setAttribute("aria-label", "Send prompt");
  const busy = new ElementMock("div");
  busy.setAttribute("aria-busy", "true");

  documentElement.append(head, body);
  body.append(main, composer, sendButton);
  const turns = Array.isArray(options.turns) && options.turns.length
    ? options.turns
    : [
      makeTurn("u1", "user", "Question 1"),
      makeTurn("a1", "assistant", "Answer 1"),
      makeTurn("u2", "user", "Question 2")
    ];
  main.append(...turns, busy);

  const documentListeners = new Map();
  const document = {
    documentElement,
    head,
    body,
    hidden: false,
    readyState: "complete",
    addEventListener(type, handler) {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(handler);
    },
    dispatchEvent(event) {
      for (const handler of documentListeners.get(event.type) || []) handler(event);
    },
    createElement(tagName) {
      return new ElementMock(tagName);
    },
    getElementById(id) {
      return documentElement.querySelector(`#${id}`);
    },
    querySelector(selector) {
      return documentElement.querySelector(selector);
    },
    querySelectorAll(selector) {
      return documentElement.querySelectorAll(selector);
    },
    getElementsByTagName(tagName) {
      return documentElement.querySelectorAll(tagName);
    }
  };

  const windowListeners = new Map();
  const window = {
    innerHeight: Number(options.innerHeight) || 720,
    addEventListener(type, handler) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(handler);
    },
    dispatchEvent(event) {
      for (const handler of windowListeners.get(event.type) || []) handler(event);
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearTimeout() {},
    setInterval(callback) {
      intervals.push(callback);
      return intervals.length;
    },
    clearInterval() {},
    CSS: { supports: () => true }
  };

  const sessionValues = new Map(Object.entries(initialSessionValues).map(([key, value]) => [key, String(value)]));
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
      setItem(key, value) {
        sessionValues.set(key, String(value));
      },
      getItem(key) {
        return sessionValues.has(key) ? sessionValues.get(key) : null;
      },
      removeItem(key) {
        sessionValues.delete(key);
      }
    },
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init && init.detail;
      }
    },
    Event: class Event {
      constructor(type) {
        this.type = type;
      }
    },
    Element: ElementMock,
    HTMLElement: ElementMock,
    Node: { DOCUMENT_POSITION_FOLLOWING: 4 },
    MutationObserver: class MutationObserver {
      observe() {}
      disconnect() {}
    },
    requestIdleCallback(callback) {
      callback();
    },
    requestAnimationFrame(callback) {
      callback();
    },
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    setInterval: window.setInterval,
    clearInterval: window.clearInterval,
    document,
    window,
    innerHeight: Number(options.innerHeight) || 720,
    chrome: {
      runtime: {
        onMessage: { addListener() {} }
      },
      storage: {
        onChanged: { addListener() {} },
        local: {
          get(_keys, callback) {
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
  context.CSS = window.CSS;

  vm.runInNewContext(contentScript, context, { filename: "content.js" });
  await Promise.resolve();

  return { context, document, body, main, composer, sendButton, busy, intervals, sessionValues };
}

(async () => {
  const page = await loadContent({
    branchTrackerEnabled: true,
    branchTrackerShortcut: "Alt+B",
    nextPromptQueueEnabled: true,
    nextPromptQueueShortcut: "Tab"
  });

  const graph = page.document.getElementById("cgpt-lb-branch-map-v152");
  assert.ok(graph, "branch graph should render");
  assert.match(graph.textContent, /분기 없음/);
  assert.equal(graph.querySelectorAll(".cgpt-lb-branch-node-action").length, 0, "unbranched conversations do not render graph nodes");
  assert.equal(graph.querySelectorAll(".cgpt-lb-branch-svg").length, 0, "unbranched conversations do not render an SVG branch graph");

  const toggleEvent = createModifiedKeyEvent("b", page.body, { altKey: true });
  page.document.dispatchEvent(toggleEvent);
  assert.equal(toggleEvent.defaultPrevented, true);
  assert.equal(graph.hidden, false, "branch graph stays visible as a mini overlay");
  assert.equal(graph.classList.contains("cgpt-lb-branch-mini"), true, "branch graph shortcut collapses to mini mode");
  assert.doesNotMatch(graph.textContent, /Question 1/, "branch mini overlay hides prompt text");
  graph.click();
  assert.equal(graph.classList.contains("cgpt-lb-branch-mini"), false, "clicking the branch mini overlay reopens the panel");
  assert.match(graph.textContent, /분기 없음/, "expanded branch panel does not list every prompt without a branch");
  assert.equal(graph.querySelectorAll(".cgpt-lb-branch-node-action").length, 0, "expanded no-branch panel stays node-free");

  const event = createKeyEvent("Tab", page.composer);
  page.document.dispatchEvent(event);

  assert.equal(event.defaultPrevented, true);
  assert.equal(page.sendButton.clickCount, 0, "queued prompt waits while a reply is active");

  page.busy.remove();
  page.body.append(Object.assign(new ElementMock("div"), { textContent: "Too many requests. Try again later." }));
  page.intervals.forEach((callback) => callback());
  assert.equal(page.sendButton.clickCount, 0, "queued prompt waits while rate-limit text is visible");

  page.body.children = page.body.children.filter((child) => !/too many requests/i.test(child.textContent));
  page.intervals.forEach((callback) => callback());
  assert.equal(page.sendButton.clickCount, 1, "queued prompt sends after reply and rate-limit block clear");

  const manyTurns = Array.from({ length: 10 }, (_, index) => {
    const turn = makeTurn(`view-${index}`, index % 2 === 0 ? "user" : "assistant", `Viewport message ${index}`);
    if (index === 3) turn.rect = { top: 240, bottom: 330, width: 640, height: 90 };
    return turn;
  });
  const viewportPage = await loadContent({
    branchTrackerEnabled: false,
    nextPromptQueueEnabled: false,
    visibleTurns: 1
  }, {}, {
    turns: manyTurns,
    innerHeight: 720
  });
  assert.equal(manyTurns[3].classList.contains("cgpt-lb-hidden"), false, "currently viewed message is not collapsed");
  assert.equal(manyTurns[0].classList.contains("cgpt-lb-hidden"), true, "offscreen older message can still collapse");
  assert.equal(manyTurns[9].classList.contains("cgpt-lb-hidden"), false, "newest message remains visible");

  const emptyQueuePage = await loadContent({
    branchTrackerEnabled: false,
    nextPromptQueueEnabled: true,
    nextPromptQueuePanelShortcut: "Alt+Q"
  });
  const emptyQueueToggle = createModifiedKeyEvent("q", emptyQueuePage.body, { altKey: true });
  emptyQueuePage.document.dispatchEvent(emptyQueueToggle);
  assert.equal(emptyQueueToggle.defaultPrevented, true);
  const emptyQueuePanel = emptyQueuePage.document.getElementById("cgpt-lb-next-prompt-panel-v152");
  assert.ok(emptyQueuePanel, "empty queue panel should render");
  assert.match(emptyQueuePanel.textContent, /Queue 비어 있음/);
  assert.equal(emptyQueuePanel.querySelectorAll("textarea").length, 0);

  const queuePage = await loadContent({
    branchTrackerEnabled: true,
    branchTrackerShortcut: "Alt+B",
    nextPromptQueueEnabled: true,
    nextPromptQueueShortcut: "Tab",
    nextPromptQueuePanelShortcut: "Alt+Q"
  });
  queuePage.document.dispatchEvent(createKeyEvent("Tab", queuePage.composer));
  queuePage.composer.textContent = "second queued prompt";
  queuePage.document.dispatchEvent(createKeyEvent("Tab", queuePage.composer));

  const queuePanel = queuePage.document.getElementById("cgpt-lb-next-prompt-panel-v152");
  assert.ok(queuePanel, "queue panel should render");
  const textareas = queuePanel.querySelectorAll("textarea");
  assert.equal(textareas[0].value, "follow up question");
  assert.equal(textareas[1].value, "second queued prompt");

  const editArea = textareas[0];
  editArea.value = "edited first prompt";
  editArea.input();
  queuePage.sendButton.clickCount = 0;
  queuePage.busy.remove();
  queuePage.intervals.forEach((callback) => callback());
  assert.equal(queuePage.sendButton.clickCount, 1);
  assert.equal(queuePage.composer.textContent, "edited first prompt");

  const queueToggle = createModifiedKeyEvent("q", queuePage.body, { altKey: true });
  queuePage.document.dispatchEvent(queueToggle);
  assert.equal(queueToggle.defaultPrevented, true);
  assert.equal(queuePanel.hidden, false, "queue panel stays visible as a mini overlay");
  assert.equal(queuePanel.classList.contains("cgpt-lb-next-mini-panel"), true, "queue panel shortcut collapses to mini mode");
  assert.match(queuePanel.textContent, /Queue 열어보기/, "queue mini overlay shows an open-queue label");
  queuePanel.click();
  assert.equal(queuePanel.classList.contains("cgpt-lb-next-mini-panel"), false, "clicking the queue mini overlay reopens the panel");

  const queueToggleButton = queuePage.document.getElementById("cgpt-lb-next-prompt-toggle-v152");
  assert.ok(queueToggleButton, "queue toggle button should render");
  queueToggleButton.click();
  assert.equal(queuePanel.classList.contains("cgpt-lb-next-mini-panel"), true, "queue toggle button collapses the panel");
  queueToggleButton.click();
  assert.equal(queuePanel.classList.contains("cgpt-lb-next-mini-panel"), false, "queue toggle button reopens the panel");

  const branchState = {
    "https://chatgpt.com/c/example": {
      snapshots: [
        {
          ids: ["u1", "a1", "u2", "a2"],
          nodes: [
            { id: "u1", role: "user", index: 0, preview: "Question 1" },
            { id: "a1", role: "assistant", index: 1, preview: "Answer 1" },
            { id: "u2", role: "user", index: 2, preview: "Question 2" },
            { id: "a2", role: "assistant", index: 3, preview: "Answer 2" }
          ]
        },
        {
          ids: ["u1", "a1", "u2b", "a2b", "u3b", "a3b"],
          nodes: [
            { id: "u1", role: "user", index: 0, preview: "Question 1" },
            { id: "a1", role: "assistant", index: 1, preview: "Answer 1" },
            { id: "u2b", role: "user", index: 2, preview: "Alternative prompt" },
            { id: "a2b", role: "assistant", index: 3, preview: "Alternative answer" },
            { id: "u3b", role: "user", index: 4, preview: "Nested edited branch prompt" },
            { id: "a3b", role: "assistant", index: 5, preview: "Nested edited branch answer" }
          ]
        }
      ]
    }
  };
  const branchedPage = await loadContent({
    branchTrackerEnabled: true,
    branchTrackerShortcut: "Alt+B",
    nextPromptQueueEnabled: true,
    nextPromptQueueShortcut: "Tab"
  }, {
    "cgptLongChatLoader.branchPaths.v1": JSON.stringify(branchState)
  });
  const branchedGraph = branchedPage.document.getElementById("cgpt-lb-branch-map-v152");
  assert.match(branchedGraph.textContent, /분기 전: Question 1/);
  assert.match(branchedGraph.textContent, /시작: Question 2/);
  assert.match(branchedGraph.textContent, /응답: Answer 2/);
  assert.doesNotMatch(branchedGraph.textContent, /Alternative prompt/);
  assert.doesNotMatch(branchedGraph.textContent, /분기 전: Question 2/);
  const splitGroups = branchedGraph.querySelectorAll(".cgpt-lb-branch-split");
  assert.equal(splitGroups.length, 1, "expanded branch graph shows only real prompt-answer pair forks");
  assert.ok(branchedGraph.querySelector(".cgpt-lb-branch-svg"), "expanded branch graph renders as SVG");
  const firstSplit = branchedGraph.querySelector('[data-branch-index="1"]');
  assert.equal(firstSplit.querySelectorAll(".cgpt-lb-branch-node-action").length, 3, "a branch split renders the parent prompt plus each branch start prompt");
  assert.equal(firstSplit.querySelectorAll(".cgpt-lb-branch-node-action-before").length, 1);
  assert.equal(firstSplit.querySelectorAll(".cgpt-lb-branch-node-action-start").length, 2);
  assert.ok(firstSplit.querySelector(".cgpt-lb-branch-edge-fork"));
  assert.ok(firstSplit.querySelector(".cgpt-lb-branch-node-before"));
  assert.ok(firstSplit.querySelector(".cgpt-lb-branch-node-after"));
  firstSplit.querySelector('[data-branch-target-id="u2b"]').click();
  assert.match(branchedGraph.textContent, /시작: Alternative prompt/);
  assert.match(branchedGraph.textContent, /응답: Alternative answer/);
  assert.doesNotMatch(branchedGraph.textContent, /시작: Question 2/);
  assert.equal(branchedGraph.querySelector('[data-branch-target-id="u3b"]'), null, "a single nested continuation is not a branch node");
  assert.doesNotMatch(branchedGraph.textContent, /Nested edited branch answer/);
  const branchedToggle = createModifiedKeyEvent("b", branchedPage.body, { altKey: true });
  branchedPage.document.dispatchEvent(branchedToggle);
  assert.equal(branchedGraph.classList.contains("cgpt-lb-branch-mini"), true, "branched graph collapses to compare-only mini mode");
  assert.ok(branchedGraph.querySelector(".cgpt-lb-branch-svg-mini"), "branch mini renders as compact SVG graph");
  assert.equal(branchedGraph.querySelectorAll(".cgpt-lb-branch-node-action").length, 3, "branch mini renders only parent and branch-start pair nodes");
  assert.doesNotMatch(branchedGraph.textContent, /Question 1|Question 2|Alternative prompt|Nested edited branch prompt/);
  const miniNode = branchedGraph.querySelector(".cgpt-lb-branch-node-action");
  branchedGraph.dispatchEvent({ type: "click", target: miniNode });
  assert.equal(branchedGraph.classList.contains("cgpt-lb-branch-mini"), false, "clicking the compact graph opens the branch panel");
  branchedGraph.querySelector('[data-branch-target-id="u2"]').click();
  const firstBranchDetail = branchedGraph.querySelector(".cgpt-lb-branch-detail");
  const currentBranchStart = branchedPage.document.querySelector('[data-message-id="u2"]');
  assert.equal(currentBranchStart.scrollIntoViewCount, 1, "clicking a branch summary jumps to the visible branch prompt");
  assert.equal(currentBranchStart.lastScrollIntoViewArg.block, "center");
  assert.equal(currentBranchStart.lastScrollIntoViewArg.behavior, "smooth");
  firstBranchDetail.click();
  assert.equal(currentBranchStart.scrollIntoViewCount, 2, "clicking the selected branch detail can jump again");

  const answerOnlyTurn = makeTurn("a2", "assistant", "Answer 2");
  const answerFallbackPage = await loadContent({
    branchTrackerEnabled: true,
    branchTrackerShortcut: "Alt+B",
    nextPromptQueueEnabled: false
  }, {
    "cgptLongChatLoader.branchPaths.v1": JSON.stringify(branchState)
  }, {
    turns: [
      makeTurn("u1", "user", "Question 1"),
      makeTurn("a1", "assistant", "Answer 1"),
      answerOnlyTurn
    ]
  });
  const answerFallbackGraph = answerFallbackPage.document.getElementById("cgpt-lb-branch-map-v152");
  answerFallbackGraph.querySelector('[data-branch-target-id="u2"]').click();
  assert.equal(answerOnlyTurn.scrollIntoViewCount, 1, "branch pair node falls back to the paired answer when the prompt is absent");

  const summarizedPage = await loadContent({
    branchTrackerEnabled: true,
    branchTrackerShortcut: "Alt+B",
    nextPromptQueueEnabled: true,
    nextPromptQueueShortcut: "Tab"
  }, {
    "cgptLongChatLoader.branchPaths.v1": JSON.stringify({
      "https://chatgpt.com/c/example": {
        snapshots: [
          {
            ids: ["u1", "a1", "short-user-branch"],
            nodes: [
              { id: "u1", role: "user", index: 0, preview: "Question 1" },
              { id: "a1", role: "assistant", index: 1, preview: "Answer 1" },
              { id: "short-user-branch", role: "user", index: 2, preview: "Short branch prompt" },
              { id: "short-answer-branch", role: "assistant", index: 3, preview: "Short branch answer" }
            ]
          },
          {
            ids: ["u1", "a1", "long-user-branch", "long-answer-branch"],
            nodes: [
              { id: "u1", role: "user", index: 0, preview: "Question 1" },
              { id: "a1", role: "assistant", index: 1, preview: "Answer 1" },
              {
                id: "long-user-branch",
                role: "user",
                index: 2,
                preview: "현재 코드를 추가적으로 개선하여 branch tree에서 사용자의 매우 긴 프롬프트 전문을 그대로 보여주지 말고 간략한 제목처럼 정리해서 보여줘. 추가 설명은 아주 길게 이어진다."
              },
              { id: "long-answer-branch", role: "assistant", index: 3, preview: "Long branch answer" }
            ]
          }
        ]
      }
    })
  });
  const summarizedGraph = summarizedPage.document.getElementById("cgpt-lb-branch-map-v152");
  summarizedGraph.querySelector('[data-branch-target-id="long-user-branch"]').click();
  assert.match(summarizedGraph.textContent, /코드를 추가/);
  assert.doesNotMatch(summarizedGraph.textContent, /추가 설명은 아주 길게 이어진다/);
})();
