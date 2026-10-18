# Releasing the Plugin

Releases are automated. You bump the version on `Dev` and push one commit with a specific message; GitHub Actions does the rest and leaves a **draft** release for you to publish.

## Branches

| Branch | Purpose |
|--------|---------|
| `Dev` | Active development — all features and fixes land here |
| `main` | Stable release branch — only ever receives automated merges from `Dev` |
| `gh-pages` | Published documentation site (managed by the docs workflow) |

Obsidian's community directory reads `manifest.json` from `main`, so the version there must always be the latest published release.

---

## Releasing a new version

### Step 1 — Make sure `Dev` is ready

- All work is committed and pushed to `Dev`.
- CI is green on the latest `Dev` push (lint, build, test).
- `CHANGELOG.md` has entries under `## In-progress`. **This section must not be empty** — it becomes the release notes, and the release fails if there is nothing there.
- Entries under `## In-progress` read in the order you want them published. Put headline features first.
- Preview the release notes exactly as they will be published with `npm run release-notes`. Keep them under 2,000 characters so they fit in a single Discord message; the workflow warns if they don't.

### Step 2 — Bump the version

```bash
git checkout Dev
git pull origin Dev
npm version 1.5.0 --no-git-tag-version
```

`--no-git-tag-version` stops npm from tagging — the workflow creates the tag later.

This runs `version-bump.mjs`, which:

1. writes the new version into `manifest.json`,
2. adds a `version → minAppVersion` entry to `versions.json`,
3. snapshots the current docs into `docs-site/versioned_docs/version-1.5.0`.

Check that step 3 actually happened — the docs snapshot is wrapped in a `try/catch`, so a failure there is logged but does **not** fail the bump:

```bash
ls docs-site/versioned_docs
```

