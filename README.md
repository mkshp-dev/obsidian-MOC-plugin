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
