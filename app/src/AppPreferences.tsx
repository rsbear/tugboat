import { kvTable } from "npm:@tugboats/core";
import { Editor, useEditor, useEditorValue, useMonacoCtx } from "./lib.tsx";
import { signal } from "@preact/signals";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/compat";
import { ComponentChildren } from "preact";
import * as toml from "npm:smol-toml";

// -- Alias Map used for controlling rendering

type AliasTags = "prefs" | "secrets" | "app" | "clone";
type AliasMap = Record<string, AliasTags>;

const defaultAliasMap = {
  prefs: "prefs",
  secrets: "secrets",
} satisfies AliasMap;

// -- User preferences state, data, ui, stuff

const prefsKv = kvTable("preferences");

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

export function PrefsEditor() {
  const { appPrefs, setPrefs, loadPrefsFromKv } = useContext(PrefsCtx);
  const editorValue = useEditorValue(toml.stringify(appPrefs), "toml");

  const handleSavePrefs = async () => {
    const rawText = editorValue.getValue();
    try {
      const parsed = toml.parse(rawText);
      await prefsKv.set(["user"], parsed);
      setPrefs(parsed);
      await loadPrefsFromKv();
    } catch (err) {
      console.error("❌ Invalid TOML", err);
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex justify-between items-center">
        <h3>Preferences</h3>
        <button type="button" onClick={handleSavePrefs}>
          Save
        </button>
      </div>
      <Editor value={editorValue} />
    </div>
  );
}
