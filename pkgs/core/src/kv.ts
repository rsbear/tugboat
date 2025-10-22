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

export type KvOkList<T> = {
  _tag: "Ok";
  _type: "List";
  values: KvItem<T>[];
  metadata: KvItem<T>["metadata"];
};

export type KvOkItem<T> = {
  _tag: "Ok";
  _type: "Item";
  value: T;
  metadata: KvItem<T>["metadata"];
};

export type KvOkString = {
  _tag: "Ok";
  _type: "String";
  value: string;
};

export type KvNone = { _tag: "None" };
export type KvError = { _tag: "Error"; error: string };

export type KvMsg<T> =
  | KvOkList<T>
  | KvOkItem<T>
  | KvOkString
  | KvNone
  | KvError;

class KvValidator<T, State extends string = "initial"> {
  constructor(public msg: KvMsg<T>) {}

  isOk(): this is KvValidator<
    T,
    "ok_list" | "ok_item" | "ok_string"
  > {
    return this.msg._tag === "Ok";
  }

  isList(
    this: KvValidator<T, "ok_list" | "ok_item" | "ok_string">,
  ): this is KvValidator<T, "ok_list"> {
    return this.msg._tag === "Ok" && this.msg._type === "List";
  }

  isItem(
    this: KvValidator<T, "ok_list" | "ok_item" | "ok_string">,
  ): this is KvValidator<T, "ok_item"> {
    return this.msg._tag === "Ok" && this.msg._type === "Item";
  }

  isString(
    this: KvValidator<T, "ok_list" | "ok_item" | "ok_string">,
  ): this is KvValidator<T, "ok_string"> {
    return this.msg._tag === "Ok" && this.msg._type === "String";
  }

  isError(): this is KvValidator<T, "error"> {
    return this.msg._tag === "Error";
  }

  isNone(): this is KvValidator<T, "none"> {
    return this.msg._tag === "None";
  }

  values(this: KvValidator<T, "ok_list">): KvItem<T>[] {
    return (this.msg as KvOkList<T>).values;
  }

  value(
    this: KvValidator<T, "ok_item" | "ok_string">,
  ): T | string {
    return (this.msg as KvOkItem<T> | KvOkString).value;
  }

  metadata(
    this: KvValidator<T, "ok_list" | "ok_item">,
  ): KvItem<T>["metadata"] {
    return (this.msg as KvOkList<T> | KvOkItem<T>).metadata;
  }

  error(this: KvValidator<T, "error">): string {
    return (this.msg as KvError).error;
  }
}

export interface KV<T> {
  list(key: string[]): Promise<KvValidator<T>>;
  get(key: string[]): Promise<KvValidator<T>>;
  set(key: string[], value: T): Promise<KvValidator<T>>;
  delete(key: string[]): Promise<KvValidator<void>>;
}

export function kv<T>(baseKey: string): KV<T> {
  return {
    list: (kvKey: string[]) => kvList<T>(baseKey, kvKey),
    get: (kvKey: string[]) => kvGet<T>(baseKey, kvKey),
    set: (kvKey: string[], value: T) => kvSet<T>(baseKey, kvKey, value),
    delete: (kvKey: string[]) => kvDelete<undefined>(baseKey, kvKey),
  };
}

async function kvList<T>(
  baseKey: string,
  key: string[],
): Promise<KvValidator<T>> {
  try {
    const items = await invoke<KvItem<T>[]>("kv_list", {
      prefix: [baseKey, ...key],
    });

    if (!items.length) {
      return new KvValidator({ _tag: "None" });
    }

    return new KvValidator({
      _tag: "Ok",
      _type: "List",
      values: items,
      metadata: items[0].metadata,
    });
  } catch (err) {
    const errorMsg = err instanceof Error
      ? err.message
      : "Error listing values";
    return new KvValidator({ _tag: "Error", error: errorMsg });
  }
}

async function kvGet<T>(
  baseKey: string,
  key: string[],
): Promise<KvValidator<T>> {
  try {
    const fullKey = [baseKey, ...key];
    const result = await invoke<KvItem<T>>("kv_get", {
      key: fullKey,
    });

    if (result === null) {
      return new KvValidator({ _tag: "None" });
    }

    return new KvValidator({
      _tag: "Ok",
      _type: "Item",
      value: result.value,
      metadata: result.metadata,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error getting value";
    return new KvValidator({
      _tag: "Error",
      error: errorMsg,
    });
  }
}

async function kvSet<T>(
  baseKey: string,
  key: string[],
  value: T,
): Promise<KvValidator<T>> {
  try {
    const fullKey = [baseKey, ...key];
    await invoke<void>("kv_set", { key: fullKey, value });

    return new KvValidator<T>({
      _tag: "Ok",
      _type: "String",
      value: `Set ${fullKey.join("/")}`,
    } as any);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error setting value";
    return new KvValidator({ _tag: "Error", error: errorMsg });
  }
}

async function kvDelete<T>(
  baseKey: string,
  key: string[],
): Promise<KvValidator<T>> {
  try {
    const fullKey = [baseKey, ...key];
    await invoke<void>("kv_delete", { key: fullKey });

    return new KvValidator<T>({
      _tag: "Ok",
      _type: "String",
      value: `Deleted ${fullKey.join("/")}`,
    } as any);
  } catch (err) {
    const errorMsg = err instanceof Error
      ? err.message
      : "Error deleting value";
    return new KvValidator({
      _tag: "Error",
      error: errorMsg,
    });
  }
}
