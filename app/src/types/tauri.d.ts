// Ambient types for Tauri globals used in the frontend
// This is intentionally minimal and can be extended as needed.

export {};

declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke: (cmd: string, args?: Record<string, unknown>) => Promise<any>;
      };
      event?: {
        listen: (
          event: string,
          handler: (payload: any) => void
        ) => Promise<() => void>;
      };
    };
  }
}
