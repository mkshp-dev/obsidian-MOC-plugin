---
sidebar_position: 1
slug: /
---

# Introduction

Welcome to the **Obsidian MOC Plugin** documentation.

## What is it?

The Obsidian MOC Plugin is a smart **Map of Content** generator for [Obsidian](https://obsidian.md). It automatically organizes your notes into structured, navigable maps so you can explore your knowledge graph with ease.

## Features

- **Interactive MOC Creation Wizard**: Build complex query blocks visually without manually writing YAML.
- **Dynamic Element Extraction**: Extract specific elements like **Lists**, **Tasks**, **Headings**, **Paragraphs**, or **Blockquotes** from markdown notes.
- **Advanced Filtering**: Match elements by exact word, text patterns, tags, task completion status, regular expressions, or frontmatter properties.
- **Hierarchical Grouping**: Group matching elements dynamically by **folder**, **creation date (cday)**, **modification date (mday)**, or **tag**.
- **Sorting & Limiting**: Sort scanned files by filename, creation date, or modification date, and limit the maximum number of processed notes.
- **Bake to Markdown**: Instantly convert dynamic blocks into static markdown notes directly inside the editor.

## Installation

### From the Community Plugin browser

1. Open Obsidian and go to **Settings → Community plugins**.
2. Select **Browse** and search for `Maps of Content`.
3. Select **Install**, then **Enable**.

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/mkshp-dev/obsidian-MOC-plugin/releases).
2. Copy the files to your vault's plugin directory: `<Vault>/.obsidian/plugins/obsidian-MOC-plugin/`.
3. Reload Obsidian and enable the plugin under **Settings → Community plugins**.

## Getting Started

The easiest way to generate your first Map of Content is to use the interactive wizard:

1. Click the **Create map of content block** icon (a list icon) in the ribbon on the left side of Obsidian, or open the command palette (`Ctrl/Cmd + P`) and run the command **Create map of content block**.
2. Configure your search directory, target element, and filters in the modal.
3. Click **Insert block** to generate the dynamic `moc` code block at your current cursor position.

