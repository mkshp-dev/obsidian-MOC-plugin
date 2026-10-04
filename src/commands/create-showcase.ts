import { App, Notice, TFolder, TFile } from 'obsidian';

const SHOWCASE_FOLDER = 'MOC Showcase';

// ---------------------------------------------------------------------------
// Note content builders
// ---------------------------------------------------------------------------

const NOTES: { path: string; content: string }[] = [
    {
        path: `${SHOWCASE_FOLDER}/README.md`,
        content: `# MOC Showcase

Welcome to the **Maps of Content** plugin showcase!

This folder was created by the "Create showcase" command. Each note here
demonstrates a specific plugin capability so you can explore every feature
without writing a single line of YAML manually.

## Notes in this showcase

| Note | Feature demonstrated |
|------|---------------------|
| [[01 - Basic list extraction]] | \`folder\`, \`element\`, \`filter\` |
| [[02 - Tasks and completion filters]] | \`Task\` element, \`is_completed\`, \`is_incomplete\` |
| [[03 - Headings extraction]] | \`Heading\` element |
| [[04 - Paragraphs and blockquotes]] | \`Paragraph\`, \`Blockquote\` elements |
| [[05 - Advanced filters]] | \`AND\`, \`OR\`, \`NOT\`, \`properties()\`, comparison operators |
| [[06 - Grouping and sorting]] | \`groupBy\`, \`sort\`, \`showCount\` |
| [[07 - Limit offset and pagination]] | \`fileLimit\`, \`blockLimit\`, \`blocksPerFile\`, offsets |
| [[08 - Exclude folders and files]] | \`excludeFolder\`, \`excludeFile\` |
| [[09 - Template output formatting]] | \`template\` (template notes) |
| [[10 - Find and replace rules]] | \`applyFnR\`, settings rules |
| [[11 - Copy Bake and live refresh]] | Toolbar buttons, auto-refresh |
| [[12 - Separators and dynamic parameters]] | \`blockSeparator\`, \`noteSeparator\`, \`{{this.folder}}\` |
| [[13 - Interactive tasks]] | Ticking tasks in place, write-back safety |
| [[14 - Jump to source]] | Per-block jump-to-source buttons |
| [[15 - Renames and moves]] | Refresh on rename and move, template edits, missing folders |
`,
    },

    // -----------------------------------------------------------------------
    // Sample data notes
    // -----------------------------------------------------------------------
    {
        path: `${SHOWCASE_FOLDER}/data/Meeting Notes Alpha.md`,
        content: `---
project: Alpha
status: active
priority: 1
date: 2024-01-15
---

# Meeting Notes Alpha

## Action items

- Follow up with the design team #project
- Schedule a review session #meeting
- Update the roadmap document

## Decisions

> We agreed to use a modular approach for the next sprint. #decision

The team is aligned on the new direction.

- [x] Sent follow-up email
- [ ] Update documentation
- [ ] Notify stakeholders

`,
    },
    {
        path: `${SHOWCASE_FOLDER}/data/Meeting Notes Beta.md`,
        content: `---
project: Beta
status: active
priority: 2
date: 2024-02-10
---

# Meeting Notes Beta

## Action items

- Review the budget proposal #project
- Confirm vendor contracts #meeting
- Prepare Q2 report

## Decisions

> Approved the new vendor. Budget increase of 10%. #decision

All approvals are in place.

- [x] Sent contract for review
- [x] Budget approved
- [ ] Finalize Q2 report

`,
    },
    {
        path: `${SHOWCASE_FOLDER}/data/Meeting Notes Gamma.md`,
        content: `---
project: Gamma
status: archived
priority: 3
date: 2023-12-01
---

# Meeting Notes Gamma

## Action items

- Archive old datasets #project
- Document deprecation process #meeting

## Decisions

> Gamma project archived after successful handover. #decision

No further action required.

- [x] Datasets archived
- [x] Handover docs updated

`,
    },
    {
        path: `${SHOWCASE_FOLDER}/data/exclude-me/Excluded Note.md`,
        content: `---
project: Excluded
---

# Excluded Note

This note lives in a subfolder that is excluded in the showcase examples.

- This item should not appear in the MOC output
- Neither should this one

`,
    },

    // -----------------------------------------------------------------------
    // Rename lab (sandbox for note 15, safe to move and rename things in)
    // -----------------------------------------------------------------------
    {
        path: `${SHOWCASE_FOLDER}/rename-lab/inbox/Idea one.md`,
        content: `# Idea one

- Sketch a weekly review template #idea
- Try time-blocking on Mondays #idea
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/rename-lab/inbox/Idea two.md`,
        content: `# Idea two

- Collect reading notes in one place #idea
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/rename-lab/parking/Parked idea.md`,
        content: `# Parked idea

This note starts outside the watched \`inbox\` folder. Move it in and out to see
the blocks in [[15 - Renames and moves]] react.

- A parked idea waiting to be moved #idea
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/rename-lab/hosts/Alpha.md`,
        content: `# Alpha

This block reads from the folder named after **this note**, using
\`{{this.filename}}\`. Right now that is \`hosts/Alpha\`.

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/rename-lab/hosts/{{this.filename}}
element: List
filter: contains("item")
\`\`\`

**Try it:** rename this note to \`Beta\` while it is open. The block switches to the
\`hosts/Beta\` folder straight away, and **Copy** and **Bake** keep working.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/rename-lab/hosts/Alpha/Alpha items.md`,
        content: `# Alpha items

- First item from the Alpha folder
- Second item from the Alpha folder
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/rename-lab/hosts/Beta/Beta items.md`,
        content: `# Beta items

- Only item from the Beta folder
`,
    },

    // -----------------------------------------------------------------------
    // Template notes (used by the `template` option, see notes 09 and 15)
    // -----------------------------------------------------------------------
    {
        path: `${SHOWCASE_FOLDER}/templates/bullet-link.md`,
        content: `- {{content}} — {{link}}\n`,
    },
    {
        path: `${SHOWCASE_FOLDER}/templates/compact-table.md`,
        content: `| {{file}} | {{content}} |\n`,
    },
    {
        path: `${SHOWCASE_FOLDER}/templates/idea-suffix.md`,
        content: `{{content}} · {{file}}\n`,
    },

    // -----------------------------------------------------------------------
    // Showcase notes
    // -----------------------------------------------------------------------
    {
        path: `${SHOWCASE_FOLDER}/01 - Basic list extraction.md`,
        content: `# 01 — Basic list extraction

Extracts all heading sections that contain "Action items" from the data folder.

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Heading
filter: contains("Action items")
recursive: false
\`\`\`

**What to notice:**
- The \`folder\` key is relative to the vault root.
- \`element: Heading\` extracts the heading and all content below it until the next same-level heading.
- \`filter\` accepts any text filter — here \`contains()\` does a simple substring match.
- Hover over the block to reveal the **Copy** and **Bake** toolbar buttons.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/02 - Tasks and completion filters.md`,
        content: `# 02 — Tasks and completion filters

Use \`element: Task\` to extract only checkbox items. Combine with
\`is_completed()\` or \`is_incomplete()\` to filter by state.

### Incomplete tasks across all meeting notes

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
recursive: true
\`\`\`

### Completed tasks only

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_completed()
recursive: true
\`\`\`

**What to notice:**
- \`is_completed()\` and \`is_incomplete()\` are only meaningful for \`Task\` (and \`List\`) elements.
- The wizard hides these filters when a non-task element is selected.
- The checkboxes above are **live** — tick one and it updates in its source note. See [[13 - Interactive tasks]].
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/03 - Headings extraction.md`,
        content: `# 03 — Headings extraction

\`element: Heading\` extracts entire heading sections (the heading line plus all
content until the next heading of equal or higher level).

### Extract all "Decisions" sections

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Heading
filter: contains("Decisions")
recursive: true
\`\`\`

**What to notice:**
- The extracted block includes the heading AND the body content below it.
- Use \`groupBy: folder\` to organise output when scanning recursively.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/04 - Paragraphs and blockquotes.md`,
        content: `# 04 — Paragraphs and blockquotes

### Paragraphs mentioning "aligned"

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Paragraph
filter: contains("aligned")
recursive: true
\`\`\`

### Blockquotes tagged #decision

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Blockquote
filter: has_tag("#decision")
recursive: true
\`\`\`

**What to notice:**
- \`Paragraph\` captures continuous text blocks (no bullets, no headings).
- \`Blockquote\` targets \`> ...\` blocks.
- \`has_tag()\` matches exact tags and subtags — e.g., \`has_tag("#project")\` also matches \`#project/subtag\`.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/05 - Advanced filters.md`,
        content: `# 05 — Advanced filters

### Boolean logic: AND / OR / NOT

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: List
filter: contains("review") OR contains("report")
recursive: true
\`\`\`

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete() AND NOT contains("budget")
recursive: true
\`\`\`

### Property (frontmatter) equality

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: List
filter: properties(status == "active")
recursive: true
\`\`\`

### Numeric comparison operators

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: List
filter: properties(priority <= 2)
recursive: true
\`\`\`

### Date comparison

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Heading
filter: properties(date >= "2024-01-01")
recursive: true
\`\`\`

### Regex matching

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: List
filter: matches("/vendor|contract/i")
recursive: true
\`\`\`

**What to notice:**
- \`properties()\` filters operate on YAML frontmatter before reading file contents — very efficient.
- Comparison operators \`>\`, \`<\`, \`>=\`, \`<=\`, \`!=\` work on numbers and ISO date strings.
- \`matches()\` accepts plain strings or \`/pattern/flags\` regex syntax.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/06 - Grouping and sorting.md`,
        content: `# 06 — Grouping and sorting

### Group by frontmatter property

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: List
filter: contains("Action items")
groupBy: property(project)
recursive: true
showCount: true
\`\`\`

### Group by folder

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
groupBy: folder
recursive: true
showCount: true
\`\`\`

### Sort by name ascending

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Heading
filter: contains("Decisions")
sort: name asc
recursive: true
\`\`\`

### Sort by creation time, newest first

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: List
filter: contains("Action items")
sort: ctime desc
recursive: true
\`\`\`

**What to notice:**
- \`groupBy\` options: \`folder\`, \`tag\`, \`cday\`, \`mday\`, \`property(key)\`.
- \`showCount: true\` appends result counts globally and per group heading.
- \`sort\` fields: \`name\`, \`ctime\`, \`mtime\` — each with \`asc\` or \`desc\`.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/07 - Limit offset and pagination.md`,
        content: `# 07 — Limits, offsets and pagination

Limits come in two units, and mixing them up is the most common source of
surprise. **Files** are the notes that get scanned. **Results** are the individual
matched elements that come out.

## Limiting files

\`fileLimit\` caps how many notes are scanned. It is the only limit that saves work,
because notes beyond it are never read at all.

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Heading
filter: contains("Action items")
sort: name asc
fileLimit: 2
recursive: true
showCount: true
\`\`\`

\`fileOffset\` skips notes before that, so the two together page through notes:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Heading
filter: contains("Action items")
sort: name asc
fileOffset: 1
fileLimit: 1
recursive: true
showCount: true
\`\`\`

## Limiting results

\`blockLimit\` caps how many matched elements are shown in total, regardless of how
many notes they came from. This is usually what you actually want:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
recursive: true
blockLimit: 3
showCount: true
\`\`\`

Note the count at the bottom: it reads \`3 of N results\`, so a limited view never
hides how much is really outstanding.

\`blockOffset\` is the matching page control — this is the *next* page of the block
above:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
recursive: true
blockOffset: 3
blockLimit: 3
showCount: true
\`\`\`

## Keeping one note from hogging the list

A \`blockLimit\` on its own can be filled entirely by a single busy note, hiding every
other note from view. \`blocksPerFile\` caps the contribution of any one note, so the
result stays a map rather than an excerpt:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
recursive: true
blocksPerFile: 1
blockLimit: 5
showCount: true
\`\`\`

**What to notice:**
- \`fileLimit\`/\`fileOffset\` count **notes**; \`blockLimit\`/\`blockOffset\` count **results**.
- \`blocksPerFile\` keeps the first matches of each note, in document order.
- Combine any of them with \`sort\` for stable, predictable pages.
- An offset of \`0\` is the same as omitting it.
- \`limit\` and \`offset\` still work as the old names for \`fileLimit\` and \`fileOffset\`.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/08 - Exclude folders and files.md`,
        content: `# 08 — Exclude folders and files

The \`excludeFolder\` and \`excludeFile\` options let you skip specific paths even
when \`recursive: true\` would normally include them.

### Exclude a subfolder

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: List
filter: contains("Action items")
recursive: true
excludeFolder: ${SHOWCASE_FOLDER}/data/exclude-me
\`\`\`

### Exclude a specific file

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: List
filter: contains("Action items")
recursive: true
excludeFile: ${SHOWCASE_FOLDER}/data/Meeting Notes Gamma
\`\`\`

### Exclude multiple (array syntax)

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: List
filter: contains("Action items")
recursive: true
excludeFolder: ["${SHOWCASE_FOLDER}/data/exclude-me"]
excludeFile: ["${SHOWCASE_FOLDER}/data/Meeting Notes Gamma"]
\`\`\`

**What to notice:**
- Paths are relative to vault root, without leading slash.
- You can pass a single string or a JSON array for multiple exclusions.
- \`excludeFile\` accepts paths with or without the \`.md\` extension.
- Edits to excluded notes don't trigger a refresh, since they can't change the output.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/09 - Template output formatting.md`,
        content: `# 09 — Template output formatting

The \`template\` option lets you customise how each matched element is rendered.
Unlike other options, \`template\` does **not** take inline text — it takes the
**name of a template note**, and that note's content is the format string,
using \`{{placeholder}}\` syntax.

Available placeholders (used inside the template note):

| Placeholder | Value |
|-------------|-------|
| \`{{content}}\` | The matched element text |
| \`{{file}}\` | Source file basename (no extension) |
| \`{{path}}\` | Source file path (relative to vault root) |
| \`{{link}}\` | Wiki-link to the source file |

## Set up the template folder first

Before the blocks below work, point the plugin at this showcase's template notes:

1. Open **Settings → Maps of Content**.
2. Set **Template folder** to \`${SHOWCASE_FOLDER}/templates\`.

Two template notes were already created for you:
- [[bullet-link]] — contains \`- {{content}} — {{link}}\`
- [[compact-table]] — contains \`| {{file}} | {{content}} |\`

### Render each match as a linked bullet

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Blockquote
filter: has_tag("#decision")
recursive: true
template: bullet-link
\`\`\`

### Compact table-style output

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Paragraph
filter: contains("approved") OR contains("archived")
recursive: true
template: compact-table
\`\`\`

**What to notice:**
- \`template\` references a note by name, resolved inside the configured **Template folder**.
- \`template\` is applied after \`applyFnR\` find-and-replace rules.
- Multi-line elements are passed as a single string to the template.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/10 - Find and replace rules.md`,
        content: `# 10 — Find and replace rules

The \`applyFnR\` option applies named find-and-replace rules to each matched
element before rendering. Rules are defined once in **Settings → Maps of Content**
and can be reused across multiple MOC blocks.

## Set up a rule first

Before the blocks below work, you need to define a rule in settings:

1. Open **Settings → Maps of Content**.
2. Under **Find and replace**, select **+ Add rule** and fill in:
   - **Rule name**: \`strip-hashes\`
   - **Find pattern**: \`/^#{1,6}\\s+/gm\`
   - **Replace with**: *(leave empty)*
3. Select **Add rule** to save it.

## Apply a single rule

This block extracts "Decisions" headings and strips the leading \`##\` from output:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Heading
filter: contains("Decisions")
recursive: true
applyFnR: strip-hashes
\`\`\`

## Chain multiple rules

You can apply rules in sequence using array syntax. Add a second rule first:

1. **Rule name**: \`add-prefix\`
2. **Find pattern**: \`^(.+)\`
3. **Replace with**: \`→ $1\`

Then chain both:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Heading
filter: contains("Decisions")
recursive: true
applyFnR: ["strip-hashes", "add-prefix"]
\`\`\`

**What to notice:**
- Rules are applied in the order listed — output of rule 1 is the input of rule 2.
- Patterns starting and ending with \`/\` are treated as regex (e.g., \`/^#+ /gm\`).
- Literal strings replace all occurrences (equivalent to a global replace).
- The wizard lets you add and reorder rules visually under the "Find and replace" section.
- Once a rule rewrites the matched text, any task checkboxes in the output become **disabled** — the plugin can no longer map a checkbox back to its source line. See [[13 - Interactive tasks]].
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/11 - Copy Bake and live refresh.md`,
        content: `# 11 — Copy, Bake and live refresh

This note demonstrates the toolbar buttons and the live auto-refresh feature.

## Toolbar buttons

Hover over any MOC block below to reveal two buttons:

- **Copy** — Copies the rendered Markdown to your clipboard (does not modify the note).
- **Bake** — Permanently replaces the dynamic \`moc\` code block with the static
  rendered Markdown directly in this note. Great for archiving a snapshot.

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
recursive: true
showCount: true
\`\`\`

## Live auto-refresh

MOC blocks **automatically re-render** whenever a Markdown file in the watched
folder is created, modified, deleted, renamed, or moved — no need to close and
reopen the note. Renames and moves have their own walkthrough in
[[15 - Renames and moves]].

**Try it:**
1. Keep this note open in Obsidian.
2. Open \`${SHOWCASE_FOLDER}/data/Meeting Notes Alpha.md\`.
3. Add a new task: \`- [ ] A brand new task\`.
4. Save. Watch the block above update within half a second.

> The refresh is debounced (500 ms) to avoid flickering on rapid saves.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/12 - Separators and dynamic parameters.md`,
        content: `# 12 — Separators and dynamic parameters

## Block & note separators

\`blockSeparator\` controls the spacing between multiple matched blocks from the
**same** note. \`noteSeparator\` controls the spacing between blocks from
**different** notes.

### Block separator: divider between blocks in the same note

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
recursive: true
blockSeparator: divider
\`\`\`

### Note separator: no extra spacing between notes

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
recursive: true
noteSeparator: none
\`\`\`

**What to notice:**
- \`blockSeparator\` values: \`none\` (default), \`divider\` (\`---\`), \`newline\` (blank line).
- \`noteSeparator\` values: \`newline\` (default), \`divider\` (\`---\`), \`none\`.
- "Meeting Notes Alpha" has two incomplete tasks, so it's the easiest note to see \`blockSeparator\` on.

## Dynamic parameters

Dynamic parameters let a \`moc\` block adapt to the note it's placed in — handy
when reusing the same block template across many notes (e.g. one MOC note per
project folder).

- \`{{this.filename}}\` → current note's name (without \`.md\`)
- \`{{this.folder}}\` → name of the folder containing the current note
- \`{{this.path}}\` → current note's full path (without \`.md\`)

This note lives directly inside \`${SHOWCASE_FOLDER}\`, so \`{{this.folder}}\`
expands to \`${SHOWCASE_FOLDER}\` — the block below resolves to the same
\`data\` folder used throughout this showcase:

\`\`\`moc
folder: {{this.folder}}/data
element: List
filter: contains("Action items")
recursive: true
\`\`\`

**What to notice:**
- Dynamic parameters work inside both \`folder\` and \`filter\`.
- They're expanded relative to whichever note the \`moc\` block lives in, not the showcase notes specifically.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/13 - Interactive tasks.md`,
        content: `# 13 — Interactive tasks

Task checkboxes inside a rendered MOC block are **live**. Ticking one writes the
change straight back to the note the task came from, so you can work through an
aggregated list without opening each source note.

### Everything still open, across all meeting notes

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
recursive: true
showCount: true
\`\`\`

**Try it:**
1. Tick any checkbox above.
2. Open the source note named in the heading — the matching \`- [ ]\` is now \`- [x]\`.
3. Come back here. Because the filter is \`is_incomplete()\` and blocks auto-refresh,
   the task you completed has dropped out of the list on its own.

### Tasks found inside other elements

Interactive tasks are not limited to \`element: Task\`. The block below extracts whole
\`Decisions\` sections, and the tasks that happen to live inside them are clickable too:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Heading
filter: contains("Decisions")
recursive: true
\`\`\`

## Write-back is guarded

Before writing, the plugin checks that the target line still reads exactly as it did
when the block was rendered. If the note changed in the meantime — an edit in another
pane, or a sync from another device — the write is skipped, you get a notice, and the
block refreshes to show the current state.

**Try it:**
1. Open \`${SHOWCASE_FOLDER}/data/Meeting Notes Alpha.md\` in a second pane.
2. Edit the text of \`- [ ] Update documentation\` (for example, add a word).
3. Without saving focus back here, tick that task in a block above *before* it refreshes.
4. You get "the source line has changed" instead of a silent overwrite.

A stale view can never clobber newer content.

## When tasks are read-only

Checkboxes are shown but **disabled** when a block uses \`template\` or \`applyFnR\`.
Both options rewrite matched text before rendering, which breaks the link between a
rendered checkbox and its source line:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
recursive: true
applyFnR: strip-hashes
\`\`\`

> This needs the \`strip-hashes\` rule from [[10 - Find and replace rules]]. Once the rule
> exists and actually rewrites something, the checkboxes above grey out — hover one to see
> why. Until then nothing is rewritten, so they stay clickable: the read-only state tracks
> whether the text really changed, not just whether the option is present.

**What to notice:**
- Nested subtasks, ordered-list tasks (\`1. [ ]\`), and tasks inside blockquotes and
  callouts all work.
- Custom states such as \`- [/]\` are treated as checked and become unchecked on the
  first click.
- Toggling from a MOC block is a normal note edit — undo in the source note works as usual.
- To switch the whole feature off, go to **Settings → Maps of Content → Tasks** and
  turn off **Interactive tasks**.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/14 - Jump to source.md`,
        content: `# 14 — Jump to source

A MOC block gathers content from all over your vault. Jump to source is how you get
back: every matched block carries its own button that opens the note it came from,
scrolled to the exact line the block starts at.

### Decisions from every meeting note

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Blockquote
filter: has_tag("#decision")
recursive: true
\`\`\`

**Try it:**
1. Hover any block above — a small arrow button appears in its top-right corner.
2. Click it. The source note opens with the cursor on that blockquote.
3. Go back and hold **Ctrl** (**Cmd** on macOS) while clicking instead — the note
   opens in a new pane, leaving this one in place.

### It is per block, not per note

The block below pulls several tasks out of the same handful of notes. Each matched
task has its own button pointing at its own line, so you land on the task you clicked
rather than at the top of the file:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/data
element: Task
filter: is_incomplete()
recursive: true
\`\`\`

**What to notice:**
- The heading above each group is still an ordinary \`[[wikilink]]\` to the whole note —
  the jump button is the line-precise counterpart to it.
- Jump buttons appear on every element type, not just tasks.
- Jumping never modifies anything; it is purely navigation. Compare with
  [[13 - Interactive tasks]], which does write back.
- To hide the buttons, go to **Settings → Maps of Content → Tasks** and turn off
  **Jump to source**.
`,
    },
    {
        path: `${SHOWCASE_FOLDER}/15 - Renames and moves.md`,
        content: `# 15 — Renames and moves

Blocks stay current when notes are renamed or moved, not just when they're edited.
Everything here works on the sandbox folder \`${SHOWCASE_FOLDER}/rename-lab\`, so
feel free to drag things around. Running **Create showcase** again resets it.

## Notes moving in, out and around

This block watches \`rename-lab/inbox\`:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/rename-lab/inbox
element: List
filter: has_tag("#idea")
showCount: true
\`\`\`

**Try it** — keep this note open with the file explorer visible:
1. **Move in:** drag [[Parked idea]] from \`rename-lab/parking\` into \`rename-lab/inbox\`.
   It appears in the block above and the count goes up.
2. **Move out:** drag it back to \`parking\`. It disappears again.
3. **Rename:** rename [[Idea one]] to something else. The note heading in the block
   updates, and its link still opens the note.

## Template edits

This block formats each idea with the [[idea-suffix]] template, which lives in
\`${SHOWCASE_FOLDER}/templates\` — outside the watched folder.

> Needs **Settings → Maps of Content → Template folder** set to
> \`${SHOWCASE_FOLDER}/templates\`, as in [[09 - Template output formatting]].

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/rename-lab/inbox
element: List
filter: has_tag("#idea")
template: idea-suffix
\`\`\`

**Try it:** open [[idea-suffix]] and change \`· {{file}}\` to \`· from {{link}}\`.
The block above picks up the new format as soon as you stop typing.

## A folder that no longer exists

When the watched folder is renamed or moved, the block says so rather than claiming
the folder is empty. This block points at a folder that was never created:

\`\`\`moc
folder: ${SHOWCASE_FOLDER}/rename-lab/folder-that-was-renamed
element: List
filter: has_tag("#idea")
\`\`\`

**Try it:** rename the \`rename-lab/inbox\` folder. The first two blocks in this note
switch to the same error. Rename it back to \`inbox\` and they recover on their own.
Blocks are not rewritten to follow the folder — update \`folder:\` to the new name.

## Renaming the note that holds the block

Blocks using \`{{this.filename}}\`, \`{{this.folder}}\` or \`{{this.path}}\` follow
the note they're in when it's renamed. Open [[Alpha]] and follow the steps there:
renaming it to \`Beta\` makes its block switch from the \`hosts/Alpha\` folder to
\`hosts/Beta\`.

**What to notice:**
- A move is caught from both ends: a note entering the watched folder and a note
  leaving it both refresh the block.
- Renaming a folder counts as a move for every note inside it.
- Refreshes are debounced, so moving many notes at once causes a single re-render.
- Edits inside an \`excludeFolder\` or to an \`excludeFile\` don't trigger a refresh.
`,
    },
];

