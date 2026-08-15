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
- Supports dynamic parameters: `{{this.filename}}`, `{{this.folder}}`, `{{this.path}}` (see [Dynamic Parameters](#dynamic-parameters)).

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
  
    ![Extracting lists by keyword/phrase](/img/Showcase_3.png)
- **Regular expressions**:
  - `matches("regex_pattern")`: Evaluates the element using a regular expression match. Supports optional slash-delimited format with flags, e.g. `matches("/pattern/i")`.
- **Tags**:
  - `has_tag("#tag")`: Evaluates if the element contains the specified hashtag (fully tag-aware, case-insensitive, and matches subtags like `#tag/subtag`).
- **Tasks** (only when `element` is `Task` or `List`):
  - `is_completed()`: Matches completed tasks.
  - `is_incomplete()`: Matches incomplete tasks.
  
    ![Extracting incomplete tasks](/img/Showcase_2.png)
- **Frontmatter properties**:
  - `properties(key == value)`: Matches files where the frontmatter property `key` equals `value`.
  - Supported operators: `==`, `!=`, `>`, `<`, `>=`, `<=`.
  - Numeric values are compared numerically; ISO date strings (`YYYY-MM-DD`) are compared as dates; all other values are compared as strings.
  - *Examples*:
    - `properties(status == "active")`
    - `properties(priority <= 2)`
    - `properties(date >= "2024-01-01")`
  
    ![Filtering by frontmatter properties](/img/Showcase_4.png)

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

### `limit` (Optional)
Limits the maximum number of markdown files processed. Must be a positive integer.
- *Example*: `limit: 10`

---

### `offset` (Optional)
Skips the specified number of files at the start of the (sorted) file list before processing. Must be a non-negative integer. Use together with `limit` to paginate results.
- *Example*: `offset: 5` (skip the first 5 files, then apply `limit`)

---

### `showCount` (Optional)
When set to `true`, appends a result count summary at the bottom of the MOC block (e.g. `3 results in 2 files`). When `groupBy` is active, each group heading also shows the number of elements in that group.
- **Values**: `true` or `false` (defaults to `false`).
- *Example*: `showCount: true`

---

### `excludeFolder` (Optional)
Explicitly excludes one or more folders from the search results, even when they fall within the configured `folder` and `recursive: true` is set. Paths are relative to the vault root.
- **Format**: a single string or a JSON array of strings.
- *Example (single)*: `excludeFolder: Projects/Archive`
- *Example (multiple)*: `excludeFolder: ["Projects/Archive", "Templates"]`

---

### `excludeFile` (Optional)
Explicitly excludes one or more files from the search results. Paths are relative to the vault root and can be specified with or without the `.md` extension.
- **Format**: a single string or a JSON array of strings.
- *Example (single)*: `excludeFile: Projects/Template`
- *Example (multiple)*: `excludeFile: ["Projects/Template", "Daily/2024-01-01"]`

---

### `template` (Optional)
Defines a custom output format for each matched element using handlebars-style `{{placeholder}}` syntax. The template is applied after any `applyFnR` transformations.

Available placeholders:

| Placeholder | Value |
|-------------|-------|
| `{{content}}` | The matched element text |
| `{{file}}` | Source file basename (without extension) |
| `{{path}}` | Source file path relative to vault root |
| `{{link}}` | Wiki-link to the source file: `[[path\|basename]]` |

- *Example*: `template: "- {{content}} — [[{{path}}|{{file}}]]"`

---

### `applyFnR` (Optional)
Applies reusable Find & Replace rules defined in the plugin's settings to the matched block contents. Can be a single rule name string or a JSON array of rule names. If an array is provided, the rules are applied sequentially in the specified order.
- **Format**: `string` or `string[]`
- *Example (single)*: `applyFnR: clean-headers`
- *Example (chain)*: `applyFnR: ["strip-comments", "clean-headers"]`

---

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

You can dynamically include the current note's parameters in the `folder` and `filter` options using the following variables:
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

![Dynamic parameters usage](/img/Showcase_5.png)

---