# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## In-progress
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
