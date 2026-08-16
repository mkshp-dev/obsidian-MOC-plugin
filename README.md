# Maps of Content

Dynamically generate **Map of Content (MOC)** indexes by extracting matching elements (lists, tasks, headings, paragraphs, blockquotes) from notes in your vault — powered by a simple code block.

📖 **[Full documentation →](https://mkshp-dev.github.io/obsidian-MOC-plugin/)**

---

## Highlights

**Live, auto-updating indexes** — `moc` blocks re-render automatically when files in the watched folder change. No refreshing needed.

**Powerful filter DSL** — Boolean logic (`AND`, `OR`, `NOT`), text matching, tag matching, regex, and frontmatter property comparisons with full numeric/date operator support (`>`, `<`, `>=`, `<=`, `!=`).

**MOC Creation Wizard** — Generate `moc` blocks visually from the Command Palette. No YAML required.

**Flexible output shaping** — Group by folder, tag, date, or any frontmatter property. Sort, limit, paginate with `offset`, and count results with `showCount`.

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
