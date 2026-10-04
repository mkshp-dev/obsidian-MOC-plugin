// Builds release notes from CHANGELOG.md that can be pasted unchanged into
// the #updates channel on Obsidian's Discord, as well as used as the GitHub
// release body.
//
//   node release-notes.mjs                  notes for `## In-progress` (what CI releases)
//   node release-notes.mjs --version 1.5.2  notes for an already-released section
//   node release-notes.mjs --allow-empty    print a placeholder instead of failing (betas)
//
// Writes the notes to stdout. Exits 1 if the section is missing or empty.

import { readFileSync } from "fs";

// Discord rejects messages above this length for accounts without Nitro.
const DISCORD_LIMIT = 2000;
const FALLBACK_REPOSITORY = "mkshp-dev/obsidian-MOC-plugin";

function parseArgs(argv) {
    const args = { version: null, allowEmpty: false };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === "--version") args.version = argv[++i];
        else if (argv[i] === "--allow-empty") args.allowEmpty = true;
        else throw new Error(`Unknown argument '${argv[i]}'.`);
    }
    return args;
}

/** Returns the body of the `## <heading>` section, or null if there is no such section. */
function extractSection(changelog, heading) {
    const lines = changelog.split(/\r?\n/);
    // Released headings carry a date (`## 1.5.2 - 2026-10-04`), so match on the first word.
    const start = lines.findIndex(line => line.startsWith("## ") && line.slice(3).split(/\s+/)[0] === heading);
    if (start === -1) return null;

    const body = [];
    for (const line of lines.slice(start + 1)) {
        if (line.startsWith("## ")) break;
        body.push(line);
    }
    return body.join("\n").trim();
}

/** Reads the published docs URL from the Docusaurus config, so a domain change only happens in one place. */
function readDocsUrl() {
    const config = readFileSync("docs-site/docusaurus.config.js", "utf8");
    const url = config.match(/^\s*url:\s*["']([^"']+)["']/m)?.[1];
    const baseUrl = config.match(/^\s*baseUrl:\s*["']([^"']+)["']/m)?.[1];
    if (!url || !baseUrl) throw new Error("Could not read url/baseUrl from docs-site/docusaurus.config.js.");
    return url.replace(/\/+$/, "") + baseUrl;
}

const args = parseArgs(process.argv.slice(2));
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const version = args.version ?? manifest.version;
const changelog = readFileSync("CHANGELOG.md", "utf8");

let entries = extractSection(changelog, args.version ?? "In-progress");
if (!entries) {
    if (!args.allowEmpty) {
        const section = args.version ? `## ${args.version}` : "## In-progress";
        console.error(`No changelog entries under '${section}' in CHANGELOG.md.`);
        process.exit(1);
    }
    entries = "_Beta build — no changelog entries yet. See commit history for details._";
}

const repository = process.env.GITHUB_REPOSITORY || FALLBACK_REPOSITORY;
// Angle brackets stop Discord unfurling each link into an embed; GitHub renders them as ordinary links.
const links = [
    `[Repository](<https://github.com/${repository}>)`,
    `[Documentation](<${readDocsUrl()}>)`,
    `[Community page](<https://obsidian.md/plugins?id=${manifest.id}>)`
].join(" · ");

const notes = `## ${manifest.name} ${version}\n\n${entries}\n\n${links}\n`;

if (notes.length > DISCORD_LIMIT) {
    // `::warning::` surfaces as an annotation on the workflow run; locally it is just a line on stderr.
    console.error(`::warning::Release notes are ${notes.length} characters, over Discord's ${DISCORD_LIMIT}-character limit. Shorten them or split the post.`);
}

process.stdout.write(notes);
