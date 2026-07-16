import { defineConfig } from "eslint/config";
import tsparser from "@typescript-eslint/parser";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";

export default defineConfig([
	// Include the recommended configuration from obsidianmd plugin
	...obsidianmd.configs.recommended,

	// Configure the TypeScript parser for TS files
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				project: "./tsconfig.json",
			},
			globals: {
				...globals.browser,
			},
		},
	},

	// Global ignores (excluding build folders, tests, and config/mock scripts)
	{
		ignores: [
			"node_modules/**",
			"dist/**",
			"docs-site/**",
			"esbuild.config.mjs",
			"eslint.config.js",
			"eslint.config.mts",
			"version-bump.mjs",
			"versions.json",
			"main.js",
			".test-out.cjs",
			"obsidian-mock.js",
			"test-runner.mjs",
			"src/tests/**",
			"package.json",
			"package-lock.json",
			"tsconfig.json",
			"**/*.json",
		],
	},
]);
