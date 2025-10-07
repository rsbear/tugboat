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
