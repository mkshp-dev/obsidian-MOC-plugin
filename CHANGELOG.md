# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## In-progress

## 1.4.0 - 2026-08-16

- **Feature: Copy as Markdown** — Added a Copy button to the MOC block toolbar that copies the rendered Markdown output to the clipboard without modifying the note.
- **Feature: `properties()` comparison operators** — Added `>`, `<`, `>=`, `<=`, `!=` operators to `properties()` filters for numeric and date comparisons (e.g. `properties(priority <= 2)`, `properties(date >= "2024-01-01")`).
- **Feature: `template` option** — Custom output formatting for each matched element by referencing a template note (configured via the **Template folder** setting) whose content uses `{{content}}`, `{{file}}`, `{{path}}`, and `{{link}}` handlebars-style placeholders.
- **Feature: `excludeFolder` and `excludeFile` options** — Explicitly exclude specific folders or files from MOC results even when they fall within the configured scan folder. Accepts a single string or JSON array.
- **Feature: `showCount` option** — Appends a result count summary (e.g. "3 results in 2 files") and adds per-group counts when `groupBy` is active.
- **Feature: `offset` parameter** — Skip a number of files at the start of the result set, complementing `limit` for paginated or windowed result sets.
- **Feature: `groupBy: property(key)`** — Group matched results by an arbitrary frontmatter property value.
- **Feature: Live auto-refresh** — MOC blocks automatically re-render (debounced 500 ms) when any Markdown file in the configured folder is created, modified, or deleted.
- **Feature: Create showcase command** — New "Create showcase" command generates a `MOC Showcase` folder at the vault root with sample notes and pre-built `moc` blocks covering every feature, including a dedicated note for `blockSeparator`/`noteSeparator` spacing and dynamic parameters.
- **Feature: Standardized filters & aliases** — Consolidated `has_word`, `contains`, `has_text` into canonical `contains`; `has_word` and `has_text` remain as backward-compatible aliases.
- **Feature: Robust tag-aware matching** — `has_tag()` matches exact tags case-insensitively and nested subtags, preventing false positives.
- **Feature: Enhanced `matches()` with regex flags** — Slash-delimited patterns with flags: `matches("/pattern/i")`.
- **Feature: Context-aware autocomplete** — The MOC Creation Wizard hides task-only filters (`is_completed`, `is_incomplete`) when a non-task element type is selected.
- **UI: Redesigned settings tab** — Icon-driven card layout for Templates and Find & Replace, native Obsidian icon buttons in place of emoji, and a cleaner add/edit rule form.
- **UI: Redesigned MOC Creation Wizard** — Wizard sections (Source, Filters, Shaping, Result manipulations) now use the same icon-driven card layout, with icon buttons replacing text/emoji controls throughout the filter builder and rule chain.
- **Fix: `template` option documentation and showcase example** — The `template` key takes the *name* of a template note (resolved against the Template folder setting), not inline placeholder text. Corrected the showcase's template note (09) and all docs/README references that previously showed inline `template: "..."` strings that would fail to resolve.
- **Docs**: Verified versioned Docusaurus deployment workflow and automated changelog syncing.


## 1.3.3 - 2026-06-30

## 1.3.2 - 2026-06-30

## 1.3.1 - 2026-06-30

## 1.3.0 - 2026-06-30

- **Feature: Reusable Find & Replace Rules** — Added a rules manager to the settings panel allowing users to define reusable find-and-replace literal or regex transformations. These can be selected via a dropdown in the MOC Wizard or referenced in MOC blocks using `applyFnR: <RuleName>` (or sequentially chained using array syntax like `applyFnR: [<rule1>, <rule2>]`).
- **Feature: Decoupled Block & Note Separators** — Added support for configuring separators at two levels: between adjacent matched blocks in the same note (`blockSeparator`) and between different note sections (`noteSeparator`). Users can configure both separators to be `None`, `Divider line` (inserts `---`), or `Empty line` through dropdowns in the MOC Wizard or YAML keys.

## 1.2.7 - 2026-06-29

* Added attestation to remove the obsidian auto-review bot warning

## 1.2.6 - 2026-06-29

## 1.2.5 - 2026-06-24

- Add automated tests covering MOC filter parsing, boolean filter composition, property-based filters, and malformed filter handling.
- Refresh the README to document the current MOC block schema, advanced filtering, result shaping options, the MOC Creation Wizard, and Bake to Markdown.
- Add support for configuring groupBy, sort, and limit directly from the MOC Creation Wizard.
- Document the repository’s Jules task workflow and issue queue setup in the README.

## 1.2.4 - 2026-06-16

- **Misc**: Removed documentation from `main` and `Dev` branches, moving it to a new `docs` branch. Updated `deploy-docs` workflow to trigger on push to `docs`.
- **Chore: Fix ESLint warnings** — Fixed the empty object type linting error in settings.ts by avoiding `eslint-disable-next-line`.

## 1.2.3 - 2026-06-13

- **Feature: Complex Filter Logic** — Added support for complex filter logic using AND, OR, NOT and parentheses. Also added auto-completion to the MOC Creation Wizard for writing these complex filters.
- **Feature: Dynamic Parameters** — Added support for dynamically including current note parameters (`{{this.filename}}`, `{{this.folder}}`, `{{this.path}}`) in `folder` and `filter` configs. Closes [#18](https://github.com/mkshp-dev/obsidian-MOC-plugin/issues/18).
- **Misc**: Updated repository description to reflect expanded element extraction, and added sponsor options to README and manifest.json.
- **Feature: Grouping/Hierarchical View** — Added a `groupBy` option to the MOC configuration block. You can now group matching elements by `folder`, `cday` (creation date), `mday` (modification date), or `tag`. Closes [#7](https://github.com/mkshp-dev/obsidian-MOC-plugin/issues/7).
- **Feature: Bake to Markdown** — Added a "Bake" button to dynamic MOC blocks that replaces the dynamic view with static markdown directly in the note. Closes [#8](https://github.com/mkshp-dev/obsidian-MOC-plugin/issues/8).
- **Feature: MOC Creation Wizard** — Added an interactive modal (wizard) to generate Map of Content (MOC) code blocks without manual YAML writing. Closes [#9](https://github.com/mkshp-dev/obsidian-MOC-plugin/issues/9).
- **Feature: Sort and Limit Options** — Added the ability to sort matched files and limit the number of files processed in the MOC code block. Closes [#6](https://github.com/mkshp-dev/obsidian-finance-plugin/issues/6).
- **Feature**: add advanced metadata & property filtering — Support properties(key == value) filter in MOC block. Closes [#5](https://github.com/mkshp-dev/obsidian-finance-plugin/issues/5).

## [1.0.0] - 2024-05-01
### Added
- Initial release.
- Support for `moc` code blocks with `folder`, `element`, `filter`, and `recursive` configuration.
- Support for extracting `List`, `Task`, `Heading`, `Paragraph`, and `Blockquote` elements.
- Supported filters: `has_word`, `contains`, `has_text`, `matches` (regex), `has_tag`, `is_completed`, `is_incomplete`.
