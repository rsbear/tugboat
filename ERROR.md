```bash
❯ just dev
just build_core_dev
cd pkgs/core && deno task build
Task build tsup
CLI Building entry: src/mod.ts
CLI Using tsconfig: tsconfig.json
CLI tsup v8.5.0
CLI Using tsup config: /Users/rs/goodtime/tugboats/pkgs/core/tsup.config.ts
CLI Target: es2020
CLI Cleaning output folder
ESM Build start
ESM dist/mod.js     5.00 KB
ESM dist/mod.js.map 13.72 KB
ESM ⚡️ Build success in 42ms
DTS Build start
DTS ⚡️ Build success in 258ms
DTS dist/mod.d.ts 3.11 KB
mkdir -p app/src/assets/core
cp pkgs/core/dist/* app/src/assets/core/
cd app && deno bundle --platform=browser src/App.tsx -o src/assets/bundle.js && deno task tauri dev
⚠️ deno bundle is experimental and subject to changes
error: Relative import path "react-dom/client" not prefixed with / or ./ or ../ and not in import map from "file:///Users/rs/goodtime/tugboats/app/src/mount_utils.ts"
    at file:///Users/rs/goodtime/tugboats/app/src/mount_utils.ts:29:44
error: Relative import path "react" not prefixed with / or ./ or ../ and not in import map from "file:///Users/rs/goodtime/tugboats/app/src/mount_utils.ts"
    at file:///Users/rs/goodtime/tugboats/app/src/mount_utils.ts:30:47
error: Relative import path "svelte" not prefixed with / or ./ or ../ and not in import map from "file:///Users/rs/goodtime/tugboats/app/src/mount_utils.ts"
    at file:///Users/rs/goodtime/tugboats/app/src/mount_utils.ts:44:48
error: Relative import path "solid-js/web" not prefixed with / or ./ or ../ and not in import map from "file:///Users/rs/goodtime/tugboats/app/src/mount_utils.ts"
    at file:///Users/rs/goodtime/tugboats/app/src/mount_utils.ts:52:40
error: Relative import path "vue" not prefixed with / or ./ or ../ and not in import map from "file:///Users/rs/goodtime/tugboats/app/src/mount_utils.ts"
    at file:///Users/rs/goodtime/tugboats/app/src/mount_utils.ts:58:43
error: bundling failed
error: Recipe `dev` failed on line 14 with exit code 1
```