// ---------------------------------------------------------------------------
// Command implementation
// ---------------------------------------------------------------------------

async function ensureFolder(app: App, path: string): Promise<void> {
    const existing = app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFolder) return;
    await app.vault.createFolder(path);
}

export async function createShowcase(app: App): Promise<void> {
    const notice = new Notice('Creating showcase…', 0);

    try {
        // Collect all unique folder paths needed
        const folderPaths = new Set<string>();
        for (const note of NOTES) {
            const parts = note.path.split('/');
            for (let i = 1; i < parts.length; i++) {
                folderPaths.add(parts.slice(0, i).join('/'));
            }
        }

        // Create folders in order (shallow first)
        for (const folderPath of Array.from(folderPaths).sort()) {
            await ensureFolder(app, folderPath);
        }

        // Create or overwrite notes
        for (const note of NOTES) {
            const existing = app.vault.getAbstractFileByPath(note.path);
            if (existing instanceof TFile) {
                await app.vault.modify(existing, note.content);
            } else {
                await app.vault.create(note.path, note.content);
            }
        }

        notice.hide();
        new Notice(`✅ MOC Showcase created in "${SHOWCASE_FOLDER}"`);

        // Open the README
        const readmeFile = app.vault.getAbstractFileByPath(`${SHOWCASE_FOLDER}/README.md`);
        if (readmeFile instanceof TFile) {
            await app.workspace.getLeaf().openFile(readmeFile);
        }
    } catch (err) {
        notice.hide();
        const message = err instanceof Error ? err.message : String(err);
        new Notice(`❌ Failed to create showcase: ${message}`);
        console.error('[MOC Showcase]', err);
    }
}
