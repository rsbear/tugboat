// pkgs/core/input.ts
export type InputState = {
  raw: string;
};

class InputStore {
  private state: InputState = { raw: "" };
  private listeners = new Set<(s: InputState) => void>();

  get() {
    return this.state;
  }

  set(raw: string) {
    this.state = { raw };
    this.listeners.forEach((fn) => fn(this.state));
  }

  subscribe(fn: (s: InputState) => void) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }
}

export const input = new InputStore();
