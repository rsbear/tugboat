import { input, kvTable } from "@tugboats/core";
import { createSignal, onCleanup, onMount } from "solid-js";

console.log("core input", input);

interface TauriCore {
	invoke?: (command: string, args?: Record<string, any>) => Promise<any>;
}

interface TauriWindow extends Window {
	__TAURI__?: {
		core?: TauriCore;
	};
}

const { invoke } = (window as TauriWindow).__TAURI__?.core ?? {};

type Props = {
	onPreferencesVisibilityChange?: (show: boolean) => void;
};

export function AppInput(props: Props) {
	const [value, setValue] = createSignal("");
	const inputSubmissions = kvTable("InputSubmissions");

	async function greetSubmit(e: Event) {
		e.preventDefault();
		const raw = value();
		input.set(raw);
		try {
			const msg = await invoke?.("greet", { name: raw });
			const el = document.getElementById("greet-msg");
			if (el) el.textContent = String(msg ?? "");
			await inputSubmissions.set(["last"], raw);
		} catch (err) {
			console.error("greet failed", err);
		}
	}

	onMount(async () => {
		const unsub = input.subscribe(async (s) => {
			const raw = s.raw ?? "";

			// Preferences visibility trigger
			const norm = raw.trim().toLowerCase();
			props.onPreferencesVisibilityChange?.(
				norm === "prefs" || norm === "preferences",
			);
		});

		onCleanup(() => {
			try {
				unsub?.();
			} catch {}
		});
	});

	return (
		<form class="flex flex-1 gap-2" onSubmit={greetSubmit} id="the-input-form">
			<input
				id="the-input"
				type="text"
				class="flex-1"
				placeholder="..."
				autocomplete="off"
				autocapitalize="off"
				autocorrect="off"
				value={value()}
				onInput={(e) => {
					const v = e.currentTarget.value;
					setValue(v);
					input.set(v);
				}}
			/>
			<button type="submit" class="flex-0">
				Greet
			</button>
		</form>
	);
}

export function MountProdTugboatApp(props: { alias: string }) {
	let tugboatsSlot: HTMLElement | null = null;
	let currentMounted: { alias: string | null; cleanup: null | (() => void) } = {
		alias: null,
		cleanup: null,
	};

	async function mountTugboatForAlias(alias: string) {
		console.log("uhm hello", alias);
		if (!alias) return;
		console.log("uhm hello 2", alias);
		if (currentMounted.alias === alias) return;
		console.log("uhm hello 3", currentMounted);

		if (currentMounted.cleanup) {
			try {
				currentMounted.cleanup();
			} catch {}
		}
		currentMounted.cleanup = null;
		currentMounted.alias = null;
		if (tugboatsSlot) tugboatsSlot.innerHTML = "";

		try {
			const path = await invoke?.("latest_bundle_for_alias", { alias });
			const code = await invoke?.("read_text_file", { path });
			const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(String(code ?? ""))}`;
			const mod = await import(
				/* @vite-ignore */ /* webpackIgnore: true */ dataUrl
			);

			let cleanup: null | (() => void) = null;
			const slot = tugboatsSlot;
			if (!slot) return;
			if (mod && typeof mod.harborMount === "function") {
				mod.harborMount(slot);
				if (typeof mod.unmount === "function") {
					cleanup = () => {
						try {
							mod.unmount();
						} catch {}
					};
				}
			} else if (mod && typeof mod.tugboatReact === "function") {
				const res = mod.tugboatReact(slot);
				if (typeof res === "function") cleanup = res;
			} else if (mod && typeof mod.tugboatSvelte === "function") {
				const res = mod.tugboatSvelte(slot);
				if (typeof res === "function") cleanup = res;
			} else if (mod && typeof mod.default === "function") {
				const res = mod.default(slot);
				if (typeof res === "function") cleanup = res;
			}

			currentMounted = { alias, cleanup };
		} catch (err) {
			console.error("Failed to mount tugboat app for alias", alias, err);
		}
	}

	onMount(() => {
		tugboatsSlot = document.getElementById("tugboats-slot");
		mountTugboatForAlias(props.alias);
	});

	onCleanup(() => {
		if (currentMounted.cleanup) {
			try {
				currentMounted.cleanup();
			} catch {}
		}
	});

	return null;
}
