import { useEffect, useRef, useState } from "npm:preact/compat";

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
  const [showLogs, setShowLogs] = useState(true);
  const slotRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const moduleRef = useRef<any>(null);

  const addLog = (type: DevLog["type"], content: string) => {
    setLogs(
      (prev) => [...prev.slice(-199), { type, content, timestamp: new Date() }]
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

  if (!currentAlias) return null;

  const statusEmoji = status === "starting"
    ? "🚀"
    : status === "active"
    ? "👁️"
    : "❌";
  const statusText = status === "starting"
    ? "Starting..."
    : status === "active"
    ? "Active"
    : "Error";

  return (
    <div className="dev-mode-container">
      <div className={`dev-mode-indicator ${status}`}>
        {statusEmoji} Dev: {currentAlias} ({statusText})
      </div>

      <div className="dev-mode-logs">
        <div className="dev-mode-logs-header">
          <span className="dev-mode-logs-title">Dev Mode Logs</span>
          <button onClick={() => setShowLogs(!showLogs)}>
            {showLogs ? "Hide" : "Show"}
          </button>
          <button onClick={() => setLogs([])}>Clear</button>
        </div>
        {showLogs && (
          <div className="dev-mode-logs-content">
            {logs.map((log, i) => (
              <div key={i} className={`dev-log-entry dev-log-${log.type}`}>
                <span className="dev-log-time">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className="dev-log-content">{log.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div ref={slotRef} className="tugboat-dev-slot" />

      <style>
        {`
        .dev-mode-indicator { background: #1e293b; color: #94a3b8; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; margin: 8px 0; border-left: 4px solid #475569; }
        .dev-mode-indicator.starting { background: #0f172a; color: #60a5fa; border-left-color: #3b82f6; animation: pulse 2s infinite; }
        .dev-mode-indicator.active { background: #064e3b; color: #6ee7b7; border-left-color: #10b981; }
        .dev-mode-indicator.error { background: #7f1d1d; color: #fca5a5; border-left-color: #dc2626; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .dev-mode-logs { background: #0f172a; border: 1px solid #334155; border-radius: 8px; margin: 16px 0; max-height: 400px; display: flex; flex-direction: column; }
        .dev-mode-logs-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #1e293b; border-bottom: 1px solid #334155; }
        .dev-mode-logs-title { color: #e2e8f0; font-weight: 500; flex: 1; }
        .dev-mode-logs-header button { background: #475569; color: #e2e8f0; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; }
        .dev-mode-logs-header button:hover { background: #64748b; }
        .dev-mode-logs-content { flex: 1; padding: 8px; overflow-y: auto; max-height: 300px; font-family: monospace; font-size: 12px; line-height: 1.4; }
        .dev-log-entry { display: flex; gap: 8px; margin-bottom: 4px; }
        .dev-log-time { color: #64748b; font-size: 11px; min-width: 60px; }
        .dev-log-content { color: #e2e8f0; flex: 1; }
        .dev-log-error .dev-log-content { color: #fca5a5; }
      `}
      </style>
    </div>
  );
}
