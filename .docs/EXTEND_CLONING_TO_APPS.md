Done. I extended the preferences save flow to also clone the repositories listed in the apps array, and added URL normalization so we trim any extra path segments beyond owner/repo before cloning. Apps are cloned to ~/.tugboats/temp/<repo-or-alias>.

What I changed
•  app/src/app_preferences.js
◦  On Save Preferences, after processing clones, it now:
▪  Normalizes each app’s github_url to the base repo (e.g., https://github.com/user/repo) by trimming any subpaths like /tree/main/... before cloning.
▪  Clones each app into ~/.tugboats/temp/<repo-or-alias>.
▪  Reuses the same progress event stream (tugboats://clone-progress) for logs.
◦  New helper: trimGithubUrlToRepo(url) to ensure apps’ URLs are suitable for git clone.
◦  New handler: handleAppsCloning(apps) which iterates apps, computes normalizedUrl + target dir, and invokes the existing clone_repo backend command.

Why this fixes the issue
•  Git cannot clone URLs that include subpaths like /tree/main/subdir. For apps, we now trim such URLs to https://github.com/<owner>/<repo> (or SSH equivalent) before cloning.
•  By passing a full target path ~/.tugboats/temp/<repo-or-alias>, we avoid ambiguity in where the repo is placed and keep app clones isolated from the general tugboat_apps directory.

How to test locally
•  Start the app. Either of:
◦  just dev
◦  cd app && deno task tauri dev
•  In the app input box, type prefs or preferences to open the editor.
•  Ensure your apps entries include URLs that have /tree/... paths, e.g.:
◦  https://github.com/rsbear/deleteme/tree/main/mini-svelte-ts
◦  https://github.com/rsbear/deleteme/tree/main/mini-react-ts
•  Click Save Preferences.
•  Watch the progress area for:
◦  “Starting apps cloning into ~/.tugboats/temp ...”
◦  Per-app logs and success messages.
•  Verify the clones on disk:
◦  ls -la ~/.tugboats/temp
◦  You should see folders matching the app alias or repo name.

Notes
•  I reused the existing backend command (clone_repo) and event stream, so all progress appears in the same UI.
•  For apps, the directory is hardcoded to ~/.tugboats/temp/<repo-or-alias>.
•  URL normalization is only applied to apps as requested; clones behavior remains unchanged.

If you want, I can also:
•  Update the docs to mention that apps are cloned into ~/.tugboats/temp and that app URLs can include subpaths (they’ll be normalized).
•  Add a small visual section separator in the progress log between the clones and the rest of the logs.
