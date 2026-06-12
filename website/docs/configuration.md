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
filter: has_word("MOC")
recursive: true
```
````

---

## Configuration Keys

The following keys are supported in the YAML configuration block:

### `folder` (Required)
The folder path relative to the vault root where the plugin will search for markdown notes.
- *Examples*: `Diary`, `Projects/Marketing`, or `""` (empty string to search the entire vault).

### `element` (Required)
The specific markdown element to extract from matching notes. Must be one of the following:
- `List`: Bulleted or numbered list items.
- `Task`: Checkbox task items.
- `Heading`: Note headers (H1 to H6).
- `Paragraph`: Markdown paragraph blocks.
- `Blockquote`: Markdown blockquotes.

### `filter` (Required)
The matching function applied to each candidate element. The following filter formulas are supported:
- **String & Text Matches**:
  - `has_word("term")` or `contains("term")` or `has_text("term")`: Evaluates if the element text contains the specified word/string.
- **Regular Expressions**:
  - `matches("regex_pattern")`: Evaluates the element using a regular expression match.
- **Tags**:
  - `has_tag("#tag")`: Evaluates if the element contains the specified hashtag.
- **Tasks** (Only when `element` is `Task`):
  - `is_completed()`: Matches completed tasks.
  - `is_incomplete()`: Matches incomplete tasks.
- **Advanced Metadata/Properties**:
  - `properties(key == value)`: Filters the note's frontmatter properties before parsing elements. Only files containing the specified property key matching the value will have their elements processed.
  - *Example*: `filter: properties(status == "active")` or `filter: properties(priority == 1)`

### `recursive` (Optional)
A boolean determining whether subfolders of the target `folder` should also be searched.
- **Values**: `true` or `false` (defaults to `false`).

### `groupBy` (Optional)
Groups the extracted elements under subheadings.
- **Values**:
  - `folder`: Groups elements by their source note's folder.
  - `cday`: Groups elements by their source note's creation date (`YYYY-MM-DD`).
  - `mday`: Groups elements by their source note's modification date (`YYYY-MM-DD`).
  - `tag`: Groups elements by the hashtag(s) found inside the element's text (elements with no tags fall under "Untagged").

### `sort` (Optional)
Sorts the matching source notes before processing and extracting elements.
- **Format**: `<field> <direction>`
- **Fields**: `name` (filename), `ctime` (creation date), `mtime` (modification date)
- **Directions**: `asc` (ascending), `desc` (descending)
- *Example*: `sort: mtime desc`

### `limit` (Optional)
Limits the maximum number of markdown files processed. Must be a positive integer.
- *Example*: `limit: 10`

### Dynamic Parameters

You can dynamically include the current note's parameters in the `folder` and `filter` options using the following variables:
- `{{this.filename}}`: Expands to the current note's name (without the `.md` extension).
- `{{this.folder}}`: Expands to the name of the folder containing the current note.
- `{{this.path}}`: Expands to the full path of the current note (without the `.md` extension).

For example, to list elements from the `Diary` folder that contain the current note's name:

````yaml
```moc
folder: Diary
element: List
filter: has_word("{{this.filename}}")
recursive: true
```
````


---

## Complete Examples

### Extracting Tasks Grouped by Folder
Search the `Projects/` folder recursively for incomplete tasks, sorting notes by filename, and grouping the output by their parent folder path:

````yaml
```moc
folder: Projects
element: Task
filter: is_incomplete()
recursive: true
groupBy: folder
sort: name asc
```
````

### Extracting Headings Filtered by Tag and Grouped by Tag
Search the entire vault for headings containing the hashtag `#review`, grouping them under their corresponding tag headings:

````yaml
```moc
folder: ""
element: Heading
filter: has_tag("#review")
recursive: true
groupBy: tag
```
````

### Advanced Frontmatter Property Filtering
Extract lists from notes in the `Archive` folder that have the frontmatter property `archived: true`:

````yaml
```moc
folder: Archive
element: List
filter: properties(archived == true)
```
````
