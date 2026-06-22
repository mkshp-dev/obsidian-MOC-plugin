# Maps of Content

This plugin provides a dynamic way to extract elements (like lists, tasks, headings, paragraphs, or blockquotes) from your Markdown files that match a specific word filter, automatically generating Map of Content (MOC) indexes in your vault.

The plugin supports dynamic MOCs generated from a folder + filter configuration, multiple output styles/element types, advanced filter expressions, grouping, sorting, and limiting results. It also includes an interactive MOC Creation Wizard and the ability to bake dynamic results into static markdown.

It accomplishes this by adding a new `moc` markdown code block processor.

## Features

- **Dynamic Output**: Automatically generated Map of Content indexes in your vault based on live queries.
- **Multiple Element Types**: Extract entire lists, tasks, headings, paragraphs, or blockquotes.
- **Advanced Filtering**: Use logical operators (`AND`, `OR`, `NOT`, parentheses) and property/frontmatter-based filters (`properties(...)`).
- **Result Shaping**: Structure output by using `groupBy`, `sort`, and `limit` options.
- **MOC Creation Wizard**: Easily generate your MOC queries via a visual interface.
- **Bake to Markdown**: Replace a dynamic `moc` block with the permanently rendered static markdown content.

## How to use

In any of your notes, add a code block with the language set to `moc` and provide a YAML-based configuration.

Here is an example:

<pre>
```moc
folder: Diary
element: List
filter: has_word("MOC")
recursive: true
```
</pre>

### Configuration Options

- **`folder`** *(required)*: The folder path within your vault to search for files. E.g., `Diary` or `Notes/Meetings`.
- **`element`** *(required)*: The type of element to extract. Can be set to `List`, `Task`, `Heading`, `Paragraph`, or `Blockquote`.
- **`filter`** *(required)*: The filter condition to apply to each element. See the **Advanced Filter Examples** section below for more details.
  - `has_word("word")` or `contains("text")` or `has_text("text")`: Matches elements containing the exact text.
  - `matches("regex")`: Matches elements using a regular expression.
  - `has_tag("#tag")`: Matches elements containing the specified tag.
  - `is_completed()`: Matches only completed tasks (when `element` is `Task`).
  - `is_incomplete()`: Matches only incomplete tasks (when `element` is `Task`).
- **`recursive`** *(optional)*: A boolean (`true` or `false`) that determines whether the search should include subfolders within the specified `folder`. If omitted, it defaults to `false`.
- **`groupBy`** *(optional)*: Group the results by a specific property. Supported values: `folder`, `cday` (creation day), `mday` (modification day), `tag`.
- **`sort`** *(optional)*: Sort the matched files. Specified as a space-separated string containing the field and direction: `<field> <direction>`.
  - Supported fields: `name`, `ctime` (creation time), `mtime` (modification time).
  - Supported directions: `asc`, `desc`. E.g., `name asc` or `ctime desc`.
- **`limit`** *(optional)*: A positive integer specifying the maximum number of files to process and extract from.

### Advanced Filter Examples

The plugin's filter language supports rich composition, including boolean logic (`AND`, `OR`, `NOT`), grouping with parentheses, and checking frontmatter variables.

- **Boolean Logic & Grouping**:
  `has_tag("#todo") AND (has_word("urgent") OR is_incomplete())`

- **Negation**:
  `has_tag("#project") AND NOT has_word("archived")`

- **Frontmatter/Properties**:
  Use `properties(key == value)` to filter notes by their YAML frontmatter before extracting elements.
  `properties(status == "active") AND has_tag("#meeting")`

### Dynamic Parameters

You can dynamically include the current note's parameters in the `folder` and `filter` options using the following variables:
- `{{this.filename}}`: Expands to the current note's name (without the `.md` extension).
- `{{this.folder}}`: Expands to the name of the folder containing the current note.
- `{{this.path}}`: Expands to the full path of the current note (without the `.md` extension).

