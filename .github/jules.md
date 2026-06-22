# AGENTS.md

This repository uses an issue-driven workflow for Google Jules.

Jules should behave as an implementation agent for a **specific GitHub issue**.
Jules is **not** responsible for queue management, issue selection, or release management unless the issue explicitly asks for it.

---

## Task source

Jules will be invoked for a specific GitHub issue by repository automation.

When invoked:

* treat the invoked issue as the **only** task to work on
* do not search for additional issues
* do not decide which issue should be worked on next
* do not start unrelated queued work
* do not change issue workflow state unless the issue explicitly asks for it or the repository automation requires it

The issue body is the primary specification for the task.
If the issue includes acceptance criteria, constraints, or a changelog entry, follow those closely.

---

## Branch rules

### Base branch

* All Jules work in this repository should be based on the **`Dev`** branch.
* Any branch created for the task should be created from **`Dev`**.
* Any PR created for the task must target **`Dev`**.
* Do not open PRs to `main`.

### Branch naming

When creating a working branch, use a descriptive name derived from the issue number and task, for example:

* `jules/123-fix-grouped-rendering`
* `jules/145-add-filter-setting`

---

## Scope discipline

When working on an issue:

* Only implement the work described in that issue.
* Keep changes minimal, targeted, and relevant to the requested task.
* Do not perform unrelated refactors.
* Do not change architecture, file layout, naming, or module boundaries unless the issue explicitly requires it.
* Do not modify unrelated rendering logic, parsing behavior, filter behavior, grouping logic, wizard behavior, or settings unless it is necessary for the requested fix/feature.
* Preserve existing repository conventions and style unless the issue explicitly asks for a change.

If the issue is underspecified or ambiguous, do **not** guess aggressively.
Instead, stop and leave a blocked comment explaining what clarification is needed.

---

## Repository-specific expectations

This is an Obsidian plugin repository for dynamically generating Maps of Content (MOCs) by extracting and rendering matching elements from notes in the vault.

Be careful about:

* Obsidian plugin compatibility
* preserving existing MOC rendering behavior outside the issue scope
* preserving existing extraction / filter / query behavior unless the issue explicitly changes it
* avoiding regressions in grouping, sorting, limiting, and bake-to-markdown behavior
* avoiding regressions in the MOC creation wizard and settings UX
* unnecessary changes to plugin metadata, manifests, release automation, or packaging

Prefer targeted fixes over broad rewrites.

---

## Required verification before opening a PR

Before opening a PR, run the following commands from the repository root:

```bash
npm ci
npm run lint
npm run build
