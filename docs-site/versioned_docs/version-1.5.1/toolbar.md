---
sidebar_position: 5
---

# Toolbar

Every rendered MOC block has an interactive toolbar that appears when you hover over it. The toolbar sits in the top-right corner of the block and provides two actions: **Copy** and **Bake**.

---

## Copy as Markdown

The **Copy** button copies the current rendered Markdown output of the MOC block to your clipboard without modifying the note.

This is useful when you want to:
- Paste MOC results into another note, document, or external tool.
- Share a snapshot of query results without permanently replacing the dynamic block.
- Quickly inspect the raw Markdown that the block generates.

> **Note**: The copied text is the same Markdown that would be produced by Bake — the formatted content with all filters, grouping, and templates applied.

---

## Bake to Markdown

The **Bake** button permanently replaces the dynamic `moc` code block with its rendered static Markdown equivalent, written directly into the note source.

### How it works

1. Hover over a rendered MOC block.
2. Click the **Bake** button that appears in the top-right corner.
3. The plugin replaces the `moc` code block with the compiled Markdown in-place.

> [!WARNING]
> Baking is a destructive action. Once baked, the content will no longer automatically update when you modify other notes in your vault. If you need to regenerate the block, you will have to recreate the `moc` query block.

### When to bake

**Sharing and exporting** — MOC blocks rely on this plugin to render. If you export your notes to HTML, PDF, or share them with people who don't have the plugin (e.g. via Obsidian Publish or Git), the `moc` block will appear as a raw code block. Baking converts it to standard Markdown so it displays correctly anywhere.

**Weekly / monthly summaries** — If you use MOC blocks to pull all tasks or headings created during a specific week (using `groupBy: cday`), baking lets you freeze that snapshot in time.

**Performance optimisation** — If you have a large vault with hundreds of files, rendering many complex recursive MOC blocks on startup can slow down note loading. Baking long-term, finalised MOCs reduces processing overhead.

---

## Live Auto-refresh

MOC blocks **automatically re-render** whenever a Markdown file in the watched folder is created, modified, or deleted. You do not need to close and reopen the note.

The refresh is **debounced by 500 ms** to avoid excessive re-renders during rapid consecutive saves.

The watched folder is determined by the `folder` and `recursive` settings of each individual block. Only file changes within the relevant folder (and subfolders, if `recursive: true`) trigger a refresh.

---

## Interactive tasks

Task checkboxes inside a rendered MOC block are **live**. Ticking one writes the change straight back to the note the task came from, so you can work through an aggregated task list without opening each source note.

```moc
folder: Projects
element: Task
filter: is_incomplete()
recursive: true
```

Click a checkbox in the block above and the matching `- [ ]` becomes `- [x]` in its original note. Because the block also auto-refreshes on file changes, a task filtered by `is_incomplete()` disappears from the list moments after you complete it.

This works for tasks anywhere in the output, including tasks that appear inside an extracted `Heading` or `Blockquote` block, nested subtasks, ordered-list tasks (`1. [ ]`), and tasks inside callouts.

### Safety

Before writing, the plugin checks that the target line still reads exactly as it did when the block was rendered. If the note changed in the meantime — an edit in another pane, or a sync from another device — the write is skipped, you get a notice, and the block refreshes to show the current state. A stale view can never overwrite newer content.

### When tasks are read-only

Checkboxes are shown but disabled when `template` or `applyFnR` actually rewrites the matched text. Rewriting can add or remove checkboxes, which breaks the link between a rendered checkbox and its source line.

This is based on whether the text really changed, not merely on the option being present. An `applyFnR` naming a rule that does not exist, or a rule whose pattern matches nothing, leaves the output untouched — so the tasks stay clickable. Remove the option if you need tasks to be editable in a block that does transform its output.

### Turning it off

Interactive tasks are enabled by default. To disable them, go to **Settings → Maps of Content → Tasks** and turn off **Interactive tasks**. Checkboxes then render exactly as they did before, with no write-back.

---

## Jump to source

Every matched block carries its own **jump-to-source** button, revealed in the block's top-right corner when you hover it. Clicking it opens the source note scrolled to the exact line the block starts at — not just the top of the file.

Hold `Ctrl` (`Cmd` on macOS) while clicking to open the source in a new pane instead of the current one, the same as any other link in Obsidian.

This is per *block*, not per file. If one note contributed five matched tasks, each of the five has its own button pointing at its own line.

### Turning it off

Jump buttons are enabled by default. To hide them, go to **Settings → Maps of Content → Tasks** and turn off **Jump to source**.
