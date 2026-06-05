# Releasing the Plugin

This document covers the full release process — first-time submission to the Obsidian community directory and all subsequent version updates.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `Dev` | Active development — all new features and fixes go here |
| `master` | Stable release branch — only receives merges from `Dev` via PR |

Tags are always created on `master`. The GitHub Actions workflow (`.github/workflows/release.yml`) triggers on any tag push and automatically builds the plugin and creates a draft GitHub Release.

---

## One-Time Setup (do this once)

### 1. Enable GitHub Actions write permissions

Go to your repo on GitHub:  
**Settings → Actions → General → Workflow permissions → Read and write permissions → Save**

This allows the workflow to create GitHub Releases on your behalf.

### 2. Merge the release workflow into master

The `release.yml` workflow lives in the `ci/add-release-workflow` branch (or has already been added to your repository). Ensure it is merged into `master` before attempting any release.

---

## First Release

### Step 1 — Ensure master has the release workflow

Confirm `.github/workflows/release.yml` is present on `master` (merged via PR as described above).

### Step 2 — Bump the version on Dev

Do this on `Dev` — it becomes the last commit before the release PR:

```bash
git checkout Dev
git pull origin Dev
npm version 1.0.0 --no-git-tag-version
git add manifest.json versions.json package.json
git commit -m "Release 1.0.0"
git push origin Dev
```

> `--no-git-tag-version` prevents npm from tagging automatically — you control the tag after the merge.  
> The `version-bump.mjs` script (wired to `npm version`) automatically keeps `manifest.json` and `versions.json` in sync.

### Step 3 — Open a PR from Dev → master and merge it

1. Go to your repo on GitHub.
2. Open a pull request from `Dev` → `master`.
3. Merge it.
4. Pull master locally so your local copy is up to date:

```bash
git checkout master
git pull origin master
```

### Step 4 — Create and push the release tag

The tag **must exactly match** the version string in `manifest.json`:

```bash
git tag -a 1.0.0 -m "1.0.0"
git push origin 1.0.0
```

This triggers the GitHub Actions workflow. Within a minute or two it will:
1. Run `npm install && npm run build`
2. Create a **draft** GitHub Release with `main.js`, `manifest.json`, and `styles.css` (if present) attached

### Step 5 — Publish the draft release

Go to your repo on GitHub → **Releases** → find the new draft → click the **pencil icon** → add release notes → click **Publish release**.

### Step 6 — Submit to the Obsidian Community Directory (first time only)

1. Go to [community.obsidian.md](https://community.obsidian.md) and sign in with your Obsidian account.
2. Link your GitHub account in your profile settings.
3. In the sidebar → **Plugins** → **New plugin**.
4. Enter your repo URL: `https://github.com/mkshp-dev/obsidian-MOC-plugin`
5. Agree to the Developer policies → click **Submit**.

Obsidian reads `manifest.json` from the HEAD of `master`, so keep the version there accurate. After the automated review passes, users can install the plugin directly from within Obsidian.

---

## Subsequent Updates

### Step 1 — Develop on Dev as normal

Commit and push all changes to the `Dev` branch.

### Step 2 — Bump the version on Dev

Do this on `Dev` — it becomes the last commit before the release PR:

```bash
git checkout Dev
git pull origin Dev
npm version 1.1.0 --no-git-tag-version
git add manifest.json versions.json package.json
git commit -m "Release 1.1.0"
git push origin Dev
```

Replace `1.1.0` with the new version following [semver](https://semver.org/) (`x.y.z`):
- `z` (patch) — bug fixes only
- `y` (minor) — new features, backwards compatible
- `x` (major) — breaking changes

### Step 3 — Open a PR from Dev → master and merge it

1. Go to your repo on GitHub.
2. Open a pull request from `Dev` → `master`.
3. Merge it.
4. Pull master locally so your local copy is up to date:

```bash
git checkout master
git pull origin master
```

### Step 4 — Tag and push

```bash
git tag -a 1.1.0 -m "1.1.0"
git push origin 1.1.0
```

GitHub Actions builds the plugin and creates a draft release automatically.

### Step 5 — Publish the draft release

Go to GitHub → **Releases** → edit the draft → add release notes → **Publish release**.

Users on Obsidian will be notified of the update automatically.

---

## Quick Reference

```bash
# 1. Bump version on Dev
git checkout Dev && git pull origin Dev
npm version <NEW_VERSION> --no-git-tag-version
git add manifest.json versions.json package.json
git commit -m "Release <NEW_VERSION>"
git push origin Dev

# 2. Open PR Dev → master on GitHub and merge it

# 3. Pull master and tag it locally
git checkout master && git pull origin master
git tag -a <NEW_VERSION> -m "<NEW_VERSION>"
git push origin <NEW_VERSION>

# 4. Go to GitHub Releases and publish the draft
```

## Files involved in a release

| File | Role |
|------|------|
| `manifest.json` | Plugin metadata; `version` field must match the git tag |
| `versions.json` | Maps each release version to minimum Obsidian app version |
| `package.json` | `version` field kept in sync by `npm version` |
| `version-bump.mjs` | Script run by `npm version` to update `manifest.json` and `versions.json` |
| `.github/workflows/release.yml` | CI workflow that builds and creates the GitHub Release on tag push |
| `main.js` | Built plugin bundle — uploaded as release asset |
| `styles.css` | Plugin styles — uploaded as release asset |
