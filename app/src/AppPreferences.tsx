import { kv } from "npm:@tugboats/core@0.0.15";
import type { ComponentChildren } from "preact";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/compat";
import { Editor, useEditorValue } from "./common/Monaco.tsx";
import * as toml from "npm:smol-toml";
import { btn } from "./design/buttons.ts";
import { content } from "./design/content.ts";
import { title } from "./design/text.ts";

// -- Alias Map used for controlling rendering

type AliasTags = "prefs" | "secrets" | "app" | "clone";
type AliasMap = Record<string, AliasTags>;

const defaultAliasMap = {
  prefs: "prefs",
  secrets: "secrets",
} satisfies AliasMap;

// -- User preferences state, data, ui, stuff

const prefsKv = kv("preferences");

const defaultPrefs = {
  tugboat: {
    git_protocol: "ssh" as string,
    tugboat_theme: "vs-dark" as string,
    monaco_theme: "vs-dark" as string,
  },
  apps: [
    {
      alias: "re",
      github_url: "https://github.com/rsbear/tugboat/tree/main/test_mini_react",
    },
    {
      alias: "sv",
      github_url: "https://github.com/rsbear/tugboat/tree/main/test_mini_sv",
    },
  ],
  clones: [
    {
      alias: "reactapp",
      github_url: "https://github.com/rsbear/tugboat/tree/main/test_mini_react",
    },
    {
      alias: "svelteapp",
      github_url: "https://github.com/rsbear/tugboat/tree/main/test_mini_sv",
    },
  ],
} as const;

type Preferences = typeof defaultPrefs;

const PrefsCtx = createContext<{
  appPrefs: Preferences;
  aliasMap: AliasMap;
  setPrefs: (prefs: Preferences) => void;
  loadPrefsFromKv: () => Promise<void>;
}>({
  appPrefs: defaultPrefs,
  aliasMap: defaultAliasMap,
  setPrefs: () => {},
  loadPrefsFromKv: async () => await Promise.resolve(),
});

export const useAliasMapCtx = () => {
  const { aliasMap } = useContext(PrefsCtx);
  if (!aliasMap) throw new Error("no alias map");
  return aliasMap;
};

export function AppPreferencesCtxProvider(
  props: { children: ComponentChildren },
) {
  const [appPrefs, setPrefs] = useState<Preferences>(defaultPrefs);

  const loadPrefsFromKv = async () => {
    const res = await prefsKv.get(["user"]);
    if (res._tag !== "Ok") return;
    if (res._type !== "Item") return;
    // @ts-ignore - TODO should prob impl a type for prefs
    setPrefs(res.result.value);
  };

  useEffect(() => {
    loadPrefsFromKv().then(() => {});
  }, []);

  const aliasMap = useMemo(() => {
    let mapped = defaultAliasMap as AliasMap;

    // @ts-ignore - TODO should prob impl a type for prefs
    appPrefs?.apps.forEach((app) => {
      mapped = { ...mapped, [app.alias]: "app" };
    });
    // @ts-ignore - TODO should prob impl a type for prefs
    appPrefs?.clones.forEach((clone) => {
      mapped = { ...mapped, [clone.alias]: "clone" };
    });

    return mapped;
  }, [appPrefs]);

  return (
    <PrefsCtx.Provider
      value={{ appPrefs, aliasMap, setPrefs, loadPrefsFromKv }}
    >
      {props.children}
    </PrefsCtx.Provider>
  );
}

// Helper functions for cloning
let addLog: ((message: string) => void) | null = null;

export function setLogCallback(callback: (message: string) => void) {
  addLog = callback;
}

async function handleRepositoryCloning(clones: any[], gitProtocol: string) {
  const unlisten = await window.__TAURI__.event.listen(
    "tugboats://clone-progress",
    (event: any) => {
      addLog?.(`Clone progress: ${event.payload}`);
      console.log("Clone progress:", event.payload);
    },
  );

  try {
    addLog?.(`Found ${clones.length} repositories to process`);
    console.log(`Found ${clones.length} repositories to process`);

    for (let i = 0; i < clones.length; i++) {
      const clone = clones[i];

      if (!clone.github_url) {
        addLog?.(`⚠️ Skipping entry ${i + 1}: missing github_url`);
        console.warn(`Skipping entry ${i + 1}: missing github_url`, clone);
        continue;
      }

      const dirPath = clone.dir || "~/tugboat_apps";
      const repoName = clone.alias || extractRepoNameFromUrl(clone.github_url);

      addLog?.(`[${i + 1}/${clones.length}] Processing: ${repoName}`);
      addLog?.(`Target directory: ${dirPath}`);
      console.log(`[${i + 1}/${clones.length}] Processing: ${repoName}`);
      console.log(`Target directory: ${dirPath}`);

      try {
        await window.__TAURI__.core.invoke("clone_repo", {
          githubUrl: clone.github_url,
          dirPath: dirPath,
          gitProtocol: gitProtocol || "https",
        });
        addLog?.(`✅ Completed: ${repoName}`);
        console.log(`Completed: ${repoName}`);
      } catch (error) {
        addLog?.(`❌ Failed to clone ${repoName}: ${error}`);
        console.error(`Failed to clone ${repoName}:`, error);
      }
    }
  } finally {
    unlisten();
  }
}

