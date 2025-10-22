var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/input.ts
var InputStore = class {
  constructor() {
    __publicField(this, "state", { raw: "" });
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    __publicField(this, "submitHandler", null);
    __publicField(this, "isHiddenState", false);
  }
  get() {
    return this.state;
  }
  set(raw) {
    this.state = { raw };
    this.listeners.forEach((fn) => fn(this.state));
  }
  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }
  // Register submit handler
  onSubmit(handler) {
    this.submitHandler = handler;
    return () => {
      if (this.submitHandler === handler) {
        this.submitHandler = null;
      }
    };
  }
  // Parse and execute submit handler
  async submit() {
    if (!this.submitHandler) return;
    const parsed = this.parse(this.state.raw);
    try {
      await this.submitHandler(parsed);
    } catch (error) {
      console.error("Submit handler error:", error);
      throw error;
    }
  }
  // Parse raw input into structured data
  parse(raw) {
    const trimmed = raw.trim();
    const parts = trimmed.split(/\s+/);
    const alias = parts[0] || "";
    const query = parts.slice(1).join(" ");
    return { raw: trimmed, alias, query };
  }
  /**
   * Hide the host input block
   */
  hide(bool) {
    this.isHiddenState = bool;
  }
  /**
   * Check if the host input block is hidden
   */
  isHidden() {
    return this.isHiddenState;
  }
};
var input = new InputStore();

// src/kv.ts
var { invoke } = window.__TAURI__.core;
var KvValidator = class {
  constructor(msg) {
    this.msg = msg;
  }
  isOk() {
    return this.msg._tag === "Ok";
  }
  isList() {
    return this.msg._tag === "Ok" && this.msg._type === "List";
  }
  isItem() {
    return this.msg._tag === "Ok" && this.msg._type === "Item";
  }
  isString() {
    return this.msg._tag === "Ok" && this.msg._type === "String";
  }
  isError() {
    return this.msg._tag === "Error";
  }
  isNone() {
    return this.msg._tag === "None";
  }
  values() {
    return this.msg.values;
  }
  value() {
    return this.msg.value;
  }
  metadata() {
    return this.msg.metadata;
  }
  error() {
    return this.msg.error;
  }
};
function kv(baseKey) {
  return {
    list: (kvKey) => kvList(baseKey, kvKey),
    get: (kvKey) => kvGet(baseKey, kvKey),
    set: (kvKey, value) => kvSet(baseKey, kvKey, value),
    delete: (kvKey) => kvDelete(baseKey, kvKey)
  };
}
async function kvList(baseKey, key) {
  try {
    const items = await invoke("kv_list", {
      prefix: [baseKey, ...key]
    });
    if (!items.length) {
      return new KvValidator({ _tag: "None" });
    }
    return new KvValidator({
      _tag: "Ok",
      _type: "List",
      values: items,
      metadata: items[0].metadata
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error listing values";
    return new KvValidator({ _tag: "Error", error: errorMsg });
  }
}
async function kvGet(baseKey, key) {
  try {
    const fullKey = [baseKey, ...key];
    const result = await invoke("kv_get", {
      key: fullKey
    });
    if (result === null) {
      return new KvValidator({ _tag: "None" });
    }
    return new KvValidator({
      _tag: "Ok",
      _type: "Item",
      value: result.value,
      metadata: result.metadata
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error getting value";
    return new KvValidator({
      _tag: "Error",
      error: errorMsg
    });
  }
}
async function kvSet(baseKey, key, value) {
  try {
    const fullKey = [baseKey, ...key];
    await invoke("kv_set", { key: fullKey, value });
    return new KvValidator({
      _tag: "Ok",
      _type: "String",
      value: `Set ${fullKey.join("/")}`
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error setting value";
    return new KvValidator({ _tag: "Error", error: errorMsg });
  }
}
async function kvDelete(baseKey, key) {
  try {
    const fullKey = [baseKey, ...key];
    await invoke("kv_delete", { key: fullKey });
    return new KvValidator({
      _tag: "Ok",
      _type: "String",
      value: `Deleted ${fullKey.join("/")}`
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error deleting value";
    return new KvValidator({
      _tag: "Error",
      error: errorMsg
    });
  }
}

export { input, kv };
//# sourceMappingURL=mod.js.map
//# sourceMappingURL=mod.js.map