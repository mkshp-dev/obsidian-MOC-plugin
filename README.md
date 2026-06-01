# Obsidian MOC Plugin

This plugin provides a dynamic way to extract list items from your Markdown files that match a specific word filter, automatically generating Map of Content (MOC) indexes in your vault.

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
- **`element`** *(required)*: The type of element to extract. Currently, this must be set to `List`.
- **`filter`** *(required)*: The filter condition to apply to each list item. Currently, the supported format is `has_word("word")`, where `"word"` is the text substring you want to match in the list item. Matches are case-sensitive.
- **`recursive`** *(optional)*: A boolean (`true` or `false`) that determines whether the search should include subfolders within the specified `folder`. If omitted, it defaults to `false`.

## Result

The plugin will scan all markdown files in the specified `folder`. For any files containing list items (e.g., lines starting with `-`, `*`, or `+`) that match your `filter`, it will dynamically render a section.

The rendered output includes:
1. A header with a link back to the source file where the list items were found.
2. The matching list items themselves, along with any nested sub-bullets they contain.

> Note: The original `moc` code block is replaced in reading/preview mode with the dynamically generated content.
