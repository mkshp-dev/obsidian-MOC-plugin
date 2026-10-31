# Maps of Content

Your tasks, decisions and highlights from every note, gathered on one live page. Add a `moc` code block, pick a folder, an element (tasks, lists, headings, paragraphs or quotes) and a filter, and the index keeps itself up to date.

📖 **[Full documentation →](https://docs.mkshp.dev/obsidian-MOC-plugin/)**

![A "This week" dashboard listing open tasks from four project notes. A task is ticked and leaves the list, then the jump button opens its source note.](https://raw.githubusercontent.com/mkshp-dev/obsidian-MOC-plugin/main/docs-site/static/img/screens/this-week.gif)

---

## Highlights

**Live, auto-updating indexes** — `moc` blocks re-render automatically when files in the watched folder change. No refreshing needed.

**Interactive tasks** — Tick a task checkbox in a rendered `moc` block and it updates in its source note, guarded against writing over newer edits.

![Split view: ticking a task on the dashboard checks it in the project note, and a task typed in the note appears on the dashboard](https://raw.githubusercontent.com/mkshp-dev/obsidian-MOC-plugin/main/docs-site/static/img/screens/tick-it-here.gif)

**Jump to source** — Every matched block has a button that opens its source note at the exact line it came from.

**Powerful filter DSL** — Boolean logic (`AND`, `OR`, `NOT`), text matching, tag matching, regex, and frontmatter property comparisons with full numeric/date operator support (`>`, `<`, `>=`, `<=`, `!=`).

**Dates relative to now** — Filter with `{{startOfDay}}`, `{{now-24h}}`, `{{endOfWeek}}` and friends, as in `properties(due < {{startOfDay}})` for overdue items. Read dates from daily-note filenames with `file.day`, point at dated folders with `{{now:YYYY/MM}}`, and blocks move on to the new day by themselves.

![An Overdue dashboard with a second block for tasks due in the next 7 days](https://raw.githubusercontent.com/mkshp-dev/obsidian-MOC-plugin/main/docs-site/static/img/screens/overdue.png)

**MOC Creation Wizard** — Generate `moc` blocks visually from the Command Palette. No YAML required. Date filters have presets such as **is today** and **is this week**, and the wizard checks the block before inserting it.

![The wizard building a block of tasks due in the next 7 days, then the rendered result](https://raw.githubusercontent.com/mkshp-dev/obsidian-MOC-plugin/main/docs-site/static/img/screens/wizard.gif)

**Flexible output shaping** — Group by folder, tag, date, or any frontmatter property. Sort, and limit by notes scanned (`fileLimit`), total results (`blockLimit`) or results per note (`blocksPerFile`), with matching offsets for pagination.

**Templates** — Format each matched element using a reusable template note with `{{content}}`, `{{file}}`, `{{path}}`, `{{link}}` placeholders.

**Exclude options** — Skip specific folders or files even inside a recursive scan.

**Copy & Bake** — Copy rendered Markdown to clipboard, or permanently bake a dynamic block into static Markdown in-place.

**Create showcase** — Run **Maps of Content: Create showcase** from the Command Palette to generate a ready-to-explore demo folder covering every feature, plus a `Use cases` folder with five ready-made dashboards (This week, Overdue, Decisions log, Reading highlights, Ideas inbox).

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

→ See the [full block reference](https://docs.mkshp.dev/obsidian-MOC-plugin/) in the docs.

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
