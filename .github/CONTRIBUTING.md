# Contributing to MOC Plugin

First off, thank you for considering contributing to the MOC Plugin! It's people like you that make it a great tool.

## Getting Started

### 1. Fork and Clone the Repository

```bash
git clone https://github.com/mkshp-dev/obsidian-moc-plugin.git
cd obsidian-moc-plugin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Plugin

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### 4. Test in Obsidian

1. Copy the plugin folder to your Obsidian vault's plugins directory:
   ```
   <vault>/.obsidian/plugins/obsidian-moc-plugin/
   ```
   Ensure the files `main.js`, `manifest.json`, and `styles.css` are present at the root of that folder.

2. In Obsidian:
   - Go to **Settings → Community plugins**.
   - Enable community plugins if you haven't already.
   - Reload/Enable the **MOC Plugin**.

## How to Contribute

### Reporting Bugs

Use the Bug Report template and include:
- Clear description of the bug.
- Steps to reproduce the bug.
- Expected vs. actual behavior.
- Environment details (OS, Obsidian version, plugin version).
- Console logs (toggle developer tools using `Ctrl+Shift+I` or `Cmd+Option+I` to check for errors).

### Requesting Features

Use the Feature Request template and provide:
- The problem you are trying to solve.
- Proposed solution.
- Use case examples.

### Contributing Code

1. **Check for existing issues** - Look for related issues or create one.
2. **Fork and branch** - Create a branch from `master` (e.g. `feat/description` or `fix/description`).
3. **Make changes** - Follow coding standards (see below).
4. **Test thoroughly** - Verify that your changes work under different scenarios.
5. **Submit PR** - Use the PR template and link related issues.

## Coding Standards

### TypeScript

- **Formatting:** Keep the code clean and structured.
- **Types:** Enable `"strict": true` (it is enabled in `tsconfig.json`). Avoid using `any` type where possible.
- **Imports:** Use absolute/relative imports correctly.
- **Lifecycle Management:** Any event listeners, DOM events, or child components MUST be registered via Obsidian's provided registers (`this.registerEvent`, `ctx.addChild`, etc.) so the plugin unloads cleanly without memory leaks.

### File Organization

```
src/
├── main.ts          # Entry point and lifecycles (onload, onunload)
├── settings.ts      # Settings interface and tab
├── moc.ts          # MOC code block post-processing and rendering logic
```

## Submitting Changes

### Branch Naming

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `perf/description` - Performance improvements
- `test/description` - Test additions

### Commit Messages

Follow conventional commits:

```
type(scope): brief description

Longer description if needed

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Examples:
- `feat(moc): support custom task elements`
- `fix(parser): handle empty lines in code block`
- `docs(readme): add config example`

---

**Thank you for contributing to MOC Plugin!** 🚀