For example, to list elements from the `Diary` folder that contain the current note's name:

<pre>
```moc
folder: Diary
element: List
filter: has_word("{{this.filename}}")
recursive: true
```
</pre>

## Grouping, Sorting, and Limiting

You can shape the structure and volume of your MOC output directly from the code block configuration.

- **Group results by their tags:**
  <pre>
  ```moc
  folder: Ideas
  element: Heading
  filter: has_word("feature")
  groupBy: tag
  ```
  </pre>

- **Sort results by creation time and limit to the 5 most recent files:**
  <pre>
  ```moc
  folder: Daily Notes
  element: Task
  filter: is_incomplete()
  sort: ctime desc
  limit: 5
  ```
  </pre>

## MOC Creation Wizard

If you don't want to write the YAML configuration by hand, the plugin includes a **MOC Creation Wizard**.

You can invoke the wizard by using the **"Create map of content block"** command from the Obsidian command palette, or by clicking the list icon in the left ribbon.

The wizard provides a visual form to select your target folder, element type, write your filters (with auto-completion), and apply optional result shaping (`groupBy`, `sort`, `limit`). When submitted, it will insert the proper `moc` code block at your cursor.

## Bake to Markdown

Dynamic `moc` blocks render queries on the fly. However, you might want to freeze the output at a specific point in time so it won't change if the source files are updated.

When a dynamic MOC is rendered in Reading mode, you will see a **"Bake"** button at the bottom of the block. Clicking this button will irreversibly transform the dynamic `moc` block and its generated contents into static markdown text directly inside your note.

This workflow is useful when you want to archive a query's results, share the text without requiring the plugin, or modify the generated output by hand.

## Result

The plugin will scan all markdown files in the specified `folder`. For any files containing elements that match your `filter`, it will dynamically render a section.

The rendered output includes:
1. A header with a link back to the source file where the elements were found.
2. The matching elements themselves.

> Note: The original `moc` code block is replaced in reading/preview mode with the dynamically generated content.

## Automation / Jules Workflow

This repository uses [Google Jules](https://github.com/features/jules) to automate implementation tasks based on GitHub issues. Tasks for Jules should be created using the dedicated [Jules Task issue template](.github/ISSUE_TEMPLATE/jules-task.yml). All Jules pull requests target the `Dev` branch. When no other Jules issue is actively being worked on, a dispatch workflow automatically processes the oldest queued task.

### Jules Configuration Files
- **`.github/ISSUE_TEMPLATE/jules-task.yml`**: Structured issue template for defining the goal, scope, and acceptance criteria for Jules tasks.
- **`.github/jules.md`**: Agent instructions defining the repository-specific workflow, scope discipline, pull request rules, and behaviors expected of Jules.
- **`.github/workflows/jules-dispatch.yml`**: Automation workflow that identifies the next queued issue and dispatches Jules to work on it.
- **`.github/workflows/jules-state-sync.yml`**: Automation workflow that syncs the issue's state (review, done, blocked) based on pull request events and comments.

### Issue Lifecycle & Labels
- **`status:todo`**: Task is queued and waiting for Jules to pick it up.
- **`status:in-progress`**: Jules is actively working on the task.
- **`status:review`**: Jules has opened a PR and is waiting for maintainer review.
- **`status:blocked`**: Jules encountered an issue and requires maintainer input.
- **`status:done`**: The PR is merged and the task is complete.

## Support

If you find this plugin helpful, consider supporting its development!

<a href="https://www.buymeacoffee.com/mkshp" target="_blank">
  <img
    src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=%E2%98%95&slug=mkshp&button_colour=5F7FFF&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"
    alt="Buy me a coffee"
    height="45"
  />
</a>

<br/>

<a href="https://github.com/sponsors/mkshp-dev" target="_blank">
  <img
    src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=github-sponsors&style=flat-square"
    alt="Sponsor mkshp-dev on GitHub"
    height="32"
  />
</a>
