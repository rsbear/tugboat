// const { invoke } = (window as any).__TAURI__?.core ?? {};
const tauriEvent = (window as any).__TAURI__?.event;

import { invoke } from "@tauri-apps/api/core";
import { kvTable } from "@tugboats/core";
import { init } from "modern-monaco";
import * as toml from "smol-toml";
import { createSignal, onCleanup, onMount } from "solid-js";

export const prefsKV = kvTable("preferences");

export function AppPreferences() {
	let containerRef: HTMLDivElement | undefined;
	let editorRef: HTMLDivElement | undefined;
	let saveBtnRef: HTMLButtonElement | undefined;

	let monaco: any;
	let editor: any;
	let unlistenProgress: null | (() => void) = null;

	const app_repo_url_svelte =
		"https://github.com/rsbear/deleteme/tree/main/mini-svelte-ts";
	const app_repo_url_react =
		"https://github.com/rsbear/deleteme/tree/main/mini-react-ts";

	function getDefaultToml() {
		return toml.stringify({
			tugboat: {
				tugboat_theme: "vs-dark",
				monaco_theme: "vs-dark",
				markdown_theme: "",
				git_protocol: "ssh",
			},
			apps: [
				{ alias: "ws", github_url: app_repo_url_react },
				{ alias: "no", github_url: app_repo_url_svelte },
			],
			clones: [
				{
					alias: "reactapp",
					github_url: app_repo_url_react,
					dir: "~/tugboat_apps",
				},
				{
					alias: "svelteapp",
					github_url: app_repo_url_svelte,
					dir: "~/tugboat_apps",
				},
			],
		});
	}

	async function loadInitialPrefs() {
		const stored = await prefsKV.get(["user"]);
		if ((stored as any)._tag === "Ok") {
			try {
				return toml.stringify((stored as any).result.value);
			} catch (err) {
				console.error(
					"Error stringifying stored prefs, falling back to default:",
					err,
				);
				return getDefaultToml();
			}
		}
		return getDefaultToml();
	}

	function showProgressDiv() {
		const progressDiv = document.getElementById("clone-progress");
		if (progressDiv) progressDiv.style.display = "block";
	}
	function clearProgress() {
		const progressDiv = document.getElementById("clone-progress");
		if (progressDiv) progressDiv.innerHTML = "";
	}
	function addProgressLine(message: string) {
		const progressDiv = document.getElementById("clone-progress");
		if (progressDiv) {
			const line = document.createElement("div");
			line.textContent = message;
			(line.style as any).marginBottom = "2px";
			progressDiv.appendChild(line);
			(progressDiv as any).scrollTop = (progressDiv as any).scrollHeight;
		}
	}

	async function handleRepositoryCloning(clones: any[], gitProtocol: string) {
		if (unlistenProgress) {
			try {
				unlistenProgress();
			} catch {}
			unlistenProgress = null;
		}
		unlistenProgress = await tauriEvent?.listen(
			"tugboats://clone-progress",
			(event: any) => {
				console.log("Clone progress:", event.payload);
				addProgressLine(String(event.payload));
			},
		);

		try {
			addProgressLine(`📋 Found ${clones.length} repositories to process`);
			for (let i = 0; i < clones.length; i++) {
				const clone = clones[i];
				if (!clone.github_url) {
					const warning = `⚠️ Skipping entry ${i + 1}: missing github_url`;
					console.warn(warning, clone);
					addProgressLine(warning);
					continue;
				}
				const dirPath = clone.dir || "~/tugboat_apps";
				const repoName =
					clone.alias || extractRepoNameFromUrl(clone.github_url);
				addProgressLine(
					`\n[${i + 1}/${clones.length}] Processing: ${repoName}`,
				);
				addProgressLine(`📂 Target directory: ${dirPath}`);
				try {
					await invoke?.("clone_repo", {
						githubUrl: clone.github_url,
						dirPath,
						gitProtocol: gitProtocol || "https",
					});
					addProgressLine(`✅ Completed: ${repoName}`);
				} catch (error) {
					const errorMsg = `❌ Failed to clone ${repoName}: ${error}`;
					console.error(errorMsg);
					addProgressLine(errorMsg);
				}
			}
		} finally {
			try {
				unlistenProgress?.();
			} catch {}
			unlistenProgress = null;
		}
	}

	async function handleAppsCloning(apps: any[], gitProtocol: string) {
		if (unlistenProgress) {
			try {
				unlistenProgress();
			} catch {}
			unlistenProgress = null;
		}
		unlistenProgress = await tauriEvent?.listen(
			"tugboats://clone-progress",
			(event: any) => {
				console.log("Apps clone progress:", event.payload);
				addProgressLine(String(event.payload));
			},
		);

		try {
			addProgressLine(`📋 Found ${apps.length} apps to process`);
			for (let i = 0; i < apps.length; i++) {
				const app = apps[i];
				if (!app.github_url) {
					const warning = `⚠️ Skipping app ${i + 1}: missing github_url`;
					console.warn(warning, app);
					addProgressLine(warning);
					continue;
				}

				let parsedInfo: any;
				try {
					parsedInfo = await invoke?.("parse_github_url", {
						githubUrl: app.github_url,
					});
				} catch (e) {
					addProgressLine(`❌ Failed to parse app URL: ${e}`);
					continue;
				}
				const repoName = parsedInfo.repo;
				const repoRootDir = `~/.tugboats/tmp/${repoName}`;

				addProgressLine(
					`\n[${i + 1}/${apps.length}] Processing app: ${repoName}`,
				);
				addProgressLine(`📂 Repo clone target: ${repoRootDir}`);

				try {
					await invoke?.("clone_app", {
						githubUrl: app.github_url,
						gitProtocol: gitProtocol || "https",
					});
					addProgressLine(`✅ Completed app clone: ${repoName}`);

					addProgressLine(`🛠️ Bundling app at ${repoRootDir} ...`);
					const bundleAlias = app.alias || repoName;
					const bundlePath = await invoke?.("bundle_app", {
						appDir: repoRootDir,
						alias: bundleAlias,
						githubUrl: app.github_url,
					});
					addProgressLine(`📦 Bundle ready: ${bundlePath}`);
				} catch (error) {
					const errorMsg = `❌ Failed to process app ${repoName}: ${error}`;
					console.error(errorMsg);
					addProgressLine(errorMsg);
				}
			}
		} finally {
			try {
				unlistenProgress?.();
			} catch {}
			unlistenProgress = null;
		}
	}

	function extractRepoNameFromUrl(url: string) {
		try {
			const match = url.match(/github\.com[/:]([\w-]+)\/([\w.-]+)/);
			return match ? match[2].replace(".git", "") : url;
		} catch {
			return url;
		}
	}

	onMount(async () => {
		monaco = await init();
		const initialValue = await loadInitialPrefs();

		if (editorRef) {
			editor = monaco.editor.create(editorRef);
			editor.setModel(monaco.editor.createModel(initialValue, "toml"));
		}
	});

	onCleanup(() => {
		try {
			unlistenProgress?.();
		} catch {}
		unlistenProgress = null;
		try {
			editor?.dispose?.();
		} catch {}
	});

	async function onSave() {
		if (!editor) return;
		const tomlCode = editor.getValue();
		try {
			const parsed = toml.parse(tomlCode);
			await prefsKV.set(["user"], parsed);
			console.log("Preferences saved:", parsed);
			const gitProtocol = (parsed as any)?.tugboat?.git_protocol || "https";

			if (parsed.clones && Array.isArray(parsed.clones)) {
				showProgressDiv();
				clearProgress();
				addProgressLine("🚀 Starting repository cloning process...");
				await handleRepositoryCloning(parsed.clones, gitProtocol);
				addProgressLine("✅ Repository cloning process completed!");
			}

			if (parsed.apps && Array.isArray(parsed.apps)) {
				showProgressDiv();
				addProgressLine("\n🚀 Starting apps cloning into ~/.tugboats/tmp ...");
				await handleAppsCloning(parsed.apps, gitProtocol);
				addProgressLine("✅ Apps cloning completed!");
			}
		} catch (err: any) {
			console.error("Error parsing TOML:", err);
			addProgressLine(`❌ Error parsing TOML: ${err?.message ?? String(err)}`);
		}
	}

	return (
		<div class="flex flex-col gap-2 p-2">
			<div class="editor-container" ref={containerRef}>
				<div
					id="editor"
					ref={editorRef}
					style={{ width: "100%", height: "400px", border: "1px solid #ccc" }}
				/>
			</div>
			<div class="flex items-center gap-2">
				<button
					type="button"
					ref={saveBtnRef}
					onClick={onSave}
					class="px-3 py-1 rounded bg-slate-700 text-slate-100"
				>
					Save Preferences
				</button>
				<div class="text-xs text-slate-500">
					<strong>Git Protocol: </strong>
					Set <code>git_protocol = "ssh"</code> to automatically transform HTTPS
					URLs to SSH for cloning. Only use HTTPS URLs in your configuration —
					they'll be converted to SSH if needed.
					<br />
					<strong>Dev Mode: </strong>
					Type <code>alias:dev</code> to activate live development mode for any
					clone alias (e.g., <code>myapp:dev</code>).
				</div>
			</div>
		</div>
	);
}
