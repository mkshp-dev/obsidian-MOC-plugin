# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## In-progress

- **Feature: Standardized Filters & Aliases** — Consolidated redundant substring filters (`has_word`, `contains`, `has_text`) into a canonical `contains` filter, while retaining `has_word` and `has_text` as backward-compatible aliases.
- **Feature: Robust Tag-Aware Matching** — Re-implemented `has_tag` to match exact tags (case-insensitively) and nested subtags (e.g., `#project/subtag`), preventing false positives from longer substring tags and URL fragments.
- **Feature: Enhanced `matches()` with Regex Flags** — Added support for slash-delimited regular expression patterns with flags in `matches()` (e.g., `matches("/pattern/i")` for case-insensitive matching).
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
