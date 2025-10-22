// pkgs/core/mod.ts

// Core functionality
export { input } from "./input.ts";
export { kv } from "./kv.ts";

// Types for external consumption
export type { InputState, ParsedInput, SubmitHandler } from "./input.ts";
export type { KV, KvItem, KvMsg } from "./kv.ts";
