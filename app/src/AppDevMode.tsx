import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { AppLogsPane, type LogEntry } from "./AppLogsPane";

export type DevState = {
	isActive: boolean;
	currentAlias: string | null;
	activeSessions: string[];
};

const tauriCore = (window as any).__TAURI__?.core;
const tauriEvent = (window as any).__TAURI__?.event;

type Props = {
	onDevStateChange?: (state: DevState) => void;
	onHandlersReady?: (handlers: {
		startDevMode: (alias: string) => Promise<void>;
		stopDevMode: () => Promise<void>;
		getDevState: () => DevState;
	}) => void;
};

export function AppDevMode(props: Props) {
	const [devState, setDevState] = createSignal<DevState>({
		isActive: false,
		currentAlias: null,
		activeSessions: [],
	});

	const [logs, setLogs] = createSignal<LogEntry[]>([]);
	const [currentView, setCurrentView] = createSignal<"app" | "logs">("app");

	// Remote module mount state
	const currentRemote: {
		url: string | null;
		mod: any;
		cleanup: null | (() => void);
	} = {
		url: null,
		mod: null,
		cleanup: null,
	};

	// Event listeners cleanup functions
	let eventCleanups: Array<() => void> = [];

	const addLogEntry = (
		type: LogEntry["type"],
		content: string,
		timestamp?: number,
	) => {
		const logEntry: LogEntry = {
			id: `${Date.now()}-${Math.random()}`,
			type,
			content,
			timestamp: timestamp ? new Date(timestamp * 1000) : new Date(),
		};

		setLogs((prev) => {
			const newLogs = [...prev, logEntry];
			// Limit to 200 entries
			return newLogs.length > 200 ? newLogs.slice(-200) : newLogs;
		});
	};

	const clearLogs = () => {
		setLogs([]);
	};

	const ensureSlot = (): HTMLElement | null => {
		const devSlot = document.getElementById("tugboats-slot-dev");
		const mainSlot = document.getElementById("tugboats-slot");
		console.log("🔍 DEBUG: ensureSlot - devSlot:", !!devSlot);
		console.log("🔍 DEBUG: ensureSlot - mainSlot:", !!mainSlot);
		return devSlot || mainSlot;
	};

	const recreateSlot = (): HTMLElement | null => {
		const dev = document.getElementById("tugboats-slot-dev");
		if (dev) {
			dev.innerHTML = "";
			return dev as HTMLElement;
		}
		const oldSlot = document.getElementById("tugboats-slot");
		if (oldSlot && oldSlot.parentNode) {
			const newSlot = document.createElement("div");
			newSlot.id = "tugboats-slot";
			oldSlot.parentNode.replaceChild(newSlot, oldSlot);
			return newSlot as HTMLElement;
		}
		return oldSlot as HTMLElement | null;
	};

	const unmountCurrentRemote = async () => {
		const slot = ensureSlot();
		if (typeof currentRemote.cleanup === "function") {
			try {
				currentRemote.cleanup();
			} catch {}
			currentRemote.cleanup = null;
		}
		if (currentRemote.mod) {
			try {
				const unmount =
					currentRemote.mod.unmount || currentRemote.mod.tugboatUnmount;
				if (typeof unmount === "function") await unmount(slot);
			} catch {}
		}
		if (slot) slot.innerHTML = "";
		recreateSlot();
		currentRemote.mod = null;
		currentRemote.url = null;
	};

	const loadDevBundle = async (alias: string) => {
		console.log("🔍 DEBUG: Starting loadDevBundle for alias:", alias);
		await unmountCurrentRemote();
		const slot = ensureSlot();
		console.log("🔍 DEBUG: Slot element:", slot);
		console.log("🔍 DEBUG: Slot element ID:", slot?.id);
		console.log("🔍 DEBUG: Slot element tagName:", slot?.tagName);
		if (!slot) {
			console.error("🔍 DEBUG: No slot element found!");
			addLogEntry("error", "No slot element found - cannot mount bundle");
			return;
		}
		try {
			const home = await tauriCore?.invoke("get_home_dir");
			const bundlePath = `${home}/.tugboats/bundles/${alias}-dev.js`;
			console.log("🔍 DEBUG: Loading bundle from path:", bundlePath);

			// Add small delay to ensure bundle file is fully written
			await new Promise((resolve) => setTimeout(resolve, 100));

			const bundleContent = await tauriCore?.invoke("read_text_file", {
				path: bundlePath,
			});
			console.log("BUNDLE_content", bundleContent);

			if (!bundleContent || typeof bundleContent !== "string") {
				throw new Error(
					`Bundle content is empty or invalid: ${typeof bundleContent}`,
				);
			}

			console.log("🔍 DEBUG: Bundle content length:", bundleContent.length);
			console.log(
				"🔍 DEBUG: Bundle content preview:",
				bundleContent.slice(0, 100),
			);

			// Basic guard: if content looks like HTML, surface a clearer error
			const head = bundleContent.slice(0, 500).toLowerCase();
			if (
				head.includes("<html") ||
				head.includes("<!doctype") ||
				head.includes("<body") ||
				head.includes("<head") ||
				head.includes("404 not found") ||
				head.includes("file not found")
			) {
				console.error(
					"🔍 DEBUG: Bundle content appears to be HTML or error page:",
					head,
				);
				throw new TypeError(
					"Bundle content appears to be HTML or error page (wrong file path or server fallback)",
				);
			}

			// Verify it looks like JavaScript
			if (
				!head.includes("export") &&
				!head.includes("function") &&
				!head.includes("var ") &&
				!head.includes("const ") &&
				!head.includes("let ")
			) {
				console.warn(
					"🔍 DEBUG: Bundle content doesn't look like JavaScript:",
					head,
				);
			}

			// Use data URL approach like working AppInput.tsx (but more robust)
			console.log("🔍 DEBUG: Attempting data URL approach");
			const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(bundleContent)}`;
			console.log("🔍 DEBUG: Created data URL, length:", dataUrl.length);

			// Check if data URL is too long (some browsers have limits)
			if (dataUrl.length > 2097152) {
				// 2MB limit
				console.warn("🔍 DEBUG: Data URL is very large, may cause issues");
			}

			let mod: any;
			let importError: any;

			// Try importing with different approaches
			for (let attempt = 0; attempt < 3; attempt++) {
				try {
					// Use the exact same syntax as working AppInput.tsx
					mod = await import(
						/* @vite-ignore */ /* webpackIgnore: true */ dataUrl as any
					);
					console.log(`🔍 DEBUG: Import attempt ${attempt + 1} succeeded`);
					break;
				} catch (e) {
					importError = e;
					console.error(`🔍 DEBUG: Import attempt ${attempt + 1} failed:`, e);
					console.error(`🔍 DEBUG: Error type:`, e.constructor.name);
					console.error(`🔍 DEBUG: Error message:`, e.message);

					if (attempt < 2) {
						console.warn(`🔍 DEBUG: Retrying import in 300ms...`);
						await new Promise((resolve) => setTimeout(resolve, 300));
					}
				}
			}

			if (!mod && importError) {
				console.error(
					"🔍 DEBUG: All import attempts failed, final error:",
					importError,
				);
				throw importError;
			}

			console.log(
				"🔍 DEBUG: Module imported successfully, exports:",
				mod ? Object.keys(mod) : "null",
			);

			if (!mod) {
				throw new Error("Module import returned null or undefined");
			}

			currentRemote.mod = mod;
			currentRemote.url = bundlePath;

			console.log(
				"🔍 DEBUG: Looking for mount function in exports:",
				Object.keys(mod),
			);
			const mount =
				mod.tugboatReact || mod.tugboatSvelte || mod.mount || mod.default;
			console.log(
				"🔍 DEBUG: Found mount function:",
				typeof mount,
				mount?.name || "anonymous",
			);

			if (typeof mount === "function") {
				console.log("🔍 DEBUG: Calling mount function with slot:", slot);
				console.log("🔍 DEBUG: Slot innerHTML before mount:", slot.innerHTML);
				try {
					const result = await mount(slot);
					console.log("🔍 DEBUG: Mount function returned:", typeof result);
					console.log("🔍 DEBUG: Mount result:", result);
					console.log("🔍 DEBUG: Slot innerHTML after mount:", slot.innerHTML);

					// Handle different return types
					if (typeof result === "function") {
						// Direct cleanup function (Svelte style)
						currentRemote.cleanup = result;
					} else if (result && typeof result.unmount === "function") {
						// React root object
						currentRemote.cleanup = () => {
							try {
								result.unmount();
							} catch {}
						};
					} else if (result && typeof result.render === "function") {
						// Alternative React root pattern
						currentRemote.cleanup = () => {
							try {
								result.unmount();
							} catch {}
						};
					}

					addLogEntry("success", `✅ Successfully mounted ${alias}`);
				} catch (mountError) {
					console.error("🔍 DEBUG: Mount function threw error:", mountError);
					addLogEntry("error", `Mount function failed: ${mountError}`);
					throw mountError;
				}
			} else {
				console.error(
					"No mount function exported from dev module. Available exports:",
					Object.keys(mod),
				);
				addLogEntry(
					"error",
					`No mount function found in module. Exports: ${Object.keys(mod).join(", ")}`,
				);
			}

			// Update dev state to active
			setDevState((prev) => ({ ...prev, isActive: true }));
			console.log("🔍 DEBUG: Dev bundle loaded and mounted successfully");
		} catch (e) {
			console.error("🔍 DEBUG: Failed to load or mount dev module", e);
			console.error("🔍 DEBUG: Error stack:", e.stack);
			addLogEntry("error", `Failed to load bundle: ${e}`);

			// If it's a MIME type error, provide more specific guidance
			if (e instanceof TypeError && e.message.includes("MIME type")) {
				console.error(
					"🔍 DEBUG: MIME type error detected - bundle content may be corrupted or HTML",
				);
				addLogEntry(
					"error",
					"This usually means the bundle file contains HTML instead of JavaScript",
				);
				addLogEntry(
					"error",
					"Check if the dev server is running and the bundle was built successfully",
				);
			}
		}
	};

	const setupEventListeners = async () => {
		// Clean up existing listeners
		eventCleanups.forEach((cleanup) => {
			try {
				cleanup();
			} catch {}
		});
		eventCleanups = [];

		// Build started
		const buildStartedUnlisten = await tauriEvent?.listen(
			"dev:build_started",
			(event: any) => {
				const alias = event.payload;
				console.log("🔍 DEBUG: build_started event received for alias:", alias);
				addLogEntry("info", `🔨 Building ${alias}...`);
			},
		);
		if (buildStartedUnlisten) eventCleanups.push(buildStartedUnlisten);

		// Build completed
		const buildCompletedUnlisten = await tauriEvent?.listen(
			"dev:build_completed",
			async (event: any) => {
				const alias = event.payload;
				console.log(
					"🔍 DEBUG: build_completed event received for alias:",
					alias,
				);
				addLogEntry("success", `✅ Build completed for ${alias}`);
				console.log("🔍 DEBUG: About to call loadDevBundle");
				await loadDevBundle(alias);
			},
		);
		if (buildCompletedUnlisten) eventCleanups.push(buildCompletedUnlisten);

		// Build error
		const buildErrorUnlisten = await tauriEvent?.listen(
			"dev:build_error",
			(event: any) => {
				const [alias, error] = event.payload || [];
				console.log(
					"🔍 DEBUG: build_error event received for alias:",
					alias,
					"error:",
					error,
				);
				addLogEntry("error", `❌ Build failed for ${alias}:`);
				addLogEntry("error", String(error));
			},
		);
		if (buildErrorUnlisten) eventCleanups.push(buildErrorUnlisten);

		// Dev ready
		const readyUnlisten = await tauriEvent?.listen(
			"dev:ready",
			async (event: any) => {
				const alias = event.payload;
				console.log("🔍 DEBUG: dev:ready event received for alias:", alias);
				addLogEntry("info", `🚀 Dev mode ready for ${alias}`);
				console.log("🔍 DEBUG: About to call loadDevBundle from dev:ready");
				await loadDevBundle(alias);
			},
		);
		if (readyUnlisten) eventCleanups.push(readyUnlisten);

		// Build success (remount)
		const buildSuccessUnlisten = await tauriEvent?.listen(
			"dev:build_success",
			async (event: any) => {
				const alias = event.payload;
				console.log("🔍 DEBUG: build_success event received for alias:", alias);
				const currentState = devState();
				console.log("🔍 DEBUG: Current state:", currentState);
				if (currentState.isActive && currentState.currentAlias === alias) {
					console.log("🔍 DEBUG: Conditions met, remounting");
					addLogEntry("info", `♻️ Remount after build success for ${alias}`);
					await loadDevBundle(alias);
				} else {
					console.log("🔍 DEBUG: Conditions not met for remount");
				}
			},
		);
		if (buildSuccessUnlisten) eventCleanups.push(buildSuccessUnlisten);

		// Dev stopped
		const stoppedUnlisten = await tauriEvent?.listen(
			"dev:stopped",
			async () => {
				console.log("🔍 DEBUG: dev:stopped event received");
				await unmountCurrentRemote();
				setDevState((prev) => ({
					...prev,
					isActive: false,
					currentAlias: null,
				}));
			},
		);
		if (stoppedUnlisten) eventCleanups.push(stoppedUnlisten);
	};

	const startDevMode = async (alias: string) => {
		try {
			console.log("🔍 DEBUG: startDevMode called with alias:", alias);
			const currentState = devState();
			console.log("🔍 DEBUG: Current dev state:", currentState);

			if (currentState.isActive && currentState.currentAlias === alias) {
				console.log(
					"🔍 DEBUG: Dev mode already active for this alias, returning",
				);
				return;
			}

			if (currentState.isActive) {
				console.log("🔍 DEBUG: Stopping current dev mode first");
				await stopCurrentDevMode();
			}

			console.log("🔍 DEBUG: Setting up event listeners");
			await setupEventListeners();

			setDevState((prev) => ({
				isActive: true,
				currentAlias: alias,
				activeSessions: prev.activeSessions.includes(alias)
					? prev.activeSessions
					: [...prev.activeSessions, alias],
			}));

			addLogEntry("info", `🚀 Starting Vite dev server for "${alias}"...`);
			console.log("🔍 DEBUG: About to invoke start_dev with alias:", alias);
			await tauriCore?.invoke("start_dev", { alias });
			console.log("🔍 DEBUG: start_dev invoke completed");
		} catch (err) {
			console.error("🔍 DEBUG: Failed to start dev mode:", err);
			addLogEntry("error", `Failed to start dev mode: ${err}`);
			await stopCurrentDevMode();
		}
	};

	const stopCurrentDevMode = async () => {
		const currentState = devState();
		if (!currentState.isActive || !currentState.currentAlias) return;

		try {
			await tauriCore?.invoke("stop_dev");
			setDevState((prev) => ({
				isActive: false,
				currentAlias: null,
				activeSessions: prev.activeSessions.filter(
					(a) => a !== currentState.currentAlias,
				),
			}));
			addLogEntry(
				"info",
				`🛑 Stopped dev server for "${currentState.currentAlias}"`,
			);
		} catch (err) {
			console.error("Failed to stop dev mode:", err);
		} finally {
			// Clean up listeners
			eventCleanups.forEach((cleanup) => {
				try {
					cleanup();
				} catch {}
			});
			eventCleanups = [];

			await unmountCurrentRemote();
		}
	};

	// Notify parent of state changes
	createEffect(() => {
		props.onDevStateChange?.(devState());
	});

	// Expose handlers to parent immediately
	onMount(() => {
		const handlers = {
			startDevMode,
			stopDevMode: stopCurrentDevMode,
			getDevState: () => devState(),
		};
		props.onHandlersReady?.(handlers);

		// Also register globally immediately
		globalDevMode.startDevMode = handlers.startDevMode;
		globalDevMode.stopDevMode = handlers.stopDevMode;
		globalDevMode.getDevState = handlers.getDevState;
	});

	onCleanup(() => {
		eventCleanups.forEach((cleanup) => {
			try {
				cleanup();
			} catch {}
		});
		if (currentRemote.cleanup) {
			try {
				currentRemote.cleanup();
			} catch {}
		}
	});

	const getStatusEmoji = () => {
		const state = devState();
		if (!state.isActive) return "🔧";
		return "👁️";
	};

	const getStatusText = () => {
		const state = devState();
		if (!state.isActive) return "Inactive";
		return "Active";
	};

	const getStatusClass = () => {
		const state = devState();
		if (!state.isActive) return "bg-slate-800 text-slate-400 border-slate-600";
		return "bg-emerald-900 text-emerald-300 border-emerald-600";
	};

	return (
		<>
			<Show when={devState().isActive}>
				<div class="flex flex-col gap-2 p-2">
					{/* Dev Mode Indicator */}
					<div
						class={`flex items-center gap-2 px-3 py-2 rounded-md border-l-4 text-xs font-medium ${getStatusClass()}`}
					>
						<span>{getStatusEmoji()}</span>
						<span>
							Dev: {devState().currentAlias} ({getStatusText()})
						</span>
					</div>

					{/* View Toggle Buttons */}
					<div class="flex gap-2">
						<button
							type="button"
							onClick={() => setCurrentView("app")}
							class={`px-3 py-1 rounded text-sm font-medium transition-colors ${
								currentView() === "app"
									? "bg-blue-600 text-white"
									: "bg-slate-700 text-slate-300 hover:bg-slate-600"
							}`}
						>
							App
						</button>
						<button
							type="button"
							onClick={() => setCurrentView("logs")}
							class={`px-3 py-1 rounded text-sm font-medium transition-colors ${
								currentView() === "logs"
									? "bg-blue-600 text-white"
									: "bg-slate-700 text-slate-300 hover:bg-slate-600"
							}`}
						>
							Logs ({logs().length})
						</button>
					</div>

					{/* Content Area - App view shows mounted content in tugboats-slot */}
					<Show when={currentView() === "logs"}>
						<AppLogsPane logs={logs()} onClear={clearLogs} />
					</Show>
				</div>
			</Show>
		</>
	);
}

// Export the functions needed by other components
export function parseDevCommand(raw: string) {
	const s = (raw || "").trim();
	if (!s) return null;
	const match = s.match(/^([A-Za-z0-9._-]+):dev$/);
	if (match) {
		return { alias: match[1], command: "dev" as const };
	}
	return null;
}

// Global state management for backward compatibility
let globalDevMode: {
	startDevMode?: (alias: string) => Promise<void>;
	stopDevMode?: () => Promise<void>;
	getDevState?: () => DevState;
} = {};

export async function handleDevMode(raw: string) {
	const cmd = parseDevCommand(raw);
	if (cmd && globalDevMode.startDevMode) {
		await globalDevMode.startDevMode(cmd.alias);
	} else if (
		globalDevMode.getDevState?.().isActive &&
		globalDevMode.stopDevMode
	) {
		await globalDevMode.stopDevMode();
	}
}

export function getDevModeState(): DevState {
	return (
		globalDevMode.getDevState?.() || {
			isActive: false,
			currentAlias: null,
			activeSessions: [],
		}
	);
}

export function startDevModeForAlias(alias: string) {
	if (globalDevMode.startDevMode) {
		return globalDevMode.startDevMode(alias);
	} else {
		return Promise.resolve();
	}
}

export function stopDevMode() {
	return globalDevMode.stopDevMode?.() || Promise.resolve();
}

// Register global handlers - this should be called when the component mounts
export function registerGlobalDevMode(handlers: {
	startDevMode: (alias: string) => Promise<void>;
	stopDevMode: () => Promise<void>;
	getDevState: () => DevState;
}) {
	globalDevMode = handlers;
}
