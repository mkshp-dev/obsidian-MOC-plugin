---
sidebar_position: 2
---

# Code Block Configuration

You can write Map of Content (MOC) queries manually in any markdown file by creating a code block with the language set to `moc` and adding a YAML configuration.

## Syntax Overview

A basic `moc` code block looks like this:

````yaml
```moc
folder: Diary
element: List
filter: contains("MOC")
recursive: true
```
````

---

## Configuration Keys

### `folder` (Required)
The folder path relative to the vault root where the plugin will search for markdown notes.
- *Examples*: `Diary`, `Projects/Marketing`, or `""` (empty string to search the entire vault).
- Supports dynamic parameters: `{{this.filename}}`, `{{this.folder}}`, `{{this.path}}` (see [Dynamic Parameters](#dynamic-parameters)), and date parameters such as `{{now:YYYY/MM}}` (see [Date parameters](#date-parameters)).
- If the folder does not exist, the block shows an error saying so. Renaming or moving a folder does not update `moc` blocks that point at it, so update `folder` to the new path.

### `element` (Required)
The specific markdown element to extract from matching notes. Must be one of the following:
- `List`: Bulleted or numbered list items.
- `Task`: Checkbox task items.
- `Heading`: Note headers (H1 to H6). The entire section (heading + body until the next same-level heading) is extracted.
- `Paragraph`: Markdown paragraph blocks.
- `Blockquote`: Markdown blockquotes.

### `filter` (Required)
The matching condition applied to each candidate element. Supports both primitive functions and complex logical expressions.
- Supports dynamic parameters: `{{this.filename}}`, `{{this.folder}}`, `{{this.path}}`.

**Primitive condition functions:**

- **String & text matches**:
  - `contains("term")`: Evaluates if the element text contains the specified substring (case-sensitive). (`has_word` and `has_text` are backward-compatible aliases.)
- **Regular expressions**:
  - `matches("regex_pattern")`: Evaluates the element using a regular expression match. Supports optional slash-delimited format with flags, e.g. `matches("/pattern/i")`.
- **Tags**:
  - `has_tag("#tag")`: Evaluates if the element contains the specified hashtag (fully tag-aware, case-insensitive, and matches subtags like `#tag/subtag`).
  
    ![Ideas tagged #idea, gathered from journal entries and project notes with has_tag("#idea")](/img/screens/ideas-inbox.png)
- **Tasks** (only when `element` is `Task` or `List`):
  - `is_completed()`: Matches completed tasks.
  - `is_incomplete()`: Matches incomplete tasks.
  
    ![Open tasks from four project notes, gathered with is_incomplete()](/img/screens/this-week.png)
- **Frontmatter properties**:
  - `properties(key == value)`: Matches files where the frontmatter property `key` equals `value`.
  - Supported operators: `==`, `!=`, `>`, `<`, `>=`, `<=`.
  - Numeric values are compared numerically; ISO dates and datetimes are compared as points in time (see [How dates are compared](#how-dates-are-compared)); all other values are compared as strings.
  - Compare with a moment relative to now using a date parameter, such as `properties(due < {{startOfDay}})`. See [Date parameters](#date-parameters).
  - Three keys read the note itself instead of its frontmatter: `file.day`, `file.ctime` and `file.mtime`. See [File dates](#file-dates).
  - *Examples*:
    - `properties(status == "active")`
    - `properties(priority <= 2)`
    - `properties(date >= "2024-01-01")`
    - `properties(due < {{startOfDay}})`
  
    ![Overdue tasks and tasks due in the next 7 days, filtered on the due property](/img/screens/overdue.png)

**Complex logical expressions:**

Combine primitive conditions using `AND`, `OR`, and `NOT`. Use parentheses to enforce precedence.

*Example*: `filter: contains("MOC") AND NOT (is_completed() OR has_tag("#todo"))`

---

### `recursive` (Optional)
A boolean determining whether subfolders of the target `folder` should also be searched.
- **Values**: `true` or `false` (defaults to `false`).

---

### `groupBy` (Optional)
Groups the extracted elements under subheadings.
- **Values**:
  - `folder`: Groups elements by their source note's folder.
  - `cday`: Groups elements by their source note's creation date (`YYYY-MM-DD`).
  - `mday`: Groups elements by their source note's modification date (`YYYY-MM-DD`).
  - `tag`: Groups elements by the hashtag(s) found inside the element's text (elements with no tags fall under "Untagged").
  - `property(key)`: Groups elements by the value of the specified frontmatter property key. Elements from notes where the property is missing or empty are grouped under `(none)`.
  - *Example*: `groupBy: property(status)`

---

### `sort` (Optional)
Sorts the matching source notes before processing and extracting elements.
- **Format**: `<field> <direction>`
- **Fields**: `name` (filename), `ctime` (creation date), `mtime` (modification date)
- **Directions**: `asc` (ascending), `desc` (descending)
- *Example*: `sort: mtime desc`

---

### `fileLimit` (Optional)
Limits the maximum number of markdown files scanned. Must be a positive integer. This is the only limit that reduces work: files beyond it are never read.
- *Example*: `fileLimit: 10`

---

### `fileOffset` (Optional)
Skips the specified number of files at the start of the (sorted) file list before scanning. Must be a non-negative integer. Use with `fileLimit` to page through notes.
- *Example*: `fileOffset: 5`

---

### `blockLimit` (Optional)
Limits the maximum number of matched elements shown in total, across all files. Must be a positive integer.

This is usually what you want. `fileLimit: 20` means "look at 20 notes"; `blockLimit: 20` means "show me 20 results".
- *Example*: `blockLimit: 20`

---

### `blockOffset` (Optional)
Skips the specified number of matched elements before showing results. Must be a non-negative integer. Pair it with `blockLimit` to paginate results rather than files.
- *Example*: `blockOffset: 20` with `blockLimit: 20` shows results 21–40.

---

### `blocksPerFile` (Optional)
Limits how many matched elements are taken from any single note, keeping the first ones in document order. Must be a positive integer.

Use it alongside `blockLimit` so that one busy note cannot fill the whole result window and hide every other note.
- *Example*: `blocksPerFile: 3`

---

### `limit` / `offset` (Deprecated)
`limit` and `offset` are the original names for `fileLimit` and `fileOffset` and continue to work unchanged. Prefer the explicit names in new blocks — `limit` counts *files*, which is easy to misread as counting results. If both are given, the explicit key wins.

---

### `showCount` (Optional)
When set to `true`, appends a result count summary at the bottom of the MOC block (e.g. `3 results in 2 files`). When `groupBy` is active, each group heading also shows the number of elements in that group.

If `blockLimit`, `blockOffset` or `blocksPerFile` trimmed the results, the summary reports both numbers (e.g. `20 of 137 results in 8 files`) so a limited view never understates the total.
- **Values**: `true` or `false` (defaults to `false`).
- *Example*: `showCount: true`

---

### `excludeFolder` (Optional)
Explicitly excludes one or more folders from the search results, even when they fall within the configured `folder` and `recursive: true` is set. Paths are relative to the vault root.
- **Format**: a single string or a JSON array of strings.
- *Example (single)*: `excludeFolder: Projects/Archive`
- *Example (multiple)*: `excludeFolder: ["Projects/Archive", "Templates"]`
- Supports `{{this.…}}` and date parameters, as in `excludeFolder: Journal/{{now:YYYY}}` to leave out this year's folder.

---

### `excludeFile` (Optional)
Explicitly excludes one or more files from the search results. Paths are relative to the vault root and can be specified with or without the `.md` extension.
- **Format**: a single string or a JSON array of strings.
- *Example (single)*: `excludeFile: Projects/Template`
- *Example (multiple)*: `excludeFile: ["Projects/Template", "Daily/2024-01-01"]`
- Supports `{{this.…}}` and date parameters, as in `excludeFile: Daily/{{now:YYYY-MM-DD}}` to leave out today's daily note.

---

### `template` (Optional)
The **name of a template note** (not inline text) used to define a custom output format for each matched element. The template is applied after any `applyFnR` transformations.

Templates are resolved against the **Template folder** configured in **Settings → Maps of Content**. To use a template:
1. Set a **Template folder** in the plugin settings (e.g. `Templates`).
2. Create a note inside that folder whose *content* is the format string, using handlebars-style `{{placeholder}}` syntax — for example a note named `bullet-link.md` containing `- {{content}} — [[{{path}}|{{file}}]]`.
3. Reference the note's basename (without `.md`) in the `template` key: `template: bullet-link`.

Editing a template note refreshes every block that uses it, even though the template folder is usually outside the block's `folder`.

Available placeholders (used inside the template note's content):

| Placeholder | Value |
|-------------|-------|
| `{{content}}` | The matched element text |
| `{{file}}` | Source file basename (without extension) |
| `{{path}}` | Source file path relative to vault root |
| `{{link}}` | Wiki-link to the source file: `[[path\|basename]]` |

- *Example*: `template: bullet-link` (where `Templates/bullet-link.md` contains `- {{content}} — [[{{path}}|{{file}}]]`)

---

> **Note**: If a template rewrites the matched text, task checkboxes in the output render read-only. See [Interactive tasks](./toolbar.md#interactive-tasks).

### `applyFnR` (Optional)
Applies reusable Find & Replace rules defined in the plugin's settings to the matched block contents. Can be a single rule name string or a JSON array of rule names. If an array is provided, the rules are applied sequentially in the specified order.
- **Format**: `string` or `string[]`
- *Example (single)*: `applyFnR: clean-headers`
- *Example (chain)*: `applyFnR: ["strip-comments", "clean-headers"]`

---

> **Note**: If a rule rewrites the matched text, task checkboxes in the output render read-only. See [Interactive tasks](./toolbar.md#interactive-tasks).

### `blockSeparator` (Optional)
Defines the separator rendered between different matched blocks extracted from the **same note**.
- **Values**: 
  - `none` (default): Blocks are joined directly (useful for joining consecutive lists).
  - `divider`: A horizontal rule `---` is inserted between blocks.
  - `newline`: A blank line is inserted between blocks (useful for separating paragraphs).
- *Example*: `blockSeparator: newline`

---

### `noteSeparator` (Optional)
Defines the separator rendered between block groups from **different notes**.
- **Values**:
  - `newline` (default): A single empty line separates note sections.
  - `divider`: A horizontal rule `---` is inserted between note sections.
  - `none`: Note sections are joined directly without extra spacing.
- *Example*: `noteSeparator: divider`

---

## Dynamic Parameters

You can dynamically include the current note's parameters in `folder`, `filter`, `excludeFolder` and `excludeFile` using the following variables:
- `{{this.filename}}`: Expands to the current note's name (without the `.md` extension).
- `{{this.folder}}`: Expands to the name of the folder containing the current note.
- `{{this.path}}`: Expands to the full path of the current note (without the `.md` extension).

For example, to list elements from the `Diary` folder that contain the current note's name:

````yaml
```moc
folder: Diary
element: List
filter: contains("{{this.filename}}")
recursive: true
```
````

![The Website redesign note lists only the meeting decisions that link to it, with filter: has_tag("#decision") AND contains("[[this note]]")](/img/screens/project-decisions.png)

---

## Date parameters

A date parameter in double braces stands for a **point in time** relative to now. Like `{{this.filename}}`, it is replaced with text before the block runs, in `folder`, `filter`, `excludeFolder` and `excludeFile`.

````yaml
```moc
folder: Projects
element: Task
filter: is_incomplete() AND properties(due < {{startOfDay}})
recursive: true
```
````

A parameter is an **anchor**, optionally followed by one or more **offsets**, optionally followed by a **format**:

| Part | Values |
|------|--------|
| Anchor | `now`, `startOfDay`, `endOfDay`, `startOfWeek`, `endOfWeek`, `startOfMonth`, `endOfMonth`, `startOfYear`, `endOfYear` |
| Offset | `+` or `-`, a whole number, then `h` (hours), `d` (days), `w` (weeks), `m` (months) or `y` (years). Offsets can be chained, as in `{{now+1w-2h}}`. |
| Format | `:` followed by a [moment.js format](https://momentjs.com/docs/#/displaying/format/), as in `{{now:YYYY/MM}}`. Without one, the parameter becomes a full date and time such as `2026-10-21T00:00:00`. |

Anchors are not case-sensitive.

| You write | Means |
|-----------|-------|
| `{{now}}` | This moment |
| `{{startOfDay}}` / `{{endOfDay}}` | The first and last moment of today |
| `{{now-2h}}` | Two hours ago |
| `{{startOfDay-7d}}` | Midnight at the start of the day a week ago |
| `{{endOfDay+7d}}` | The last moment of the day a week from today |
| `{{startOfWeek}}` / `{{endOfWeek}}` | The first and last moment of this week |
| `{{startOfMonth-1m}}` | The first moment of last month |
| `{{endOfMonth+1m}}` | The last moment of next month |
| `{{now:YYYY-MM}}` | This month as text, such as `2026-10` |

Offsets move the point first, then the anchor snaps it to the edge of the day, week, month or year it lands in. That is why `{{endOfMonth+1m}}` always lands on the last day of next month, however many days this month has.

Weeks start on the day your Obsidian language uses, so `{{startOfWeek}}` is a Sunday in some languages and a Monday in others.

### Ranges

Every parameter is a single point, so a range is written as two comparisons:

| Intent | Filter |
|--------|--------|
| Due today | `properties(due >= {{startOfDay}}) AND properties(due <= {{endOfDay}})` |
| Overdue | `properties(due < {{startOfDay}})` |
| Due within a week | `properties(due >= {{startOfDay}}) AND properties(due <= {{endOfDay+7d}})` |
| This month | `properties(due >= {{startOfMonth}}) AND properties(due <= {{endOfMonth}})` |
| Edited in the last day | `properties(file.mtime >= {{now-24h}})` |

The MOC Creation Wizard has presets such as **is today** and **is this week** that write these ranges for you.

### How dates are compared

When both sides of a `properties()` comparison are ISO dates or datetimes, they are compared as points in time:
- **A date without a time means midnight at the start of that day, in your local time.** So `due: 2026-10-21` is 21 October at 00:00, and it falls between `{{startOfDay}}` and `{{endOfDay}}` all day on the 21st.
- A date with a time, such as `2026-10-21T09:30`, is that exact moment.
- `==` only matches the exact same moment. To match a whole day, week or month, use a range.

The word `"today"` in quotes is just text. Only parameters in double braces are replaced.

### Mistakes are reported

A parameter that cannot be replaced shows an error in the block instead of being left as text. The MOC Creation Wizard runs the same checks before it inserts a block.

| You write | What the block says |
|-----------|---------------------|
| `{{now-0.5h}}` | Offsets must be whole numbers |
| `{{now-7x}}` | Unknown unit, with the list of units |
| `{{startOfDya}}` | Unknown date, with the list of anchors |
| `{{today}}` | A whole day is a range, so use `{{startOfDay}}` and `{{endOfDay}}` |
| `{{this.filname}}` | Unknown parameter, with the list of `{{this.…}}` parameters |
| `{{nwo:YYYY}}`, `{{custom}}` | Unknown parameter, with the parameters you can use |

Every `{{…}}` in a block is a parameter, so one the plugin does not know is always reported, in `folder`, `filter` and the exclusions alike.

**Searching for literal braces:** to find notes that contain text such as `{{title}}`, for example where a template was never filled in, escape the braces in a regular expression: `matches("\{\{title\}\}")`. Escaped braces are not a parameter. Writing `contains("{{title}}")` shows an error that suggests this.

If a filter only breaks once its parameters are replaced, the error shows the replaced text, since that is what failed. The usual cause is a formatted value with spaces in it: write `properties(month == "{{now:MMMM YYYY}}")` with quotes, not `properties(month == {{now:MMMM YYYY}})`.

### Refreshing

Blocks that use date parameters move on to the new day by themselves, even with no file changes. They check once at midnight and again whenever the Obsidian window comes back into focus, which covers a device that was asleep at midnight. `{{now}}` is evaluated each time the block renders.

> **Note**: **Bake** writes a snapshot. Baked text keeps the results of the moment you baked it.

### File dates

Three keys in `properties()` read the note itself rather than its frontmatter. They work with date parameters and fixed dates alike:

| Key | Value |
|-----|-------|
| `file.day` | Midnight at the start of the first `YYYY-MM-DD` date in the note's filename, as used by daily notes. A note without one never matches. |
| `file.ctime` | The moment the note was created |
| `file.mtime` | The moment the note was last modified |

````yaml
```moc
folder: Journal
element: List
filter: has_tag("#idea") AND properties(file.day >= {{startOfDay-7d}})
sort: name desc
```
````

Creation and modification times come from your file system, so sync tools and copying files can change them. For daily notes, `file.day` is usually the more dependable choice.

### Dated folders

With a format, a parameter becomes any text you need, such as a folder name:

````yaml
```moc
folder: Journal/{{now:YYYY/MM}}
element: Task
filter: is_incomplete()
```
````

If a dated folder does not exist yet, for example on the first day of a new month, the block shows the same error as any missing folder. It recovers as soon as you create a note there.

> **Note**: If `folder` starts with `{{`, wrap it in quotes, as in `folder: "{{now:YYYY}}"`. Without quotes, YAML reads the braces as something else and the block fails to load. The MOC Creation Wizard adds the quotes for you.

---