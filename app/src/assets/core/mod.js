var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/input.ts
var InputStore = class {
  constructor() {
    __publicField(this, "state", { raw: "" });
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
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
};
var input = new InputStore();

// src/kv.ts
var { invoke } = window.__TAURI__.core;
function kvTable(baseKey) {
  return {
    list: () => kvList(baseKey),
    get: (kvKey) => kvGet(baseKey, kvKey),
    set: (kvKey, value) => kvSet(baseKey, kvKey, value),
    delete: (kvKey) => kvDelete(baseKey, kvKey)
  };
}
async function kvList(baseKey) {
  try {
    const items = await invoke("kv_list", {
      prefix: [baseKey]
    });
    if (!items.length) {
      return { _tag: "None", result: null };
    }
    return { _tag: "Ok", _type: "List", result: items };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error listing values";
    return { _tag: "Error", result: errorMsg };
  }
}
async function kvGet(baseKey, key) {
  try {
    const fullKey = [baseKey, ...key];
    const result = await invoke("kv_get", {
      key: fullKey
    });
    if (result === null) {
      return { _tag: "None", result: null };
    }
    return { _tag: "Ok", _type: "Item", result };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error getting value";
    return { _tag: "Error", result: errorMsg };
  }
}
async function kvSet(baseKey, key, value) {
  try {
    const fullKey = [baseKey, ...key];
    await invoke("kv_set", { key: fullKey, value });
    return { _tag: "Ok", _type: "String", result: `Set ${fullKey}` };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error getting value";
    return { _tag: "Error", result: errorMsg };
  }
}
async function kvDelete(baseKey, key) {
  try {
    const fullKey = [baseKey, ...key];
    await invoke("kv_delete", { key: fullKey });
    return { _tag: "Ok", _type: "String", result: `Deleted ${fullKey}` };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error deleting value";
    return { _tag: "Error", result: errorMsg };
  }
}

export { input, kvTable };
//# sourceMappingURL=mod.js.map
//# sourceMappingURL=mod.js.map