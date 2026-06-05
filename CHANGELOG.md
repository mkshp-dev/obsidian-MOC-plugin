# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## In-progress

- **Feature: Bake to Markdown** — Added a "Bake" button to dynamic MOC blocks that replaces the dynamic view with static markdown directly in the note. Closes [#8](https://github.com/mkshp-dev/obsidian-MOC-plugin/issues/8).

## [1.0.0] - 2024-05-01
### Added
- Initial release.
- Support for `moc` code blocks with `folder`, `element`, `filter`, and `recursive` configuration.
- Support for extracting `List`, `Task`, `Heading`, `Paragraph`, and `Blockquote` elements.
- Supported filters: `has_word`, `contains`, `has_text`, `matches` (regex), `has_tag`, `is_completed`, `is_incomplete`.
