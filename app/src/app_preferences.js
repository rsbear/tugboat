import { init } from "modern-monaco";
import * as toml from "smol-toml";
import { kvTable } from "@tugboats/core";

// Example URLs (replace with real constants if defined elsewhere)
const app_repo_url_svelte =
  "https://github.com/rsbear/deleteme/tree/main/mini-svelte-ts";
const app_repo_url_react =
  "https://github.com/rsbear/deleteme/tree/main/mini-react-ts";

let monaco;
let editor;
let container;
let saveBtn;

const prefsKV = kvTable("preferences");

function getDefaultToml() {
  return toml.stringify({
    tugboat: {
      tugboat_theme: "vs-dark",
      monaco_theme: "vs-dark",
      markdown_theme: "",
      git_protocol: "ssh", // "https" or "ssh" - controls how GitHub URLs are handled
    },
    apps: [
      {
        alias: "ws",
        github_url: app_repo_url_react,
      },
      {
        alias: "no",
        github_url: app_repo_url_svelte,
      },
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
  if (stored._tag === "Ok") {
    try {
      // stored is JSON → back to TOML string for editor
      return toml.stringify(stored.result.value);
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

async function initPreferences() {
  if (monaco) return;

  monaco = await init();

  container = document.querySelector(".editor-container");
  const editorNode = document.getElementById("editor");

  const initialValue = await loadInitialPrefs();

  editor = monaco.editor.create(editorNode);
  editor.setModel(
    monaco.editor.createModel(initialValue, "toml"),
  );

  // Save button
  saveBtn = document.createElement("button");
  saveBtn.textContent = "Save Preferences";
  saveBtn.style.marginTop = "8px";
  container.appendChild(saveBtn);

  // Configuration info
  const configInfo = document.createElement("div");
  configInfo.style.marginTop = "8px";
  configInfo.style.fontSize = "12px";
  configInfo.style.color = "#64748b";
  configInfo.innerHTML = `
    <strong>Git Protocol:</strong> Set <code>git_protocol = "ssh"</code> to automatically transform HTTPS URLs to SSH for cloning.
    <br>Only use HTTPS URLs in your configuration - they'll be converted to SSH if needed.
    <br><br>
    <strong>Dev Mode:</strong> Type <code>alias:dev</code> to activate live development mode for any clone alias.
    <br>Example: <code>myapp:dev</code> will watch for changes and auto-rebuild.
  `;
  container.appendChild(configInfo);

  saveBtn.addEventListener("click", async () => {
    const tomlCode = editor.getValue();
    try {
      const parsed = toml.parse(tomlCode); // TOML → JSON
      await prefsKV.set(["user"], parsed);
      console.log("Preferences saved:", parsed);

      // Determine git protocol from preferences (fallback to https)
      const gitProtocol = (parsed?.tugboat?.git_protocol || "https");

      // Handle repository cloning for 'clones'
      if (parsed.clones && Array.isArray(parsed.clones)) {
        showProgressDiv();
        clearProgress();
        addProgressLine("🚀 Starting repository cloning process...");
        await handleRepositoryCloning(parsed.clones, gitProtocol);
        addProgressLine("✅ Repository cloning process completed!");
      }

      // Also clone apps into ~/.tugboat/tmp, trimming any subpaths in github_url
      if (parsed.apps && Array.isArray(parsed.apps)) {
        showProgressDiv();
        addProgressLine("\n🚀 Starting apps cloning into ~/.tugboat/tmp ...");
        await handleAppsCloning(parsed.apps, gitProtocol);
        addProgressLine("✅ Apps cloning completed!");
      }
    } catch (err) {
      console.error("Error parsing TOML:", err);
      addProgressLine(`❌ Error parsing TOML: ${err.message}`);
    }
  });

  hidePreferences();
}

async function handleRepositoryCloning(clones, gitProtocol) {
  // Listen for cloning progress events
  const unlisten = await window.__TAURI__.event.listen(
    "tugboats://clone-progress",
    (event) => {
      console.log("Clone progress:", event.payload);
      addProgressLine(event.payload);
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
      const repoName = clone.alias || extractRepoNameFromUrl(clone.github_url);

      addProgressLine(`\n[${i + 1}/${clones.length}] Processing: ${repoName}`);
      addProgressLine(`📂 Target directory: ${dirPath}`);

      try {
        await window.__TAURI__.core.invoke("clone_repo", {
          githubUrl: clone.github_url,
          dirPath: dirPath,
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
    // Clean up event listener
    unlisten();
  }
}

async function handleAppsCloning(apps, gitProtocol) {
  // Listen for cloning progress events for apps as well
  const unlisten = await window.__TAURI__.event.listen(
    "tugboats://clone-progress",
    (event) => {
      console.log("Apps clone progress:", event.payload);
      addProgressLine(event.payload);
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

      // Parse with backend parser to normalize repo name and subpath consistently
      let parsedInfo;
      try {
        parsedInfo = await window.__TAURI__.core.invoke("parse_github_url", {
          githubUrl: app.github_url,
        });
      } catch (e) {
        addProgressLine(`❌ Failed to parse app URL: ${e}`);
        continue;
      }
      const repoName = parsedInfo.repo;

      // Destination is always ~/.tugboat/tmp/<repoName>
      const repoRootDir = `~/.tugboat/tmp/${repoName}`;

      addProgressLine(
        `\n[${i + 1}/${apps.length}] Processing app: ${repoName}`,
      );
      addProgressLine(`📂 Repo clone target: ${repoRootDir}`);

      try {
        await window.__TAURI__.core.invoke("clone_app", {
          githubUrl: app.github_url,
          gitProtocol: gitProtocol || "https",
        });
        addProgressLine(`✅ Completed app clone: ${repoName}`);

        // After cloning, bundle the app - backend will determine correct app directory
        addProgressLine(`🛠️ Bundling app at ${repoRootDir} ...`);
        const bundleAlias = app.alias || repoName;
        const bundlePath = await window.__TAURI__.core.invoke("bundle_app", {
          appDir: repoRootDir, // Backend will use githubUrl subpath to select correct subdirectory
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
    unlisten();
  }
}

function extractRepoNameFromUrl(url) {
  try {
    const match = url.match(/github\.com[/:]([\w-]+)\/([\w.-]+)/);
    return match ? match[2].replace(".git", "") : url;
  } catch {
    return url;
  }
}

function showProgressDiv() {
  const progressDiv = document.getElementById("clone-progress");
  if (progressDiv) {
    progressDiv.style.display = "block";
  }
}

function clearProgress() {
  const progressDiv = document.getElementById("clone-progress");
  if (progressDiv) {
    progressDiv.innerHTML = "";
  }
}

function addProgressLine(message) {
  const progressDiv = document.getElementById("clone-progress");
  if (progressDiv) {
    const line = document.createElement("div");
    line.textContent = message;
    line.style.marginBottom = "2px";
    progressDiv.appendChild(line);
    progressDiv.scrollTop = progressDiv.scrollHeight;
  }
}

export async function handlePreferencesTrigger(value) {
  await initPreferences();
  if (!value) return;

  const norm = value.trim().toLowerCase();
  if (norm === "prefs" || norm === "preferences") {
    showPreferences();
  } else {
    hidePreferences();
  }
}

function showPreferences() {
  if (container) container.style.display = "block";
}

function hidePreferences() {
  if (container) container.style.display = "none";
}
