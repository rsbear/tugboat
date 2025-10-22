// pkgs/core/input.ts
export type InputState = {
  raw: string;
};

export type ParsedInput = {
  raw: string;
  alias: string; // First word (e.g., "clone" from "clone my-repo")
  query: string; // Everything after alias (e.g., "my-repo" from "clone my-repo")
};

export type SubmitHandler = (input: ParsedInput) => Promise<void> | void;

class InputStore {
  private state: InputState = { raw: "" };
  private listeners = new Set<(s: InputState) => void>();
  private submitHandler: SubmitHandler | null = null;
  private isHiddenState: boolean = false;

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

  // Register submit handler
  onSubmit(handler: SubmitHandler) {
    this.submitHandler = handler;
    // Return unregister function
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
  private parse(raw: string): ParsedInput {
    const trimmed = raw.trim();
    const parts = trimmed.split(/\s+/);
    const alias = parts[0] || "";
    const query = parts.slice(1).join(" ");

    return { raw: trimmed, alias, query };
  }

  /**
   * Hide the host input block
   */
  hide(bool: boolean): void {
    this.isHiddenState = bool;
  }

  /**
   * Check if the host input block is hidden
   */
  isHidden(): boolean {
    return this.isHiddenState;
  }
}

export const input = new InputStore();
