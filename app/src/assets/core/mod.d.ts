type InputState = {
    raw: string;
};
declare class InputStore {
    private state;
    private listeners;
    get(): InputState;
    set(raw: string): void;
    subscribe(fn: (s: InputState) => void): () => boolean;
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
type KvMsg<T> = {
    _tag: "None";
    result: null;
} | {
    _tag: "Error";
    result: string;
} | {
    _tag: "Ok";
    _type: "List";
    result: KvItem<T>[];
} | {
    _tag: "Ok";
    _type: "Item";
    result: KvItem<T>;
} | {
    _tag: "Ok";
    _type: "String";
    result: string;
};
interface KvTable<T> {
    list(): Promise<KvMsg<T>>;
    get(key: string[]): Promise<KvMsg<T>>;
    set(key: string[], value: T): Promise<KvMsg<T>>;
    delete(key: string[]): Promise<KvMsg<void>>;
}
declare function kvTable<T>(baseKey: string): KvTable<T>;

export { type InputState, type KvItem, type KvMsg, type KvTable, input, kvTable };
