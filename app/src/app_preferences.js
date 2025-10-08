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
    harbor: {
      harbor_theme: "vs-dark",
      monaco_theme: "vs-dark",
      markdown_theme: "",
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
      {
        alias: "private",
        github_url: "git@github.com:rsbear/tugboat.git/tree/main/test_mini_react",
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
  
  // Dev mode info
  const devModeInfo = document.createElement("div");
  devModeInfo.style.marginTop = "8px";
  devModeInfo.style.fontSize = "12px";
  devModeInfo.style.color = "#64748b";
  devModeInfo.innerHTML = `
    <strong>Dev Mode:</strong> Type <code>alias:dev</code> to activate live development mode for any clone alias.
    <br>Example: <code>myapp:dev</code> will watch for changes and auto-rebuild.
  `;
  container.appendChild(devModeInfo);

  saveBtn.addEventListener("click", async () => {
    const tomlCode = editor.getValue();
    try {
      const parsed = toml.parse(tomlCode); // TOML → JSON
      await prefsKV.set(["user"], parsed);
      console.log("Preferences saved:", parsed);

      // Handle repository cloning for 'clones'
      if (parsed.clones && Array.isArray(parsed.clones)) {
        showProgressDiv();
        clearProgress();
        addProgressLine("🚀 Starting repository cloning process...");
        await handleRepositoryCloning(parsed.clones);
        addProgressLine("✅ Repository cloning process completed!");
      }

      // Also clone apps into ~/.tugboats/temp, trimming any subpaths in github_url
      if (parsed.apps && Array.isArray(parsed.apps)) {
        showProgressDiv();
        addProgressLine("\n🚀 Starting apps cloning into ~/.tugboats/temp ...");
        await handleAppsCloning(parsed.apps);
        addProgressLine("✅ Apps cloning completed!");
      }
    } catch (err) {
      console.error("Error parsing TOML:", err);
      addProgressLine(`❌ Error parsing TOML: ${err.message}`);
    }
  });

  hidePreferences();
}

async function handleRepositoryCloning(clones) {
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

async function handleAppsCloning(apps) {
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

      // Normalize to base repo URL (trim any subpath like /tree/main/...)
      const normalizedUrl = trimGithubUrlToRepo(app.github_url);
      const repoName = extractRepoNameFromUrl(normalizedUrl);

      // Determine first-level subdirectory (if any) from the original URL
      const { subdir, truncated } = parseGithubFirstSubdir(app.github_url);

      // Hardcode destination to ~/.tugboats/temp/<repoName>
      const repoRootDir = `~/.tugboats/temp/${repoName}`;
      const appDir = subdir ? `${repoRootDir}/${subdir}` : repoRootDir;

      addProgressLine(`\n[${i + 1}/${apps.length}] Processing app: ${repoName}`);
      if (subdir) addProgressLine(`📄 Subdirectory specified: ${subdir}`);
      if (truncated)
        addProgressLine(`⚠️ Nested path deeper than one level detected; using first-level \"${subdir}\" only.`);
      addProgressLine(`📂 Repo clone target: ${repoRootDir}`);
      addProgressLine(`📁 App directory (used for build): ${appDir}`);

      try {
        await window.__TAURI__.core.invoke("clone_repo", {
          githubUrl: normalizedUrl,
          dirPath: repoRootDir,
        });
        addProgressLine(`✅ Completed app clone: ${repoName}`);

        // After cloning, bundle the app using the resolved appDir and repoName as alias
        addProgressLine(`🛠️ Bundling app at ${appDir} ...`);
        const bundleAlias = app.alias || repoName;
        const bundlePath = await window.__TAURI__.core.invoke("bundle_app", {
          appDir: appDir,
          alias: bundleAlias,
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

function trimGithubUrlToRepo(url) {
  try {
    // Handle HTTPS URLs like https://github.com/user/repo/... -> https://github.com/user/repo
    const httpsMatch = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/?#]+)(?:[\/?#].*)?$/);
    if (httpsMatch) {
      const owner = httpsMatch[1];
      const repo = httpsMatch[2].replace(/\.git$/, "");
      return `https://github.com/${owner}/${repo}`;
    }

    // Handle SSH URLs like git@github.com:user/repo(.git)(/tree/branch/path...)
    const sshMatch = url.match(/^git@github\.com:([^\/]+)\/([^\/\s]+)(?:\/.*)?$/);
    if (sshMatch) {
      const owner = sshMatch[1];
      let repo = sshMatch[2];
      
      // Remove .git suffix if present, but ensure we add it back for consistency
      repo = repo.replace(/\.git$/, "");
      return `git@github.com:${owner}/${repo}.git`;
    }
  } catch (_) {
    // fall through
  }
  return url;
}

// Parse the first-level subdirectory (if any) from a GitHub URL of the form
// https://github.com/<owner>/<repo>/tree/<branch>/<subdir>(/ ...)
// or git@github.com:<owner>/<repo>.git/tree/<branch>/<subdir>(/ ...)
function parseGithubFirstSubdir(url) {
  try {
    // Handle HTTPS URLs
    const httpsMatch = url.match(/^https?:\/\/github\.com\/[^/]+\/[^/]+\/tree\/[^/]+\/(.+)$/);
    if (httpsMatch) {
      const rest = httpsMatch[1].replace(/\/+$/, "");
      if (!rest) return { subdir: "", truncated: false };
      const parts = rest.split("/");
      const first = parts[0];
      const truncated = parts.length > 1;
      return { subdir: first, truncated };
    }

    // Handle SSH URLs with tree notation like git@github.com:user/repo.git/tree/branch/subdir
    const sshMatch = url.match(/^git@github\.com:[^/]+\/[^/]+(?:\.git)?\/tree\/[^/]+\/(.+)$/);
    if (sshMatch) {
      const rest = sshMatch[1].replace(/\/+$/, "");
      if (!rest) return { subdir: "", truncated: false };
      const parts = rest.split("/");
      const first = parts[0];
      const truncated = parts.length > 1;
      return { subdir: first, truncated };
    }
  } catch (_) {
    // ignore
  }
  return { subdir: "", truncated: false };
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
