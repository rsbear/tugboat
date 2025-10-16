# User preferences `git_protocol` and `github_url` documentation

## Future considerations and work planned for a later date
- We will support other git providers along side github.

---

### Explaining `git_protocol`
A precursor to cloning is defined by the users preferences - the property `git_protocol` determines the protocol used to clone a given `github_url`.

```toml
[tugboat]
git_protocol = "ssh" # or "https" https is the default
```

If `git_protocol` is 'ssh', we will parse and transform a `github_url` into the SSH format.

The rationale for this is that the SSH is the most common approach to Git auth, and for good reason. Don't think it needs an explanation.

### Explaining `github_url`

A `github_url` can have multiple parts within the functions of our system. Take the following URL for example:
`https://github.com/rsbear/deleteme/tree/main/mini-react-ts`

- Part 1: `https://github.com/rsbear/deleteme`. This the base URL and can be transformed into `git@github.com:rsbear/deleteme.git` for SSH.

- Part 2: `tree/main`. The branch, self explanatory.

- Part 3: `mini-react-ts`. The path in which a 'tugboat app' can be found.

### Tugboat apps in a github URL
- At most, a tugboat app path can be 1 level deep from repo root.
- A URL subpath is determines where the bundler needs to be ran for each of `preferences.apps`
- A URL subpath is determines where the 'dev mode' watches a `preferences.clones`
- Take note that `preferences.clones` are not necessarily 'tugboat apps'

### Various methods in which tugboat as a system handles URLs
1. cloning `preferences.clones`
```ts
await window.__TAURI__.core.invoke("clone_repo", {
  githubUrl: clone.github_url,
  dirPath: dirPath,
  gitProtocol: preferences.git_protocol,
});
```

2. bundling `preferences.apps` (because apps need to clone a repo in order to bundle)
```ts
const bundlePath = await window.__TAURI__.core.invoke("bundle_app", {
  appDir: repoRootDir, // Let bundler determine the correct subdirectory
  alias: bundleAlias,
  gitProtocol: preferences.git_protocol,
});
```

3. watching `preferences.clones` aka 'dev mode'
- We use the path declared in the clones' `github_url` to determine where the watcher should be run.


---


# Repository Cloning Feature - Testing Guide

This document explains how to test the new repository cloning feature in Tugboats.

## Overview

The repository cloning feature automatically clones Git repositories when preferences are saved. It supports both SSH and HTTPS URLs and respects the user's existing Git configuration.

## How to Test

### 1. Start the Application

```bash
cd tugboats/app
deno task tauri dev
```

### 2. Open Preferences

1. In the application input field, type `preferences` or `prefs`
2. Press Enter
3. The preferences editor will appear

### 3. Test Repository Cloning

The default preferences include example repositories that will be cloned:

```toml
clones = [
  {
    alias = "reactapp",
    github_url = "https://github.com/facebook/create-react-app",
    dir = "~/tugboat_apps",
  },
  {
    alias = "svelteapp",
    github_url = "https://github.com/sveltejs/template",
    dir = "~/tugboat_apps",
  },
]
```

### 4. Save Preferences and Watch Cloning

1. Click "Save Preferences" button
2. Watch the progress display that appears below the editor
3. Monitor real-time cloning progress with emojis and status updates

### 5. Verify Results

Check that repositories were cloned to the expected locations:

```bash
ls -la ~/tugboat_apps/
# Should show:
# create-react-app/
# template/
```

## Feature Details

### Supported URL Formats

- HTTPS: `https://github.com/user/repo`
- HTTPS with .git: `https://github.com/user/repo.git`
- HTTPS with path: `https://github.com/user/repo/tree/main/subfolder`
- SSH: `git@github.com:user/repo.git`

### Directory Resolution

- `~/tugboat_apps` → Creates repo subdirectory: `~/tugboat_apps/repo-name/`
- `~/custom/path` → Clones directly to: `~/custom/path/`
- Tilde (`~`) is automatically expanded to user's home directory

### Smart Behavior

- **Skip if exists**: If `.git` directory already exists, skip cloning
- **Sequential processing**: Clones repositories one at a time
- **Real-time feedback**: Shows git stdout/stderr in progress display
- **Error handling**: Graceful error reporting for network issues, auth problems, etc.

### Progress Indicators

- 🚀 Starting process
- 📋 Repository count
- 📂 Target directory info
- ✅ Success indicators
- ❌ Error messages
- ⚠️ Warnings for invalid entries

## Testing Different Scenarios

### Test Case 1: Fresh Clone
1. Delete `~/tugboat_apps` directory if it exists
2. Save preferences
3. Verify repositories are cloned fresh

### Test Case 2: Existing Repositories
1. Save preferences twice
2. Second run should skip existing repos with "✅ Repository already exists" message

### Test Case 3: Invalid URL
Add an invalid repository to test error handling:

```toml
[[clones]]
alias = "invalid"
github_url = "https://github.com/nonexistent/repository"
dir = "~/tugboat_apps"
```

### Test Case 4: Custom Directory
```toml
[[clones]]
alias = "custom"
github_url = "https://github.com/microsoft/vscode"
dir = "~/custom/location"
```

### Test Case 5: SSH URL (requires SSH keys)
```toml
[[clones]]
alias = "ssh-test"
github_url = "git@github.com:user/repo.git"
dir = "~/tugboat_apps"
```

## Backend Architecture

The cloning functionality is implemented with:

- **Rust Backend**: `clone_repo` Tauri command
- **Async Processing**: Non-blocking git operations
- **Event Streaming**: Real-time progress via Tauri events
- **Error Handling**: Comprehensive error reporting

## Frontend Integration

- **TOML Parsing**: Extracts `clones` array from preferences
- **Event Listening**: Receives progress updates from backend
- **UI Updates**: Real-time progress display with scrolling
- **Sequential Processing**: Handles multiple repositories in order

## Troubleshooting

### Git Not Found
Ensure Git is installed and available in PATH:
```bash
git --version
```

### Permission Issues
Check directory permissions for target locations:
```bash
ls -la ~/tugboat_apps/
```

### Network Issues
Test repository accessibility:
```bash
git ls-remote https://github.com/user/repo.git
```

### SSH Issues (for SSH URLs)
Verify SSH key setup:
```bash
ssh -T git@github.com
```
