import { render } from "npm:preact";
import { Suspense } from "npm:preact/compat";
import type { ComponentChildren } from "preact";

import { input } from "npm:@tugboats/core";

import { signal } from "@preact/signals";
import { MonacoCtxProvider } from "./common/Monaco.tsx";
import {
  AppPreferencesCtxProvider,
  PrefsEditor,
  useAliasMapCtx,
} from "./AppPreferences.tsx";
import { MountDevApp } from "./MountDevApp.tsx";
import { MountProdApp } from "./MountProdApp.tsx";
import { Frame } from "./design/Frame.tsx";

const theInput = signal("");
const theAlias = signal("");

const AppContexts = (props: { children: ComponentChildren }) => (
  <MonacoCtxProvider>
    <AppPreferencesCtxProvider>
      {props.children}
    </AppPreferencesCtxProvider>
  </MonacoCtxProvider>
);

function App() {
  const aliasMap = useAliasMapCtx();

  const aliasTag = (extractedAlias: string) => aliasMap[extractedAlias] ?? "";

  const onChange = (e) => {
    input.set(e.target.value);
    theInput.value = e.target.value;

    const extractedAlias = e.target.value.split(" ")[0];
    if (aliasTag(extractedAlias)) {
      theAlias.value = extractedAlias;
    } else {
      theAlias.value = "";
    }
  };

  return (
    <AppFrame>
      <div class="flex flex-col">
        <div class="flex-1"></div>
        <section class="flex-0">
          <Show when={aliasTag(theAlias.value) === "prefs"}>
            <PrefsEditor />
          </Show>

          <Show when={aliasTag(theAlias.value) === "secrets"}>
            <Secrets />
          </Show>

          <Show when={aliasTag(theAlias.value) === "app"}>
            <MountProdApp alias={theAlias.value} />
          </Show>

          <Show when={aliasTag(theAlias.value) === "clone"}>
            <MountDevApp alias={theAlias.value} />
          </Show>
        </section>

        <div className="w-full flex items-center flex-0">
          <form
            className="flex-1 flex border-r border-black/20 p-2"
            id="the-input-form"
          >
            <input
              id="the-input"
              className="flex-1 active:outline-none focus:outline-none"
              placeholder="..."
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              value={input.get().raw}
              onChange={onChange}
            />
            <button className="flex-0 justify-self-end" type="submit">
              Greet
            </button>
          </form>

          <div id="hints-slot" class="p-2">
            <span>hints</span>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

function AppFrame(props) {
  return (
    <div class="p-5">
      <div class="ring-5 ring-gray-600 rounded-md">
        <div class="shadow-md rounded-sm bg-white">
          {props.children}
        </div>
      </div>
    </div>
  );
}

function Show(props: { when: boolean; children: ComponentChildren }) {
  if (!props.when) return null;
  return <>{props.children}</>;
}

function Secrets() {
  return (
    <div>
      <h2>secrets</h2>
    </div>
  );
}

render(
  <Suspense fallback={<div>Loading...</div>}>
    <AppContexts>
      <App />
    </AppContexts>
  </Suspense>,
  document.getElementById("root"),
);
