---
sidebar_position: 4
---

# Creation Wizard

The **MOC Creation Wizard** is an interactive, visual builder that allows you to generate dynamic Map of Content code blocks without having to write YAML syntax manually.

## Opening the Wizard

You can open the wizard in two ways:

1. **Ribbon icon**: Click the list/bullet icon (**Create map of content block**) in the Obsidian ribbon on the left side of your window.
2. **Command palette**: Open the Command Palette (`Ctrl/Cmd + P`), search for `Create map of content block`, and press `Enter`.

## Configuration Options

When the wizard modal opens, you can configure the following fields:

### 1. Folder
Specify the folder path in your vault where the plugin should search for notes.
- *Example*: `Diary` or `Work/Meetings`.
- Leave empty to scan the entire vault.

### 2. Element
Select the markdown element type you want to extract:
- **List**: Bulleted/numbered list items.
- **Task**: Checkbox task items.
- **Heading**: Document headers (H1 to H6).
- **Paragraph**: Standard text paragraphs.
- **Blockquote**: Markdown blockquote segments.

### 3. Recursive
Toggle this on to include notes in subfolders of the specified directory. If toggled off, only notes directly inside the specified folder are scanned.

### 4. Exclude folder
Specify one or more folder paths to skip, separated by commas. These folders are excluded even when **Recursive** is on.
- *Example*: `Archive, Templates`

### 5. Exclude file
Specify one or more file paths to skip, separated by commas.
- *Example*: `Templates/daily, Inbox/scratch`

### 6. Filter string
Specify the complex logical filter condition to run on your selected elements.
The wizard features an interactive autocomplete suggester that activates as you type.

You can use primitive functions such as `contains("")`, `has_tag("")`, `is_completed()`, `properties( == "")`, and combine them using logical operators like `AND`, `OR`, and `NOT`.

> **Note**: `is_completed()` and `is_incomplete()` are only suggested when **Element** is set to `Task` or `List`.

- *Example*: `contains("Meeting") AND NOT is_completed()`

### 7. Show count
Toggle on to append a result count summary at the bottom of the block (e.g. `3 results in 2 files`). Per-group counts are also shown when **Group by** is active.

### 8. Group by
Group results under subheadings:
- **None**: No grouping (default).
- **Folder**: Group by the source note's parent folder.
- **Tag**: Group by hashtags found in each element's text.
- **Creation day**: Group by source note creation date.
- **Modification day**: Group by source note modification date.
- **Property...**: Group by any frontmatter property. When selected, an additional **Property key** field appears where you enter the frontmatter key name (e.g. `status`, `project`).

### 9. Sort
Sort the scanned files before extracting elements. Select a **sort field** (`Name`, `Creation time`, `Modification time`) and **direction** (`Ascending` or `Descending`).

### 10. Limit
Enter a positive integer to limit the maximum number of files processed.
- *Example*: `10`

### 11. Offset
Enter a non-negative integer to skip that many files from the start of the (sorted) list. Use together with **Limit** for pagination.
- *Example*: `5`

### 12. Block separator
Select the spacing or divider format to apply between matching blocks extracted from the **same note**:
- **None**: Elements are joined directly together (useful for keeping list elements combined).
- **Divider line**: Injects a horizontal divider line (`---`) between adjacent blocks.
- **Empty line**: Injects a single blank line spacing between adjacent blocks.

### 13. Note separator
Select the spacing or divider format to apply between sections representing **different notes**:
- **Empty line** (default): Standard blank line spacing.
- **Divider line**: Injects a horizontal divider line (`---`) between note sections.
- **None**: Renders note sections adjacent to each other without extra spacing.

### 14. Template (optional)
Enter a custom output format for each matched element using `{{placeholder}}` syntax. Available placeholders: `{{content}}`, `{{file}}`, `{{path}}`, `{{link}}`.
- *Example*: `- {{content}} — {{link}}`

### 15. Find and replace (optional)
Manage a sequence of Find & Replace text transformations to execute on the extracted block texts. Rules must first be defined in **Settings → Maps of Content**.

- **Add rule**: Select any defined rule from the dropdown to append it to the active transformation chain.
- **Order rules**: Use the **▲** and **▼** buttons to adjust execution order. Rules are applied sequentially — the output of each rule becomes the input of the next.
- **Remove rules**: Click **Remove** next to any rule to remove it from the chain.

---

## Inserting the Block

Once you have configured the options, click **Insert block**. The wizard will instantly write the generated `moc` block at your editor's current cursor position. For example:

````yaml
```moc
folder: Projects/Marketing
element: Task
filter: is_incomplete()
recursive: true
groupBy: folder
sort: name asc
showCount: true
```
````
