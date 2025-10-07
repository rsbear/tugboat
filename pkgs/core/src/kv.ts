// pkgs/core/src/kv.ts
// import { invoke } from "@tauri-apps/api/core";

// @ts-ignore
const { invoke } = window.__TAURI__.core;

export interface KvItem<T> {
  value: T;
  metadata: {
    key: string[];
    created_at: number;
    updated_at: number;
  };
}

export type KvMsg<T> =
  | { _tag: "None"; result: null }
  | { _tag: "Error"; result: string }
  | { _tag: "Ok"; _type: "List"; result: KvItem<T>[] }
  | { _tag: "Ok"; _type: "Item"; result: KvItem<T> }
  | { _tag: "Ok"; _type: "String"; result: string };

export interface KvTable<T> {
  list(): Promise<KvMsg<T>>;
  get(key: string[]): Promise<KvMsg<T>>;
  set(key: string[], value: T): Promise<KvMsg<T>>;
  delete(key: string[]): Promise<KvMsg<void>>;
}

export function kvTable<T>(baseKey: string): KvTable<T> {
  return {
    list: () => kvList<T>(baseKey),
    get: (kvKey: string[]) => kvGet<T>(baseKey, kvKey),
    set: (kvKey: string[], value: T) => kvSet<T>(baseKey, kvKey, value),
    delete: (kvKey: string[]) => kvDelete<undefined>(baseKey, kvKey),
  };
}

async function kvList<T>(baseKey: string): Promise<KvMsg<T>> {
  try {
    const items = await invoke<KvItem<T>[]>("kv_list", {
      prefix: [baseKey],
    });

    if (!items.length) {
      return { _tag: "None", result: null };
    }

    return { _tag: "Ok", _type: "List", result: items };
  } catch (err) {
    const errorMsg = err instanceof Error
      ? err.message
      : "Error listing values";
    return { _tag: "Error", result: errorMsg };
  }
}

async function kvGet<T>(baseKey: string, key: string[]): Promise<KvMsg<T>> {
  try {
    const fullKey = [baseKey, ...key];
    const result = await invoke<KvItem<T>>("kv_get", {
      key: fullKey,
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

async function kvSet<T>(
  baseKey: string,
  key: string[],
  value: T,
): Promise<KvMsg<T>> {
  try {
    const fullKey = [baseKey, ...key];
    await invoke<void>("kv_set", { key: fullKey, value });

    return { _tag: "Ok", _type: "String", result: `Set ${fullKey}` };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error getting value";
    return { _tag: "Error", result: errorMsg };
  }
}

async function kvDelete<T>(baseKey: string, key: string[]): Promise<KvMsg<T>> {
  try {
    const fullKey = [baseKey, ...key];
    await invoke<KvItem<T>>("kv_delete", { key: fullKey });

    return { _tag: "Ok", _type: "String", result: `Deleted ${fullKey}` };
  } catch (err) {
    const errorMsg = err instanceof Error
      ? err.message
      : "Error deleting value";
    return { _tag: "Error", result: errorMsg };
  }
}
