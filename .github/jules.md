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
````

All of these should pass before the task is considered ready for review.

### Verification rules

* Do not claim a command passed unless it was actually run successfully during the current task.
* If a command fails, do **not** present the task as complete.
* If there is an unrelated or flaky failure, explain that clearly in the issue comment or blocked comment.

---

## CHANGELOG.md rules

If the issue is completed, update `CHANGELOG.md`.

### Required behavior

* Add **exactly one bullet point** under the `## In-progress` section.
* Use the changelog text provided in the issue if one is provided.
* If the issue includes a “Changelog entry” section, use that text with only minimal edits for grammar/consistency.
* Keep the changelog entry concise and user-facing.

### Forbidden behavior

* Do not rename the `In-progress` section.
* Do not create a new release section.
* Do not rewrite, reorder, or clean up unrelated changelog entries.
* Do not edit older release notes unless the issue explicitly asks for it.

---

## Pull request rules

When the implementation is complete and verification passes:

1. Open a PR targeting **`Dev`**
2. Link the issue in the PR description
3. Use the repository PR template if one exists
4. Keep the PR focused on the issue scope only

### PR description should include

* a concise summary of what changed
* confirmation that the required verification commands were run
* the linked issue number

---

## Required issue comment on completion

After opening the PR, add a comment on the issue summarizing the result.

The comment should include:

* a short summary of the implemented changes
* whether `npm run lint` passed
* whether `npm run build` passed
* the PR link

Keep it concise but specific.

---

## Blocked behavior

If you cannot complete the task, do **not** silently stop.
Leave a structured comment on the issue using the following format:

## Blocked

### What I tried

* ...

### Where it failed

* ...

### What I need from the maintainer

* ...

### Current artifacts

* Branch: ...
* PR: ... (if any)
* Last successful verification step: ...

Use a blocked comment when, for example:

* the issue is ambiguous or missing expected behavior details
* the codebase does not support the requested change cleanly and a design decision is needed
* required commands fail for reasons you cannot confidently fix within the issue scope
* the issue requires assets, credentials, examples, or maintainer input

When blocked:

* do not continue onto another issue
* do not create speculative large refactors just to “make progress”

---

## Things Jules should not do by default

Unless the issue explicitly asks for it, do **not**:

* modify release workflows
* bump plugin versions
* edit `manifest.json` or `versions.json` for release/versioning purposes
* change GitHub Actions unrelated to the issue
* rewrite changelog history
* merge PRs
* close issues
* change repository labels / queue state as part of task orchestration
* start work on any additional issue

---

## Implementation quality bar

Prefer:

* minimal diffs
* preserving existing patterns in the repository
* localized, easy-to-review changes
* clear naming and maintainable code
* comments only where they genuinely help understanding

Avoid:

* broad rewrites
* cleanup-only changes unrelated to the issue
* introducing new dependencies unless clearly required by the issue
* speculative changes outside the acceptance criteria

---

## If there is uncertainty

If the issue and repository state do not clearly support a safe implementation path:

1. stop
2. explain what is unclear
3. leave a blocked issue comment
4. wait for maintainer guidance

Do not hide uncertainty behind a large speculative PR.
