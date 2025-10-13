import { defineConfig } from "@rsbuild/core";
import { pluginBabel } from "@rsbuild/plugin-babel";
import { pluginSolid } from "@rsbuild/plugin-solid";

export default defineConfig({
	html: {
		template: "./app.html",
	},
	plugins: [
		pluginBabel({
			include: /\.(?:jsx|tsx)$/,
		}),
		pluginSolid(),
	],
	// Ensure @tugboats/core is not bundled; it's provided via import map at runtime
	// tools: {
	// 	rspack: (config: any) => {
	// 		config.externals = {
	// 			...(config.externals || {}),
	// 			"@tugboats/core": "/assets/core/mod.js",
	// 		};
	// 	},
	// },
});
