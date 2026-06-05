# Maps of Content

This plugin provides a dynamic way to extract elements (like lists, tasks, headings, paragraphs, or blockquotes) from your Markdown files that match a specific word filter, automatically generating Map of Content (MOC) indexes in your vault.

It accomplishes this by adding a new `moc` markdown code block processor.

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
- **`filter`** *(required)*: The filter condition to apply to each element. Supported formats include:
  - `has_word("word")` or `contains("text")` or `has_text("text")`: Matches elements containing the exact text.
  - `matches("regex")`: Matches elements using a regular expression.
  - `has_tag("#tag")`: Matches elements containing the specified tag.
  - `is_completed()`: Matches only completed tasks (when `element` is `Task`).
  - `is_incomplete()`: Matches only incomplete tasks (when `element` is `Task`).
- **`recursive`** *(optional)*: A boolean (`true` or `false`) that determines whether the search should include subfolders within the specified `folder`. If omitted, it defaults to `false`.

## Result

The plugin will scan all markdown files in the specified `folder`. For any files containing elements that match your `filter`, it will dynamically render a section.

The rendered output includes:
1. A header with a link back to the source file where the elements were found.
2. The matching elements themselves.

> Note: The original `moc` code block is replaced in reading/preview mode with the dynamically generated content.
