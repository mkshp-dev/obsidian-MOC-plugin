import { App, MarkdownRenderer, Component, MarkdownPostProcessorContext } from 'obsidian';

export interface MocConfig {
    folder?: string;
    element?: string;
    filter?: string;
    recursive?: boolean;
}

export async function processMocBlock(
    config: MocConfig,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
    app: App,
    sourcePath: string
) {
    if (!config.folder || typeof config.folder !== 'string') {
        el.createEl("div", { text: "Error: invalid or missing 'folder' in moc block.", cls: 'moc-error' });
        return;
    }

    if (config.element !== 'List') {
        el.createEl("div", { text: "Error: element must be list.", cls: 'moc-error' });
        return;
    }

    if (!config.filter || typeof config.filter !== 'string') {
        el.createEl("div", { text: "Error: invalid or missing 'filter' in moc block.", cls: 'moc-error' });
        return;
    }

    const filterMatch = config.filter.match(/^has_word\(\s*["']([^"']+)["']\s*\)$/);
    if (!filterMatch) {
        el.createEl("div", { text: `Error: unsupported filter format '${config.filter}'. Expected format: has_word("word").`, cls: 'moc-error' });
        return;
    }

    const wordToMatch = filterMatch[1];
    if (!wordToMatch) {
        return;
    }

    const isRecursive = config.recursive === true;

    // 1. Find all matching files
    const allFiles = app.vault.getMarkdownFiles();
    const targetFolder = config.folder.endsWith('/') ? config.folder : config.folder + '/';

    const matchedFiles = allFiles.filter(file => {
        // If the folder is exactly the target folder
        if (file.parent?.path === config.folder) {
            return true;
        }

        // If recursive, also match any subfolders
        if (isRecursive && file.path.startsWith(targetFolder)) {
            return true;
        }

        return false;
    });

    if (matchedFiles.length === 0) {
        el.createEl("div", { text: `No markdown files found in folder '${config.folder}'.`, cls: 'moc-empty' });
        return;
    }

    // 2. Extract list items
    const outputLines: string[] = [];

    for (const file of matchedFiles) {
        const fileCache = app.metadataCache.getFileCache(file);
        if (!fileCache || !fileCache.listItems || fileCache.listItems.length === 0) {
            continue;
        }

        const fileContent = await app.vault.cachedRead(file);
        const lines = fileContent.split(/\r?\n/);

        let hasMatchesInFile = false;
        const fileHeaderLines: string[] = [];
        fileHeaderLines.push(`### [[${file.path}|${file.basename}]]`);
        fileHeaderLines.push(""); // blank line before list

        const fileMatchLines: string[] = [];

        const listItems = fileCache.listItems;
        let skipUntilLine = -1;

        for (let i = 0; i < listItems.length; i++) {
            const item = listItems[i];
            if (!item) continue;

            // Skip items that are children of an already matched item
            if (item.position.start.line <= skipUntilLine) {
                continue;
            }

            const lineContent = lines[item.position.start.line];
            if (!lineContent) continue;

            if (lineContent.includes(wordToMatch)) {
                hasMatchesInFile = true;

                // Find all nested items under this one
                let lastChildLine = item.position.start.line;
                let j = i + 1;
                while (j < listItems.length) {
                    const nextItem = listItems[j];
                    if (!nextItem) {
                        j++;
                        continue;
                    }

                    if (nextItem.parent === item.position.start.line || (nextItem.parent !== undefined && nextItem.parent > item.position.start.line)) {
                        lastChildLine = nextItem.position.start.line;
                        j++;
                    } else {
                        break;
                    }
                }

                skipUntilLine = lastChildLine;

                // Extract all lines for this list item and its children
                const startLine = item.position.start.line;
                // Note: listItem position sometimes includes multiple lines if a single bullet point has newlines (soft breaks)
                const lastItemMatched = listItems[j - 1];
                const endLine = lastItemMatched ? lastItemMatched.position.end.line : startLine;

                // We need to re-adjust indentation to be top-level
                // Determine base indentation of the matched item
                const baseIndentMatch = lines[startLine]?.match(/^(\s*)/);
                const baseIndent = baseIndentMatch ? baseIndentMatch[1] : '';

                for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
                    let currentLine = lines[lineNum];
                    if (currentLine === undefined) continue;

                    if (baseIndent && currentLine.startsWith(baseIndent)) {
                        currentLine = currentLine.substring(baseIndent.length);
                    }
                    fileMatchLines.push(currentLine);
                }
            }
        }

        if (hasMatchesInFile) {
            outputLines.push(...fileHeaderLines);
            outputLines.push(...fileMatchLines);
            outputLines.push(""); // blank line after list
        }
    }

    // 3. Render output
    if (outputLines.length === 0) {
        el.createEl("div", { text: `No list items containing '${wordToMatch}' found in '${config.folder}'.`, cls: 'moc-empty' });
        return;
    }

    const markdownText = outputLines.join('\n');

    const container = el.createDiv();
    const component = new Component();
    component.load();
    await MarkdownRenderer.render(app, markdownText, container, sourcePath, component);
}
