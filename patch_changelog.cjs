const fs = require('fs');

const changelogPath = 'CHANGELOG.md';
const content = fs.readFileSync(changelogPath, 'utf8');

const newBullet = "- **Feature: Live auto-refresh of MOC blocks** — MOC blocks will now auto-refresh when any markdown file in the configured folder is created, modified, or deleted without the need to close and reopen the note.\n";

const inProgressRegex = /## In-progress\n\n/;

const updatedContent = content.replace(inProgressRegex, "## In-progress\n\n" + newBullet);

fs.writeFileSync(changelogPath, updatedContent, 'utf8');
