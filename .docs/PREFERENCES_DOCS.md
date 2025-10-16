# Documentation for App Preferences (WIP)

Type `prefs` or `preferences` in the host input to configure the app.

```toml
[tugboat]
git_protocol = "ssh"
markdown_theme = ""
monaco_theme = "vs-dark"
tugboat_theme = "vs-darccc"

[[apps]]
alias = "re"
github_url = "https://github.com/rsbear/tugboat/tree/main/test_mini_react"

[[apps]]
alias = "sv"
github_url = "https://github.com/rsbear/deleteme/tree/main/mini-svelte-ts"

[[clones]]
alias = "reactapp"
dir = "~/goodtime/tug"
github_url = "https://github.com/rsbear/tugboat/tree/main/test_mini_react"

[[clones]]
alias = "svelteapp"
dir = "~/goodtime/tugg"
github_url = "https://github.com/rsbear/tugboat/tree/main/test_mini_svelte"
```

**tugboat** (base config)
- `git_protocol`: configures backend to use SSH or HTTPS for git clones
- `apps`: On save, bundles each tugboat app from the associated `github_url`
- `clones`: On save, clones repo from associated `github_url` to `dir`

**apps**
- `alias`: the input value in which you want to mount/render the app
- `github_url`: the github url of the repo to clone (clones to ~/.tugboats/tmp)

**clones**
- `alias`: the input value in which you want to mount/render the app
- `github_url`: the github url of the repo to clone
- `dir`: the directory to clone the repo to (clones to ~/.tugboats_apps by default)


---


_If you would like read more about cloning details, please see [./docs/CLONING.md](./docs/CLONING.md)_
