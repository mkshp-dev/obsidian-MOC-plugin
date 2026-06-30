---
sidebar_position: 3
---

# Creation Wizard

The **MOC Creation Wizard** is an interactive, visual builder that allows you to generate dynamic Map of Content code blocks without having to write YAML syntax manually.

## Opening the Wizard

You can open the wizard in two ways:

1. **Ribbon Icon**: Click the list/bullet icon (**Create map of content block**) in the Obsidian ribbon on the left side of your window.
2. **Command Palette**: Open the Command Palette (`Ctrl/Cmd + P`), search for `Create map of content block`, and press `Enter`.

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

### 4. Filter String
Specify the complex logical filter condition to run on your selected elements.
The wizard features an interactive autocomplete suggester that activates as you type.

You can use primitive functions such as `has_word("")`, `has_tag("")`, `is_completed()`, and combine them using logical operators like `AND`, `OR`, and `NOT`.

- *Example*: `has_word("Meeting") AND NOT is_completed()`

### 5. Block Separator
Select the spacing or divider format to apply between matching blocks extracted from the **same note**:
- **None**: Elements are joined directly together (useful for keeping list elements combined).
- **Divider line**: Injects a horizontal divider line (`---`) between adjacent blocks.
- **Empty line**: Injects a single blank line spacing between adjacent blocks.

### 6. Note Separator
Select the spacing or divider format to apply between sections representing **different notes**:
- **Empty line** (default): Standard blank line spacing.
- **Divider line**: Injects a horizontal divider line (`---`) between note sections.
- **None**: Renders note sections adjacent to each other without extra spacing.

### 7. Find and Replace (Optional)
Manage a sequence of Find & Replace text transformations to execute on the extracted block texts:
- **Add rule**: Select any rule defined in your plugin settings from the dropdown menu to append it to your active transformation chain.
- **Order rules**: Use the up (**▲**) and down (**▼**) buttons next to each rule to adjust their execution order. Rules are applied sequentially, so the output of the first rule is passed directly into the input of the second.
- **Remove rules**: Click **Remove** next to a rule in the list to remove it from the active chain.

---

## Inserting the Block

Once you have configured the options, click **Insert block**. The wizard will instantly write the generated `moc` block at your editor's current cursor position, like so:

```yaml
```moc
folder: Projects/Marketing
element: Task
filter: is_incomplete()
recursive: true
```
```
