type InputState = {
    raw: string;
};
type ParsedInput = {
    raw: string;
    alias: string;
    query: string;
};
type SubmitHandler = (input: ParsedInput) => Promise<void> | void;
declare class InputStore {
    private state;
    private listeners;
    private submitHandler;
    private isHiddenState;
    get(): InputState;
    set(raw: string): void;
    subscribe(fn: (s: InputState) => void): () => boolean;
    onSubmit(handler: SubmitHandler): () => void;
    submit(): Promise<void>;
    private parse;
    /**
     * Hide the host input block
     */
    hide(bool: boolean): void;
    /**
     * Check if the host input block is hidden
     */
    isHidden(): boolean;
}
declare const input: InputStore;

interface KvItem<T> {
    value: T;
    metadata: {
        key: string[];
        created_at: number;
        updated_at: number;
    };
}
type KvOkList<T> = {
    _tag: "Ok";
    _type: "List";
    values: KvItem<T>[];
    metadata: KvItem<T>["metadata"];
};
type KvOkItem<T> = {
    _tag: "Ok";
    _type: "Item";
    value: T;
    metadata: KvItem<T>["metadata"];
};
type KvOkString = {
    _tag: "Ok";
    _type: "String";
    value: string;
};
type KvNone = {
    _tag: "None";
};
type KvError = {
    _tag: "Error";
    error: string;
};
type KvMsg<T> = KvOkList<T> | KvOkItem<T> | KvOkString | KvNone | KvError;
declare class KvValidator<T, State extends string = "initial"> {
    msg: KvMsg<T>;
    constructor(msg: KvMsg<T>);
    isOk(): this is KvValidator<T, "ok_list" | "ok_item" | "ok_string">;
    isList(this: KvValidator<T, "ok_list" | "ok_item" | "ok_string">): this is KvValidator<T, "ok_list">;
    isItem(this: KvValidator<T, "ok_list" | "ok_item" | "ok_string">): this is KvValidator<T, "ok_item">;
    isString(this: KvValidator<T, "ok_list" | "ok_item" | "ok_string">): this is KvValidator<T, "ok_string">;
    isError(): this is KvValidator<T, "error">;
    isNone(): this is KvValidator<T, "none">;
    values(this: KvValidator<T, "ok_list">): KvItem<T>[];
    value(this: KvValidator<T, "ok_item" | "ok_string">): T | string;
    metadata(this: KvValidator<T, "ok_list" | "ok_item">): KvItem<T>["metadata"];
    error(this: KvValidator<T, "error">): string;
}
interface KV<T> {
    list(key: string[]): Promise<KvValidator<T>>;
    get(key: string[]): Promise<KvValidator<T>>;
    set(key: string[], value: T): Promise<KvValidator<T>>;
    delete(key: string[]): Promise<KvValidator<void>>;
}
declare function kv<T>(baseKey: string): KV<T>;

/**
 * Get a secret from the tugboats vault.
 * The host manages secret storage and encryption.
 * This function provides read-only, synchronous access for tugboat apps.
 *
 * All secrets are decrypted and cached in memory when the vault is unlocked.
 * This function reads from that cache, making it fast and synchronous.
 *
 * @param secretKey - The key of the secret to retrieve
 * @returns The decrypted secret value, or null if not found
 * @throws If the vault is locked or secrets API is not available
 */
declare function getSecret(secretKey: string): string | null;

export { type InputState, type KV, type KvItem, type KvMsg, type ParsedInput, type SubmitHandler, getSecret, input, kv };
