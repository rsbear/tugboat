# User preferences `git_protocol` and `github_url` documentation

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


## Future considerations and work planned for a later date
- We will support other git providers along side github.
