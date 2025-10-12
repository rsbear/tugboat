// pkgs/core/tsup.config.ts

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/mod.ts"],
  format: ["esm"],
  dts: true, // generates .d.ts types
  sourcemap: true,
  clean: true,
  outDir: "dist",
  target: "es2020", // Better compatibility for npm consumers
  splitting: false, // Single bundle for simplicity
  treeshake: true,
});
