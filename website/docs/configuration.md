---
sidebar_position: 2
---

# Configuration

The MOC Plugin is configurable via **Settings → MOC Plugin**.

## Available settings

| Setting | Default | Description |
|---|---|---|
| `maxDepth` | `3` | How many levels deep to traverse links when building a MOC |
| `excludeFolders` | `[]` | Folders to skip during MOC generation |
| `showOrphans` | `false` | Include notes with no incoming or outgoing links |
| `autoRefresh` | `true` | Rebuild the MOC automatically when the vault changes |

## Excluding folders

Add folder paths (relative to the vault root) to the **Exclude folders** list in settings. For example:

```
Templates
Archive/Old
```

## Keyboard shortcuts

You can assign custom hotkeys to any MOC command via **Settings → Hotkeys**. Search for `MOC` to filter the relevant commands.
