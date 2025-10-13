// @ts-expect-error this is fine
import "./styles.css";

import { input } from "@tugboats/core";
import { createSignal, onMount, Show } from "solid-js";
import { AppDevMode, type DevState, registerGlobalDevMode } from "./AppDevMode";
import { AppInput, MountProdTugboatApp } from "./AppInput";
import { AppPreferences, prefsKV } from "./AppPreferences";

type AliasTags = "none" | "app" | "clone" | "prefs" | "secrets";

function App() {
	const [aliasTag, setAliasTag] = createSignal<AliasTags>("none");
	const [currentAlias, setCurrentAlias] = createSignal<string>("");

	const [allAliases, setAllAliases] = createSignal<Record<string, AliasTags>>({
		prefs: "prefs",
		preferences: "prefs",
		secrets: "secrets",
	});

	onMount(async () => {
		const stored = await prefsKV.get(["user"]);
		if (stored._tag === "Ok") {
			if (stored._type === "Item") {
				const prefs = stored.result.value as any;
				if (prefs && Array.isArray(prefs.apps)) {
					prefs.apps.forEach((app: any) => {
						setAllAliases((prev) => ({ ...prev, [app.alias]: "app" }));
					});
				}
				if (prefs && Array.isArray(prefs.clones)) {
					prefs.clones.forEach((clone: any) => {
						setAllAliases((prev) => ({ ...prev, [clone.alias]: "clone" }));
					});
				}
			}
		}
	});

	input.subscribe((val) => {
		console.log("all aliases", allAliases());
		const extractedAlias = val.raw.trim().split(" ")[0];

		if (!extractedAlias) {
			setAliasTag("none");
			setCurrentAlias("");
			return;
		}

		const tag = allAliases()[extractedAlias];
		if (tag) {
			setAliasTag(tag);
			setCurrentAlias(extractedAlias);
		} else {
			setAliasTag("none");
			setCurrentAlias("");
		}
	});

	let devModeHandlers: {
		startDevMode?: (alias: string) => Promise<void>;
		stopDevMode?: () => Promise<void>;
		getDevState?: () => DevState;
	} = {};

	const handleDevModeHandlers = (handlers: typeof devModeHandlers) => {
		devModeHandlers = handlers;
		// Re-register global handlers whenever they update
		registerGlobalDevMode({
			startDevMode: handlers.startDevMode || (() => Promise.resolve()),
			stopDevMode: handlers.stopDevMode || (() => Promise.resolve()),
			getDevState:
				handlers.getDevState ||
				(() => ({ isActive: false, currentAlias: null, activeSessions: [] })),
		});
	};

	onMount(() => {
		// Initial registration with empty handlers
		registerGlobalDevMode({
			startDevMode: () => Promise.resolve(),
			stopDevMode: () => Promise.resolve(),
			getDevState: () => ({
				isActive: false,
				currentAlias: null,
				activeSessions: [],
			}),
		});
	});

	return (
		<main class="w-full flex flex-col">
			{/* Input + actions */}
			<div class="w-full flex items-center bg-green-400 p-2 gap-2">
				<AppInput />
				<div id="hints-slot">
					<span>hints</span>
				</div>
			</div>

			{/* Response / greeting area (legacy id preserved if needed) */}
			<p id="greet-msg" class="p-2 text-sm text-slate-700"></p>

			{/* Dev mode progress area (kept by id for compatibility) */}
			<div
				id="clone-progress"
				style={{
					display: "none",
					background: "#1e293b",
					color: "#e2e8f0",
					padding: "12px",
					"border-radius": "6px",
					margin: "16px 0",
					"font-family": "monospace",
					"font-size": "12px",
					"max-height": "200px",
					"overflow-y": "auto",
				}}
			/>

			<Show when={aliasTag() === "prefs"}>
				<AppPreferences />
			</Show>

			<Show when={aliasTag() === "clone"}>
				<div>clone/devmode</div>
				<AppDevMode
					onDevStateChange={() => {}}
					onHandlersReady={handleDevModeHandlers}
				/>
			</Show>

			<Show when={aliasTag() === "app"}>
				<MountProdTugboatApp alias={currentAlias()} />
			</Show>

			<div id="tugboats-slot" class="p-2"></div>
			<div id="tugboats-slot-dev" class="p-2"></div>
		</main>
	);
}

export default App;