Pick the version with [semver](https://semver.org/):

- `z` (patch) — bug fixes only
- `y` (minor) — new features, backwards compatible
- `x` (major) — breaking changes

### Step 3 — Commit and push

```bash
git add -A
git commit -m "Release 1.5.0"
git push origin Dev
```

> **The commit message is the trigger and it is matched strictly.**
> `Release 1.5.0` and `Release v1.5.0` work. `release 1.5.0`, `Release 1.5.0 - features` and anything else do not — the push is simply treated as a normal commit and no release happens.

The version in the message must match `manifest.json` and `package.json`, or the workflow fails the verification step.

### Step 4 — Watch the automation

Two workflows run in sequence. Open the **Actions** tab and confirm both:

**Release Trigger** (on push to `Dev`)
1. Confirms the commit message is a release.
2. Verifies the version matches `manifest.json` and `package.json`.
3. Opens a PR `Dev → main` and merges it.

**Finalize Release** (on push to `main`)
1. Skips everything if the tag already exists.
2. Runs `npm ci`, build, lint and test.
3. Generates a build provenance attestation for `main.js`, `manifest.json` and `styles.css`.
4. Builds the release notes from `## In-progress` in `CHANGELOG.md` with `release-notes.mjs` (see [Release notes](#release-notes)).
5. Creates and pushes the tag.
6. Creates a **draft** GitHub release with the three assets attached.
7. Rewrites `CHANGELOG.md` on `Dev`, moving the `## In-progress` entries under `## 1.5.0 - <date>` and leaving a fresh empty `## In-progress`, then commits as `chore: prepare changelog for next release`.

### Step 5 — Publish the draft

GitHub → **Releases** → open the draft → review the notes → **Publish release**.

Obsidian notifies users of the update automatically. Nothing needs submitting to the community directory after the first release.

### Step 6 — Announce on Discord

Open the published release, copy its notes, and paste them into the **#updates** channel on Obsidian's Discord. They are written to be posted as-is: a `## Maps of Content X.Y.Z` heading, the changelog entries, and links to the repository, documentation and community page at the bottom.

To regenerate the notes for a version that is already released, run:

```bash
node release-notes.mjs --version 1.5.2
```

### Step 7 — Sync locally

The workflow pushed a changelog commit to `Dev`, so pull before doing more work:

```bash
git pull origin Dev
```

---

## Beta releases (for BRAT testers)

A commit on `Dev` titled `Beta-Release X.Y.Z-beta.W` publishes a GitHub prerelease without touching `main`:

```bash
npm version 1.6.0-beta.0 --no-git-tag-version
git add -A
git commit -m "Beta-Release 1.6.0-beta.0"
git push origin Dev
```

Because the version contains a `-`, `version-bump.mjs` updates only `manifest.json` and deliberately skips `versions.json` and docs versioning, so betas leave no permanent artifacts behind.

Betas are invisible to ordinary users: Obsidian's updater and the community directory only read `manifest.json` on `main`, which a beta never modifies.

---

## Release notes

`release-notes.mjs` turns a section of `CHANGELOG.md` into release notes that serve as both the GitHub release body and the Discord announcement:

```markdown
## Maps of Content 1.5.2

- **Fix: …** — …

[Repository](<https://github.com/…>) · [Documentation](<https://docs.mkshp.dev/…>) · [Community page](<https://obsidian.md/plugins?id=maps-of-content>)
```

- The name and version come from `manifest.json`, and the documentation link from `url` and `baseUrl` in `docs-site/docusaurus.config.js`, so they never need updating by hand.
- The angle brackets inside each link stop Discord expanding it into a preview card. GitHub renders them as ordinary links.
- Discord rejects messages over 2,000 characters. Longer notes still publish, but the workflow run shows a warning.

| Command | Prints |
|---------|--------|
| `npm run release-notes` | Notes for `## In-progress`, i.e. the next release |
| `node release-notes.mjs --version 1.5.2` | Notes for an already-released version |
| `node release-notes.mjs --allow-empty` | A placeholder instead of failing when the section is empty (used for betas) |

---

## Workflows

| Workflow | Trigger | Does |
|----------|---------|------|
| `ci.yml` | PR to `Dev`, push to `Dev`, manual | Lint, build, test |
| `release-trigger.yml` | Push to `Dev` titled `Release X.Y.Z` | Verifies versions, opens and merges the PR to `main` |
| `release-finalize.yml` | Push to `main` | Builds, attests, tags, drafts the release, rewrites the changelog on `Dev` |
| `beta-release.yml` | Push to `Dev` titled `Beta-Release X.Y.Z-beta.W` | Builds, tags and publishes a prerelease; never touches `main` |
| `deploy-docs.yml` | Push to `Dev` touching `docs-site/**`, `CHANGELOG.md`, or itself | Builds and deploys the documentation site |

---

## Requirements

**`RELEASE_PAT` secret.** `release-trigger.yml` merges the PR into `main` using this token. A merge made with the default `GITHUB_TOKEN` will **not** trigger `release-finalize.yml` — GitHub deliberately prevents workflows from triggering other workflows — so without the PAT the release stops silently after the merge, with no tag and no draft.

**Workflow permissions.** Repo → **Settings → Actions → General → Workflow permissions → Read and write permissions**.

---

## Troubleshooting

**Nothing happened after pushing.** The commit message did not match. Check the **Release Trigger** run — it logs `Not a release commit. Skipping.` Fix by pushing a new commit with a correct message (an empty one is fine: `git commit --allow-empty -m "Release 1.5.0"`).

**Trigger ran but failed on "Verify versions".** `manifest.json` or `package.json` disagrees with the version in the commit message. Usually means `npm version` was not run, or was run for a different version.

**PR merged to `main` but no tag or draft appeared.** `release-finalize.yml` did not fire, which almost always means `RELEASE_PAT` is missing or expired. Re-run `Finalize Release` manually from the Actions tab once the secret is fixed.

**Release failed on "Build release notes".** `## In-progress` was empty. Add entries to `CHANGELOG.md` on `Dev` and re-run the workflow.

**`Finalize Release` was skipped entirely.** The tag already exists — the check job short-circuits to keep re-pushes to `main` idempotent. Delete the tag if you genuinely need to rebuild it.

---

## Files involved

| File | Role |
|------|------|
| `manifest.json` | Plugin metadata; `version` must match the tag, `minAppVersion` must be accurate |
| `versions.json` | Maps each release to its minimum Obsidian version |
| `package.json` | Kept in sync by `npm version`; verified by the trigger |
| `version-bump.mjs` | Run by `npm version`; updates the manifest, `versions.json` and docs versioning |
| `release-notes.mjs` | Builds the release notes from `CHANGELOG.md`, with the links footer for Discord |
| `CHANGELOG.md` | `## In-progress` becomes the release notes, then is rewritten under the version heading |
| `main.js`, `styles.css` | Built assets, attached to the release by CI (`main.js` is gitignored) |
