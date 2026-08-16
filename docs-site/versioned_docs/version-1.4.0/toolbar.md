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
