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

### 4. Filter Type
Select the matching condition to run on your selected elements:
- **Has word**: Matches elements containing the specified word.
- **Contains**: Matches elements containing the specified substring.
- **Has text**: Similar to contains, checks for text inclusion.
- **Matches**: Evaluates elements using a Regular Expression (RegEx).
- **Has tag**: Matches elements containing a specific hashtag (e.g. `#todo`).
- **Is completed**: Extracts only completed tasks (available only when **Element** is set to `Task`).
- **Is incomplete**: Extracts only incomplete tasks (available only when **Element** is set to `Task`).

### 5. Filter Value
Specify the query string or regular expression pattern for the filter. This field automatically hides if you select a boolean filter like **Is completed** or **Is incomplete**.

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
