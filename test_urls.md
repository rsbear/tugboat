# GitHub URL Test Cases

This document contains various GitHub URL formats to test the repository cloning functionality.

## Standard HTTPS URLs

### Basic Repository URLs
- `https://github.com/microsoft/vscode`
- `https://github.com/facebook/react`
- `https://github.com/torvalds/linux`

### URLs with .git suffix
- `https://github.com/microsoft/vscode.git`
- `https://github.com/facebook/react.git`
- `https://github.com/nodejs/node.git`

### URLs with branch/tree paths
- `https://github.com/microsoft/vscode/tree/main`
- `https://github.com/facebook/react/tree/main/packages/react`
- `https://github.com/sveltejs/kit/tree/master/packages/kit`

## SSH URLs

### Standard SSH format
- `git@github.com:microsoft/vscode.git`
- `git@github.com:facebook/react.git`
- `git@github.com:torvalds/linux.git`

## Test TOML Configuration

```toml
[harbor]
harbor_theme = "vs-dark"
monaco_theme = "vs-dark"
markdown_theme = ""

[[apps]]
alias = "vscode"
github_url = "https://github.com/microsoft/vscode"

[[apps]]
alias = "react"
github_url = "https://github.com/facebook/react"

[[clones]]
alias = "vscode-clone"
github_url = "https://github.com/microsoft/vscode"
dir = "~/tugboat_apps"

[[clones]]
alias = "react-clone"
github_url = "https://github.com/facebook/react.git"
dir = "~/tugboat_apps"

[[clones]]
alias = "svelte-template"
github_url = "https://github.com/sveltejs/template"
dir = "~/custom/svelte"

[[clones]]
alias = "node-ssh"
github_url = "git@github.com:nodejs/node.git"
dir = "~/tugboat_apps"

[[clones]]
alias = "branch-example"
github_url = "https://github.com/facebook/react/tree/main/packages/react"
dir = "~/tugboat_apps"
```

## Expected Behavior

### URL Parsing Results
- `https://github.com/microsoft/vscode` → repo name: `vscode`
- `https://github.com/facebook/react.git` → repo name: `react`
- `https://github.com/sveltejs/template/tree/main` → repo name: `template`
- `git@github.com:nodejs/node.git` → repo name: `node`

### Directory Creation
- `dir = "~/tugboat_apps"` → creates `~/tugboat_apps/repo-name/`
- `dir = "~/custom/path"` → clones directly to `~/custom/path/`
- Missing `dir` → defaults to `~/tugboat_apps/repo-name/`

## Test Scenarios

### 1. Fresh Clone Test
Delete target directories and run cloning to test fresh clones.

### 2. Duplicate Clone Test
Run cloning twice to verify "already exists" detection.

### 3. Mixed URL Types Test
Use both HTTPS and SSH URLs in same configuration.

### 4. Custom Directory Test
Test various directory path formats including nested paths.

### 5. Error Handling Test
```toml
[[clones]]
alias = "nonexistent"
github_url = "https://github.com/nonexistent/repository"
dir = "~/tugboat_apps"

[[clones]]
alias = "invalid-url"
github_url = "not-a-valid-url"
dir = "~/tugboat_apps"
```

### 6. Permission Test
```toml
[[clones]]
alias = "permission-test"
github_url = "https://github.com/microsoft/vscode"
dir = "/root/no-permission"
```
