# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## In-progress

- **UI: Wizard layout** — The folder field is wide enough to show a full path, date presets such as 'is in the next 7 days' are no longer cut off, and the Insert block button stays in view when the wizard is taller than the window.

- **Fix: Loose spacing between results** — Results sat a full blank line apart, because each one renders in its own container and the list margins inside it were not removed. They now sit as close together as a normal list.

- **Showcase: Use cases** — **Create showcase** also adds a `Use cases` folder: a small working vault of projects, meetings, book notes and a journal, with five dashboards (This week, Overdue, Decisions log, Reading highlights, Ideas inbox). Its dates are set when you run the command, so the overdue and due-soon lists always have results.

- **Showcase: Realistic sample notes** — **Create showcase** now fills its examples with a small studio's project notes, a trip and a tax return instead of placeholder "Alpha/Beta/Gamma" data. Eight example blocks that showed "No elements matching filter" (in notes 06, 07, 08, 09 and 12) now show results.

## 1.6.1 - 2026-10-18

- **Fix: Obsidian plugin review** — The date features from 1.6.0 now pass the review's type checks, which use TypeScript 6. The plugin works exactly as before.
- **Maintenance** — The project now builds with TypeScript 6 and the latest Obsidian lint rules, and lints its build scripts and tests too, so the same issues are caught before a release.


## 1.6.0 - 2026-10-18

- **Feature: Date parameters** — Filter against moments relative to now, such as `{{startOfDay}}`, `{{endOfWeek}}` or `{{now-24h}}`: `properties(due < {{startOfDay}})` lists overdue items. A format turns a date into text, as in `folder: Journal/{{now:YYYY/MM}}`. Parameters work in `folder`, `filter` and the exclusions, and blocks move on to a new day by themselves.
- **Feature: File dates** — `properties()` reads `file.day` (the date in a daily note's filename), `file.ctime` and `file.mtime`.
- **Feature: Parameter errors** — A `{{…}}` that cannot be replaced, such as `{{now-0.5h}}` or `{{this.filname}}`, shows an error instead of silently matching nothing.
- **UI: Dates in the wizard** — Presets such as **is today** and **is this week**, relative values with an offset, and a check of the block before it is inserted.
- **Change: Date comparisons** — Dates compare as moments in local time, so comparing a date with a date and time gives the same result in every time zone.
- **Change: Literal braces** — `contains("{{title}}")` is now an error. Search for braces with `matches("\{\{title\}\}")`.
- **Fix: Whole-vault blocks** — `folder: ""` scans the entire vault, as documented.
- **Fix: Wizard YAML** — The wizard quotes values such as `{{this.folder}}`, so the blocks it writes always load.
- **Showcase** — Note 16 walks through every date feature with sample notes dated when the showcase is created, and a broken block in note 12 is fixed.


## 1.5.2 - 2026-10-04

- **Fix: Refresh on rename and move** — `moc` blocks now refresh when a note is renamed or moved into, out of, or within the watched folder. Previously a moved-in note stayed missing, and a moved-out or renamed note lingered with a dead link, until some other edit triggered a refresh. Renaming a folder refreshes every block watching notes inside it.
- **Fix: Renaming the note that holds a block** — The block now follows its note's new path, so `{{this.filename}}`, `{{this.folder}}` and `{{this.path}}` re-resolve against the new name, and **Copy** and **Bake** keep working instead of reporting "Source file not found".
- **Fix: Refresh on template edits** — Editing a template note now refreshes the blocks that use it. Template folders usually sit outside the watched folder, so these edits were previously ignored.
- **Fix: Missing folder error** — A block whose `folder` does not exist, for example after the folder was renamed, now says so instead of reporting that the folder contains no notes.
- **Fix: Excluded notes no longer trigger refreshes** — Edits inside an `excludeFolder` or to an `excludeFile` no longer re-render the block. Scanning and auto-refresh now share one scope check, so they can no longer disagree about which notes a block covers.
- **Showcase: Renames and moves** — **Create showcase** now adds note 15 and a `rename-lab` sandbox folder with step-by-step walkthroughs for each of the fixes above.


## 1.5.1 - 2026-09-26

- **Feature: Interactive tasks** — Task checkboxes in a rendered `moc` block now write back to their source note. Clicking a checkbox toggles the matching `- [ ]` in the original file, and the block's existing auto-refresh reconciles the view. Works for nested subtasks, ordered-list tasks, and tasks inside extracted headings, blockquotes and callouts. Writes are guarded by a source-line match, so a stale block can never overwrite a newer edit. Blocks render their checkboxes disabled when `template` or `applyFnR` actually rewrites the matched text, since rewriting breaks the mapping back to source lines; output that comes back unchanged stays interactive. Can be turned off with the new **Interactive tasks** setting.

- **Feature: Jump to source** — Every matched block now renders with a hover-revealed button that opens its source note scrolled to the exact line the block starts at, with mod-click to open in a new pane. Blocks are rendered into individual containers so each one has its own handle, and `blockSeparator` spacing is preserved. Can be turned off with the new **Jump to source** setting.

- **Feature: Separate file and result limits** — Added `fileLimit`, `fileOffset`, `blockLimit`, `blockOffset` and `blocksPerFile`. `blockLimit` finally expresses "show me 20 results", which the old file-counting `limit` could not; `blocksPerFile` stops one busy note filling the whole result window; `blockOffset` paginates results rather than notes. `limit` and `offset` keep working as aliases for `fileLimit`/`fileOffset`, with the explicit key winning if both are set. `showCount` now reports `20 of 137 results in 8 files` when results were trimmed, and extraction stops reading files once the block window is full.

- **UI: Wizard read-only hint** — The MOC Creation Wizard now warns inline when a `Task` or `List` block is given a template or a find-and-replace rule, since reshaping the output makes its task checkboxes read-only.


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
