import { App, MarkdownRenderer, MarkdownPostProcessorContext, MarkdownRenderChild, Notice, TFile } from 'obsidian';

export type FilterType = 'has_word' | 'contains' | 'has_text' | 'matches' | 'has_tag' | 'is_completed' | 'is_incomplete';

export interface ParsedFilter {
    type: FilterType;
    value?: string;
    regex?: RegExp;
}

export function parseFilter(filterString: string): ParsedFilter | null {
    const stringMatchPattern = /^(has_word|contains|has_text|matches|has_tag)\(\s*["'](.*?)["']\s*\)$/;
    const boolPattern = /^(is_completed|is_incomplete)\(\s*\)$/;

    const strMatch = filterString.match(stringMatchPattern);
    if (strMatch) {
        const type = strMatch[1] as FilterType;
        const value = strMatch[2];
        if (type === 'matches') {
            try {
                return { type, value, regex: new RegExp(value as string) };
            } catch {
                return null;
            }
        }
        return { type, value };
    }

    const boolMatch = filterString.match(boolPattern);
    if (boolMatch) {
        return { type: boolMatch[1] as FilterType };
    }

    return null;
}

export function evaluateFilter(text: string, filter: ParsedFilter, isCompletedTask?: boolean): boolean {
    switch (filter.type) {
        case 'has_word':
        case 'contains':
        case 'has_text':
            return filter.value !== undefined ? text.includes(filter.value) : false;
        case 'matches':
            return filter.regex !== undefined ? filter.regex.test(text) : false;
        case 'has_tag':
            return filter.value !== undefined ? text.includes(filter.value) : false;
        case 'is_completed':
            return isCompletedTask === true;
        case 'is_incomplete':
            return isCompletedTask === false;
        default:
            return false;
    }
}


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

    const validElements = ['List', 'Task', 'Heading', 'Paragraph', 'Blockquote'];
    if (!validElements.includes(config.element as string)) {
        el.createEl("div", { text: `Error: element must be one of: ${validElements.join(', ')}.`, cls: 'moc-error' });
        return;
    }

    if (!config.filter || typeof config.filter !== 'string') {
        el.createEl("div", { text: "Error: invalid or missing 'filter' in moc block.", cls: 'moc-error' });
        return;
    }

    const parsedFilter = parseFilter(config.filter);
    if (!parsedFilter) {
        el.createEl("div", { text: `Error: unsupported or invalid filter format '${config.filter}'.`, cls: 'moc-error' });
        return;
    }

    const folderPath = config.folder.trim().replace(/^\/+|\/+$/g, '');
    const isRecursive = config.recursive === true;

    // 1. Find all matching files
    const allFiles = app.vault.getMarkdownFiles();

    const matchedFiles = allFiles.filter(file => {
        const parentPath = file.parent ? file.parent.path : '';
        const normalizedParent = parentPath.replace(/^\/+|\/+$/g, '');

        if (normalizedParent === folderPath) {
            return true;
        }

        if (isRecursive) {
            if (folderPath === '') {
                return true;
            }
            if (normalizedParent.startsWith(folderPath + '/')) {
                return true;
            }
        }

        return false;
    });

    if (matchedFiles.length === 0) {
        el.createEl("div", { text: `No markdown files found in folder '${config.folder}'.`, cls: 'moc-empty' });
        return;
    }

    // 2. Extract elements
    const outputLines: string[] = [];

    for (const file of matchedFiles) {
        const fileCache = app.metadataCache.getFileCache(file);
        if (!fileCache) continue;

        const fileContent = await app.vault.cachedRead(file);
        const lines = fileContent.split(/\r?\n/);

        let hasMatchesInFile = false;
        const fileHeaderLines: string[] = [];
        fileHeaderLines.push(`### [[${file.path}|${file.basename}]]`);
        fileHeaderLines.push("");

        const fileMatchLines: string[] = [];

        if (config.element === 'List' || config.element === 'Task') {
            if (!fileCache.listItems || fileCache.listItems.length === 0) continue;

            const listItems = fileCache.listItems;
            let skipUntilLine = -1;

            for (let i = 0; i < listItems.length; i++) {
                const item = listItems[i];
                if (!item) continue;

                if (config.element === 'Task' && item.task === undefined) continue;

                if (item.position.start.line <= skipUntilLine) continue;

                const lineContent = lines[item.position.start.line];
                if (!lineContent) continue;

                if (evaluateFilter(lineContent, parsedFilter, item.task !== undefined ? item.task !== ' ' : undefined)) {
                    hasMatchesInFile = true;

                    let lastChildLine = item.position.start.line;
                    let j = i + 1;
                    while (j < listItems.length) {
                        const nextItem = listItems[j];
                        if (!nextItem) { j++; continue; }

                        if (nextItem.parent === item.position.start.line || (nextItem.parent !== undefined && nextItem.parent > item.position.start.line)) {
                            lastChildLine = nextItem.position.start.line;
                            j++;
                        } else {
                            break;
                        }
                    }

                    skipUntilLine = lastChildLine;

                    const startLine = item.position.start.line;
                    const lastItemMatched = listItems[j - 1];
                    const endLine = lastItemMatched ? lastItemMatched.position.end.line : startLine;

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
        } else if (config.element === 'Heading') {
            if (!fileCache.headings || fileCache.headings.length === 0) continue;

            const headings = fileCache.headings;
            let skipUntilLine = -1;

            for (let i = 0; i < headings.length; i++) {
                const heading = headings[i];
                if (!heading) continue;
                if (heading.position.start.line <= skipUntilLine) continue;

                const lineContent = lines[heading.position.start.line];
                if (!lineContent) continue;

                if (evaluateFilter(heading.heading, parsedFilter)) {
                    hasMatchesInFile = true;

                    const startLine = heading.position.start.line;
                    let endLine = lines.length - 1;

                    // Find the next heading of same or higher level (lower number)
                    for (let j = i + 1; j < headings.length; j++) {
                        const nextHeading = headings[j];
                        if (nextHeading && nextHeading.level <= heading.level) {
                            // If there is a next heading of same or higher level, end extraction right before it
                            endLine = nextHeading.position.start.line - 1;
                            break;
                        }
                    }

                    skipUntilLine = endLine;

                    for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
                        if (lines[lineNum] !== undefined) {
                            fileMatchLines.push(lines[lineNum] as string);
                        }
                    }
                }
            }
        } else if (config.element === 'Paragraph' || config.element === 'Blockquote') {
            if (!fileCache.sections || fileCache.sections.length === 0) continue;

            const targetType = config.element.toLowerCase(); // 'paragraph' or 'blockquote'

            for (const section of fileCache.sections) {
                if (section.type !== targetType) continue;

                const startLine = section.position.start.line;
                const endLine = section.position.end.line;

                // Get the full text of the section to evaluate the filter
                const sectionLines = [];
                for (let i = startLine; i <= endLine; i++) {
                    if (lines[i] !== undefined) {
                        sectionLines.push(lines[i]);
                    }
                }
                const sectionText = sectionLines.join('\n');

                if (evaluateFilter(sectionText, parsedFilter)) {
                    hasMatchesInFile = true;
                    fileMatchLines.push(...(sectionLines as string[]));
                }
            }
        }

        if (hasMatchesInFile) {
            outputLines.push(...fileHeaderLines);
            outputLines.push(...fileMatchLines);
            outputLines.push("");
        }
    }

    // 3. Render output
    if (outputLines.length === 0) {
        el.createEl("div", { text: `No elements matching filter found in '${config.folder}'.`, cls: 'moc-empty' });
        return;
    }


    const markdownText = outputLines.join('\n');

    const wrapper = el.createDiv({ cls: 'moc-wrapper' });

    const bakeButton = wrapper.createEl('button', {
        text: 'Bake',
        cls: 'moc-bake-button',
        title: 'Bake dynamic block to static Markdown'
    });

    const container = wrapper.createDiv({ cls: 'moc-container' });
    const childComponent = new MarkdownRenderChild(container);
    ctx.addChild(childComponent);

    bakeButton.onClickEvent(async (e) => {
        e.preventDefault();
        const sectionInfo = ctx.getSectionInfo(el);
        if (!sectionInfo) {
            new Notice("Could not determine section to bake");
            return;
        }

        const file = app.vault.getAbstractFileByPath(sourcePath);
        if (file instanceof TFile) {
            await app.vault.process(file, (data) => {
                const lines = data.split(/\r?\n/);
                lines.splice(sectionInfo.lineStart, sectionInfo.lineEnd - sectionInfo.lineStart + 1, markdownText);
                return lines.join('\n');
            });
            new Notice("Block baked");
        } else {
            new Notice("Source file not found");
        }
    });

    await MarkdownRenderer.render(app, markdownText, container, sourcePath, childComponent);
}
