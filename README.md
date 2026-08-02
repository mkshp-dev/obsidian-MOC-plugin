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


## Support

If you find this plugin helpful, consider supporting its development!

<a href="https://buymeacoffee.com/mkshp" target="_blank">
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