async function handleAppsCloning(apps: any[], gitProtocol: string) {
  const unlisten = await window.__TAURI__.event.listen(
    "tugboats://clone-progress",
    (event: any) => {
      addLog?.(`Apps clone progress: ${event.payload}`);
      console.log("Apps clone progress:", event.payload);
    },
  );

  try {
    addLog?.(`Found ${apps.length} apps to process`);
    console.log(`Found ${apps.length} apps to process`);

    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];

      if (!app.github_url) {
        addLog?.(`⚠️ Skipping app ${i + 1}: missing github_url`);
        console.warn(`Skipping app ${i + 1}: missing github_url`, app);
        continue;
      }

      let parsedInfo;
      try {
        parsedInfo = await window.__TAURI__.core.invoke("parse_github_url", {
          githubUrl: app.github_url,
        });
      } catch (e) {
        addLog?.(`Failed to parse app URL: ${e}`);
        console.log(`Failed to parse app URL:`, e);
        continue;
      }
      const repoName = parsedInfo.repo;
      const repoRootDir = `~/.tugboats/tmp/${repoName}`;

      addLog?.(`[${i + 1}/${apps.length}] Processing app: ${repoName}`);
      addLog?.(`Repo clone target: ${repoRootDir}`);
      console.log(`[${i + 1}/${apps.length}] Processing app: ${repoName}`);
      console.log(`Repo clone target: ${repoRootDir}`);

      try {
        await window.__TAURI__.core.invoke("clone_app", {
          githubUrl: app.github_url,
          gitProtocol: gitProtocol || "https",
        });
        addLog?.(`✅ Completed app clone: ${repoName}`);
        console.log(`Completed app clone: ${repoName}`);

        addLog?.(`📦 Bundling app at ${repoRootDir} ...`);
        console.log(` Bundling app at ${repoRootDir} ...`);
        const bundleAlias = app.alias || repoName;
        const bundlePath = await window.__TAURI__.core.invoke("bundle_app", {
          appDir: repoRootDir,
          alias: bundleAlias,
          githubUrl: app.github_url,
        });
        addLog?.(`✅ Bundle ready: ${bundlePath}`);
        console.log(`Bundle ready: ${bundlePath}`);
      } catch (error) {
        addLog?.(`❌ Failed to process app ${repoName}: ${error}`);
        console.error(`Failed to process app ${repoName}:`, error);
      }
    }
  } finally {
    unlisten();
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

export function PrefsEditor() {
  const { appPrefs, setPrefs, loadPrefsFromKv } = useContext(PrefsCtx);
  const editorValue = useEditorValue(toml.stringify(appPrefs), "toml");
  const [currentView, setCurrentView] = useState("editor");
  const [logs, setLogs] = useState<string[]>([]);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Capture console logs
  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message]);
  };

  const handleSavePrefs = async () => {
    setLogs([]); // Clear previous logs
    const rawText = editorValue.getValue();
    try {
      const parsed = toml.parse(rawText);
      await prefsKv.set(["user"], parsed);
      setPrefs(parsed);
      await loadPrefsFromKv();

      // Get git protocol from prefs (fallback to https)
      const gitProtocol = parsed?.tugboat?.git_protocol || "https";

      // Handle repository cloning for 'clones'
      if (parsed.clones && Array.isArray(parsed.clones)) {
        addLog("🚀 Starting repository cloning process...");
        console.log("🚀 Starting repository cloning process...");
        await handleRepositoryCloning(parsed.clones, gitProtocol);
        addLog("✅ Repository cloning process completed!");
        console.log("✅ Repository cloning process completed!");
      }

      // Clone apps into ~/.tugboat/tmp
      if (parsed.apps && Array.isArray(parsed.apps)) {
        addLog("🚀 Starting apps cloning into ~/.tugboats/tmp ...");
        console.log("🚀 Starting apps cloning into ~/.tugboats/tmp ...");
        await handleAppsCloning(parsed.apps, gitProtocol);
        addLog("✅ Apps cloning completed!");
        console.log("✅ Apps cloning completed!");
      }
      setShowSaveButton(true);
    } catch (err) {
      addLog(`❌ Invalid TOML: ${err}`);
      console.error("❌ Invalid TOML", err);
      setShowSaveButton(true);
    }
  };

  // Keyboard event listener for Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSavePrefs();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editorValue]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (currentView === "logs" && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, currentView]);

  // Set the log callback
  useEffect(() => {
    setLogCallback(addLog);
    return () => setLogCallback(() => {});
  }, []);

  return (
    <div class="flex flex-col gap-2">
      <div class={content({ y: "3" })}>
        <div class="flex justify-between items-center">
          <h2 class={title({ uppercase: true })}>Preferences</h2>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 text-xs opacity-70 font-mono">
              <KeyIcon char="⌘" />
              <KeyIcon char="S" />
              <span>SAVE</span>
            </div>
            {showSaveButton && (
              <button
                class={btn({ type: "sm" })}
                type="button"
                onClick={() =>
                  setCurrentView(currentView === "editor" ? "logs" : "editor")}
              >
                {currentView === "editor" ? "view logs" : "show editor"}
              </button>
            )}
          </div>
        </div>
      </div>
      <div class={content({ frame: true })}>
        {currentView === "editor"
          ? <Editor value={editorValue} />
          : (
            <div class="px-3 py-2 h-96 overflow-y-auto font-mono text-xs">
              {logs.length === 0
                ? (
                  <div class="text-gray-500">
                    No logs yet. Save preferences to see output.
                  </div>
                )
                : (
                  <>
                    {logs.map((log, i) => (
                      <div key={i} class="py-1 whitespace-pre-wrap">{log}</div>
                    ))}
                    <div ref={logsEndRef} />
                  </>
                )}
            </div>
          )}
      </div>
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
