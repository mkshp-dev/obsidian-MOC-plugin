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

	// Build scripts and tests run in Node, never inside Obsidian, so Node's
	// built-ins, `process` and console output are expected there. Every other
	// rule still applies to them.
	{
		files: ["*.mjs", "obsidian-mock.js", "src/tests/**"],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			"obsidianmd/no-nodejs-modules": "off",
			// Only its no-console message is relaxed; no-new-func still applies.
			"obsidianmd/rule-custom-message": "off",
			"no-new-func": "error",
		},
	},

	// The test mock stands in for Obsidian itself, including the copy of
	// moment that Obsidian bundles, so it is the one file that imports it.
	{
		files: ["obsidian-mock.js"],
		rules: {
			"@typescript-eslint/no-restricted-imports": "off",
			"import/no-extraneous-dependencies": "off",
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
