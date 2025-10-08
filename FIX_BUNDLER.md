# In preferences

Expectation, our system uses the path specified in the github_url in order to determine where to run the bundler.
Part of the purpose of git_url_parser.rs is to extract the path
Again, at most tugboat apps are 1 level deep in a repo.

On save is producing this error in our webview console:



```
[Log] Clone progress: – "✅ Repository already exists at: /Users/rs/goodtime/heyminireact" (app_preferences.js, line 143)
[Log] Clone progress: – "✅ Repository already exists at: /Users/rs/goodtime/heyminisvelte" (app_preferences.js, line 143)
[Log] Apps clone progress: – "✅ Repository already exists at: /Users/rs/.tugboat/tmp/deleteme" (app_preferences.js, line 191)
[Log] Apps clone progress: – "🚧 Preparing to bundle app 're' in /Users/rs/.tugboat/tmp/deleteme" (app_preferences.js, line 191)
[Error] ❌ Failed to process app deleteme: Multiple package.json files found one-level nested; please specify the subdirectory
	(anonymous function) (app_preferences.js:246)
```


```bash
cd ~/.tugboat
.
└── tmp
    └── deleteme
        ├── mini-react-ts
        │   ├── bun-env.d.ts
        │   ├── bun.lock
        │   ├── bunfig.toml
        │   ├── package.json
        │   ├── README.md
        │   ├── tsconfig.json
        │   └── tugboats.tsx
        ├── mini-svelte-ts
        │   ├── App.svelte
        │   ├── bun.lock
        │   ├── package.json
        │   ├── README.md
        │   ├── tsconfig.json
        │   └── tugboats.ts
        └── README.md

5 directories, 14 files

```

## Config the user is saving

```toml
[[apps]]
alias = "re"
github_url = "https://github.com/rsbear/deleteme/tree/main/mini-react-ts"

[[apps]]
alias = "sv"
github_url = "https://github.com/rsbear/deleteme/tree/main/mini-svelte-ts"

[[clones]]
alias = "reactapp"
dir = "~/goodtime/heyminireact"
github_url = "https://github.com/rsbear/tugboat/tree/main/test_mini_react"

[[clones]]
alias = "svelteapp"
dir = "~/goodtime/heyminisvelte"
github_url = "https://github.com/rsbear/deleteme/tree/main/mini-svelte-ts"

[tugboat]
git_protocol = "ssh"
markdown_theme = ""
monaco_theme = "vs-dark"
tugboat_theme = "vs-darccc"
```
