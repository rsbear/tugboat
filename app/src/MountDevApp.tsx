import { useEffect, useRef, useState } from "npm:preact/compat";
import type { Ref } from "preact";
import { btn } from "./design/buttons.ts";
import { content } from "./design/content.ts";
import { title } from "./design/text.ts";

const { invoke } = (window as any).__TAURI__.core;
const { listen } = (window as any).__TAURI__.event;

interface DevLog {
  type: "info" | "success" | "error";
  content: string;
  timestamp: Date;
}

export function MountDevApp(props: { alias: string }) {
  const currentAlias = props?.alias ?? "";
  const [status, setStatus] = useState<"starting" | "active" | "error">(
    "starting",
  );
  const [logs, setLogs] = useState<DevLog[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const moduleRef = useRef<any>(null);

  const addLog = (type: DevLog["type"], content: string) => {
    setLogs(
      (prev) => [...prev.slice(-199), { type, content, timestamp: new Date() }],
    );
  };

  const unmountModule = async () => {
    // Call cleanup function if available
    if (cleanupRef.current) {
      try {
        await cleanupRef.current();
      } catch {}
      cleanupRef.current = null;
    }

    // Call module unmount if available
    if (moduleRef.current) {
      try {
        const unmount = moduleRef.current.unmount ||
          moduleRef.current.tugboatUnmount;
        if (typeof unmount === "function") {
          await unmount(slotRef.current);
        }
      } catch {}
    }

    // Clear slot
    if (slotRef.current) {
      slotRef.current.innerHTML = "";
    }

    moduleRef.current = null;
  };

  const loadDevBundle = async (alias: string) => {
    await unmountModule();

    if (!slotRef.current) return;

    try {
      const home = await invoke("get_home_dir");
      const bundlePath = `${home}/.tugboats/bundles/${alias}-dev.js`;
      const bundleContent = await invoke("read_text_file", {
        path: bundlePath,
      });

      const blob = new Blob([bundleContent], {
        type: "application/javascript",
      });
      const bundleUrl = URL.createObjectURL(blob);

      const mod = await import(/* @vite-ignore */ bundleUrl);
      URL.revokeObjectURL(bundleUrl);

      if (!mod) return;

      moduleRef.current = mod;

      const mount = mod.tugboatReact || mod.tugboatSvelte || mod.mount ||
        mod.default;
      if (typeof mount === "function") {
        const dispose = await mount(slotRef.current);
        if (typeof dispose === "function") {
          cleanupRef.current = dispose;
        }
        setStatus("active");
      } else {
        throw new Error("No mount function exported from dev module");
      }
    } catch (e) {
      console.error("Failed to load dev bundle:", e);
      addLog("error", `Failed to load bundle: ${e}`);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!currentAlias) return;

    let unlisteners: Array<() => void> = [];

    const startDev = async () => {
      try {
        addLog("info", `🚀 Starting Vite dev server for "${currentAlias}"...`);
        await invoke("start_dev", { alias: currentAlias });
      } catch (err) {
        console.error("Failed to start dev mode:", err);
        addLog("error", `Failed to start dev mode: ${err}`);
        setStatus("error");
      }
    };

    const setupListeners = async () => {
      const unlisten1 = await listen("dev:build_started", (event: any) => {
        addLog("info", `🔨 Building ${event.payload}...`);
      });

      const unlisten2 = await listen(
        "dev:build_completed",
        async (event: any) => {
          addLog("success", `✅ Build completed for ${event.payload}`);
          await loadDevBundle(event.payload);
        },
      );

      const unlisten3 = await listen("dev:build_error", (event: any) => {
        const [alias, error] = event.payload;
        addLog("error", `❌ Build failed for ${alias}:`);
        addLog("error", error);
        setStatus("error");
      });

      const unlisten4 = await listen("dev:ready", async (event: any) => {
        addLog("info", `🚀 Dev mode ready for ${event.payload}`);
        await loadDevBundle(event.payload);
      });

      const unlisten5 = await listen(
        "dev:build_success",
        async (event: any) => {
          if (event.payload === currentAlias) {
            await loadDevBundle(event.payload);
          }
        },
      );

      const unlisten6 = await listen("dev:stopped", async () => {
        await unmountModule();
        setStatus("error");
      });

      unlisteners = [
        unlisten1,
        unlisten2,
        unlisten3,
        unlisten4,
        unlisten5,
        unlisten6,
      ];
    };

    setupListeners();
    startDev();

    return () => {
      // Cleanup on unmount
      invoke("stop_dev").catch(console.error);
      unmountModule();
      unlisteners.forEach((u) => u());
    };
  }, [currentAlias]);

  // Keyboard shortcut for Cmd+L to toggle logs modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();
        setShowLogsModal((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (showLogsModal && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, showLogsModal]);

  if (!currentAlias) return null;

  const statusText = status === "starting"
    ? "Starting..."
    : status === "active"
    ? "Active"
    : "Error";

  return (
    <div class="flex flex-col gap-2 relative">
      {/* Header Section */}
      <div class={content({ y: "3" })}>
        <div class="flex justify-between items-center">
          <h2 class={title({ uppercase: true })}>
            Dev: {currentAlias} ({statusText})
          </h2>
          <div class="flex items-center gap-2">
            <StatusIndicator status={status} />
            <KeyboardHint
              keys={["⌘", "L"]}
              label="TOGGLE LOGS"
              showLogsModal={showLogsModal}
              setShowLogsModal={setShowLogsModal}
            />
          </div>
        </div>
      </div>

      {/* App Section - Always Mounted */}
      <div class={content({ frame: true })}>
        <div ref={slotRef} class="tugboat-dev-slot" />
      </div>

      {/* Logs Modal */}
      {showLogsModal && (
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-slate-900 rounded-lg shadow-2xl w-full max-h-96 max-w-2xl flex flex-col">
            <LogsView
              logs={logs}
              logsEndRef={logsEndRef}
              onClear={() => setLogs([])}
              onClose={() => setShowLogsModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIndicator({
  status,
}: {
  status: "starting" | "active" | "error";
}) {
  const colorClass = status === "starting"
    ? "text-blue-400"
    : status === "active"
    ? "text-green-400"
    : "text-red-400";

  return <span class={colorClass}>&middot;</span>;
}

function KeyboardHint({
  keys,
  label,
  showLogsModal,
  setShowLogsModal,
}: {
  keys: string[];
  label: string;
  showLogsModal: boolean;
  setShowLogsModal: (show: boolean) => void;
}) {
  return (
    <div class="flex items-center gap-1 text-xs opacity-70 font-mono">
      {keys.map((k) => <KeyIcon char={k} />)}
      <button
        onClick={() => setShowLogsModal(!showLogsModal)}
      >
        {label}
      </button>
    </div>
  );
}

function KeyIcon({ char }: { char: string }) {
  return (
    <div class="h-4 w-4 grid place-items-center rounded-xs ring-[1px] ring-gray-500">
      <span>
        {char}
      </span>
    </div>
  );
}

function LogsView({
  logs,
  logsEndRef,
  onClear,
  onClose,
}: {
  logs: DevLog[];
  logsEndRef: Ref<HTMLDivElement>;
  onClear: () => void;
  onClose?: () => void;
}) {
  return (
    <div class="flex flex-col h-full">
      <div class="flex justify-between items-center px-4 py-3 border-b border-slate-700 sticky top-0 bg-slate-900">
        <span class="text-gray-300 font-mono text-sm">Dev Mode Logs</span>
        <div class="flex items-center gap-2">
          <button class={btn({ type: "sm" })} onClick={onClear}>
            Clear
          </button>
          {onClose && (
            <button class={btn({ type: "sm" })} onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
      <div class="px-3 py-2 overflow-y-auto flex-1 font-mono text-xs">
        {logs.length === 0
          ? (
            <div class="text-gray-500">
              No logs yet. Waiting for dev events...
            </div>
          )
          : (
            <>
              {logs.map((log, i) => (
                <div key={i} class={`py-1 flex gap-2 ${getLogColor(log.type)}`}>
                  <span class="text-gray-500 text-[10px] min-w-[60px]">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span class="whitespace-pre-wrap">{log.content}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
      </div>
    </div>
  );
}

function getLogColor(type: DevLog["type"]): string {
  return type === "error"
    ? "text-red-400"
    : type === "success"
    ? "text-green-400"
    : "text-gray-300";
}
