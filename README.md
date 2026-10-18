# Maps of Content

Dynamically generate **Map of Content (MOC)** indexes by extracting matching elements (lists, tasks, headings, paragraphs, blockquotes) from notes in your vault — powered by a simple code block.

[![Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22maps-of-content%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)](https://obsidian.md/plugins?id=maps-of-content)

[![Install in Obsidian](https://img.shields.io/badge/Install-Obsidian%20Community%20Plugins-7C3AED?logo=obsidian&logoColor=white)](https://obsidian.md/plugins?id=maps-of-content)

📖 **[Full documentation →](https://mkshp-dev.github.io/obsidian-MOC-plugin/)**

---

## Highlights

**Live, auto-updating indexes** — `moc` blocks re-render automatically when files in the watched folder change. No refreshing needed.

**Interactive tasks** — Tick a task checkbox in a rendered `moc` block and it updates in its source note, guarded against writing over newer edits.

**Jump to source** — Every matched block has a button that opens its source note at the exact line it came from.

**Powerful filter DSL** — Boolean logic (`AND`, `OR`, `NOT`), text matching, tag matching, regex, and frontmatter property comparisons with full numeric/date operator support (`>`, `<`, `>=`, `<=`, `!=`).

**Dates relative to now** — Filter with `{{startOfDay}}`, `{{now-24h}}`, `{{endOfWeek}}` and friends, as in `properties(due < {{startOfDay}})` for overdue items. Read dates from daily-note filenames with `file.day`, point at dated folders with `{{now:YYYY/MM}}`, and blocks move on to the new day by themselves.

**MOC Creation Wizard** — Generate `moc` blocks visually from the Command Palette. No YAML required. Date filters have presets such as **is today** and **is this week**, and the wizard checks the block before inserting it.

**Flexible output shaping** — Group by folder, tag, date, or any frontmatter property. Sort, and limit by notes scanned (`fileLimit`), total results (`blockLimit`) or results per note (`blocksPerFile`), with matching offsets for pagination.

**Templates** — Format each matched element using a reusable template note with `{{content}}`, `{{file}}`, `{{path}}`, `{{link}}` placeholders.

**Exclude options** — Skip specific folders or files even inside a recursive scan.

**Copy & Bake** — Copy rendered Markdown to clipboard, or permanently bake a dynamic block into static Markdown in-place.

**Create showcase** — Run **Maps of Content: Create showcase** from the Command Palette to generate a ready-to-explore demo folder covering every feature.

---

## Quick start

````markdown
```moc
folder: diary
element: List
filter: has_tag("#todo")
recursive: true
```
````

→ See the [full block reference](https://mkshp-dev.github.io/obsidian-MOC-plugin/) in the docs.

---

## Support

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
