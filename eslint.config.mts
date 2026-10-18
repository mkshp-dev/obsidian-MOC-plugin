import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";

export default defineConfig([
	// Obsidian's recommended configuration, applied to the whole repository
	// so that lint sees everything the plugin review sees.
	...obsidianmd.configs.recommended,

	// Type information for every TypeScript file. The project service reads
	// tsconfig.json for src/, and covers this config file, which tsconfig
	// does not include, as a default project.
	{
		files: ["**/*.{ts,mts}"],
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.mts"],
				},
			},
			globals: {
				...globals.browser,
			},
		},
	},

	// Generated output only, matching .gitignore. Everything committed is linted.
	{
		ignores: [
			"main.js",
			".test-out.cjs",
			"data.json",
			"docs-site/build/**",
			"docs-site/.docusaurus/**",
		],
	},
]);
