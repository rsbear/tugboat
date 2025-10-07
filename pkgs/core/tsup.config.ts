// pkgs/core/tsup.config.ts

import { defineConfig } from "tsup";

export default defineConfig({
  // entry: ["mod.ts", "input/mod.ts", "hints/mod.ts", "mode/mod.ts", "kv/mod.ts"],
  entry: ["src/mod.ts"],
  format: ["esm"],
  dts: true, // generates .d.ts types
  sourcemap: true,
  clean: true,
  outDir: "../../app/src/assets/core",
  target: "esnext",
});
