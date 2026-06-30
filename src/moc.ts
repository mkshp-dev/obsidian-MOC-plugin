import { App, MarkdownRenderer, MarkdownPostProcessorContext, MarkdownRenderChild, moment, Notice, TFile } from 'obsidian';
import { MOCPluginSettings } from './settings';

export type FilterType = 'has_word' | 'contains' | 'has_text' | 'matches' | 'has_tag' | 'is_completed' | 'is_incomplete' | 'properties';

export type FilterNodeType = 'AND' | 'OR' | 'NOT' | 'CONDITION';

export interface ASTNode {
    type: FilterNodeType;
    left?: ASTNode;
    right?: ASTNode;
    expr?: ASTNode;
    condition?: ParsedFilter;
}



export interface ParsedFilter {
    type: FilterType;
    value?: string;
    regex?: RegExp;
    propKey?: string;
    propValue?: unknown;
}


function tokenizeFilter(input: string): string[] | null {
    const tokenRegex = /\s*(AND\b|OR\b|NOT\b|\(|\)|properties\(\s*[a-zA-Z0-9_-]+\s*==\s*(?:["'].*?["']|[^"\s)]+)\s*\)|(?:has_word|contains|has_text|matches|has_tag)\(\s*["'].*?["']\s*\)|(?:is_completed|is_incomplete)\(\s*\))\s*/iy;
    let lastIndex = 0;
    const tokens: string[] = [];
    tokenRegex.lastIndex = 0;

    while (lastIndex < input.length) {
        tokenRegex.lastIndex = lastIndex;
        const match = tokenRegex.exec(input);
        if (!match) {
            return null; // Syntax error
        }
        tokens.push(match[1] as string);
        lastIndex = tokenRegex.lastIndex;
    }
    return tokens;
}

class FilterParser {
    tokens: string[];
    pos: number = 0;

    constructor(tokens: string[]) {
        this.tokens = tokens;
    }

    parse(): ASTNode | null {
        if (!this.tokens || this.tokens.length === 0) return null;
        const expr = this.parseOr();
        if (this.pos < this.tokens.length) {
            return null; // Leftover tokens
        }
        return expr;
    }

    parseOr(): ASTNode | null {
        let left = this.parseAnd();
        if (!left) return null;
        while (this.pos < this.tokens.length && this.tokens[this.pos] === 'OR') {
            this.pos++;
            const right = this.parseAnd();
            if (!right) return null;
            left = { type: 'OR', left, right };
        }
        return left;
    }

    parseAnd(): ASTNode | null {
        let left = this.parseNot();
        if (!left) return null;
        while (this.pos < this.tokens.length && this.tokens[this.pos] === 'AND') {
            this.pos++;
            const right = this.parseNot();
            if (!right) return null;
            left = { type: 'AND', left, right };
        }
        return left;
    }

    parseNot(): ASTNode | null {
        if (this.pos < this.tokens.length && this.tokens[this.pos] === 'NOT') {
            this.pos++;
            const expr = this.parsePrimary();
            if (!expr) return null;
            return { type: 'NOT', expr };
        }
        return this.parsePrimary();
    }

    parsePrimary(): ASTNode | null {
        if (this.pos >= this.tokens.length) return null;
        const token = this.tokens[this.pos] as string;

        if (token === '(') {
            this.pos++;
            const expr = this.parseOr();
            if (!expr) return null;
            if (this.pos >= this.tokens.length || this.tokens[this.pos] !== ')') {
                return null; // Missing closing parenthesis
            }
            this.pos++; // consume ')'
            return expr;
        }

        if (token === 'AND' || token === 'OR' || token === 'NOT' || token === ')') {
            return null; // Unexpected token
        }
        this.pos++;

        const condition = parsePrimitiveFilter(token);
        if (!condition) return null;
        return { type: 'CONDITION', condition };
    }
}

export function parsePrimitiveFilter(filterString: string): ParsedFilter | null {

    const propertiesPattern = /^properties\(\s*([a-zA-Z0-9_-]+)\s*==\s*(?:["'](.*?)["']|([^"\s)]+))\s*\)$/;
    const propMatch = filterString.match(propertiesPattern);
    if (propMatch) {
        return {
            type: 'properties',
            propKey: propMatch[1],
            propValue: propMatch[2] !== undefined ? propMatch[2] : propMatch[3]
        };
    }

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

export function parseFilter(filterString: string): ASTNode | null {
    const tokens = tokenizeFilter(filterString);
    if (!tokens) return null;
    const parser = new FilterParser(tokens);
    return parser.parse();
}

export function evaluatePrimitiveFilter(text: string, filter: ParsedFilter, isCompletedTask?: boolean): boolean {
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
        case 'properties':
            return true; // Already filtered at the file level
        default:
            return false;
    }
}


export function evaluateFrontmatter(frontmatter: Record<string, unknown> | null | undefined, node: ASTNode): boolean | null {
    if (node.type === 'AND') {
        const left = evaluateFrontmatter(frontmatter, node.left!);
        const right = evaluateFrontmatter(frontmatter, node.right!);
        if (left === false || right === false) return false;
        if (left === true && right === true) return true;
        return null; // Could not fully determine at file level
    } else if (node.type === 'OR') {
        const left = evaluateFrontmatter(frontmatter, node.left!);
        const right = evaluateFrontmatter(frontmatter, node.right!);
        if (left === true || right === true) return true;
        if (left === false && right === false) return false;
        return null;
    } else if (node.type === 'NOT') {
        const expr = evaluateFrontmatter(frontmatter, node.expr!);
        if (expr === true) return false;
        if (expr === false) return true;
        return null;
    } else if (node.type === 'CONDITION') {
        const condition = node.condition!;
        if (condition.type === 'properties') {
            if (!frontmatter) return false;
            return frontmatter[condition.propKey as string] == condition.propValue;
        }
        return null; // Not a property condition, cannot evaluate at file level
    }
    return null;
}

export function evaluateFilter(text: string, node: ASTNode, isCompletedTask?: boolean): boolean {
    if (node.type === 'AND') {
        return evaluateFilter(text, node.left!, isCompletedTask) && evaluateFilter(text, node.right!, isCompletedTask);
    } else if (node.type === 'OR') {
        return evaluateFilter(text, node.left!, isCompletedTask) || evaluateFilter(text, node.right!, isCompletedTask);
    } else if (node.type === 'NOT') {
        return !evaluateFilter(text, node.expr!, isCompletedTask);
    } else if (node.type === 'CONDITION') {
        return evaluatePrimitiveFilter(text, node.condition!, isCompletedTask);
    }
    return false;
}




function extractTags(text: string): string[] {
    const tags = new Set<string>();
    const tagRegex = /(?:^|\s)(#[^\s#]+)/g;
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
        if (match[1]) {
            tags.add(match[1]);
        }
    }
    return Array.from(tags);
}

export interface MatchedBlock {
    file: TFile;
    lines: string[];
    tags: string[];
}

export function applyFindReplace(text: string, find?: string, replace?: string): string {
    if (!find) return text;
    const replacement = replace ?? "";

    // Check if it is a regex: starts with '/' and ends with '/' followed by optional flags
    const regexMatch = find.match(/^\/(.*)\/([gimsuy]*)$/);
    if (regexMatch) {
        try {
            const [, pattern, flags] = regexMatch;
            const finalFlags = flags && flags.includes('g') ? flags : (flags || '') + 'g';
            const regex = new RegExp(pattern!, finalFlags);
            return text.replace(regex, replacement);
        } catch {
            // Fall back to literal string replacement if regex is invalid
            void 0;
        }
    }

    // Literal string replacement using split/join to avoid TS compilation issues with replaceAll
    return text.split(find).join(replacement);
}

export interface MocConfig {
    folder?: string;
    element?: string;
    filter?: string;
    recursive?: boolean;
    groupBy?: string;
    sort?: string;
    limit?: number;
    applyFnR?: string | string[];
}

export async function processMocBlock(
    config: MocConfig,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
    app: App,
    sourcePath: string,
    settings: MOCPluginSettings
) {
    const sourceFile = app.vault.getAbstractFileByPath(sourcePath);

    if (!config.folder || typeof config.folder !== 'string') {
        el.createEl("div", { text: "Error: invalid or missing 'folder' in moc block.", cls: 'moc-error' });
        return;
    }

    let expandedFolder = config.folder;
    if (sourceFile && sourceFile instanceof TFile) {
        expandedFolder = expandedFolder.replace(/\{\{this\.filename\}\}/g, sourceFile.basename);
        const folderName = sourceFile.parent ? sourceFile.parent.name : '';
        expandedFolder = expandedFolder.replace(/\{\{this\.folder\}\}/g, folderName);
        const pathNoExt = sourceFile.path.replace(/\.md$/, '');
        expandedFolder = expandedFolder.replace(/\{\{this\.path\}\}/g, pathNoExt);
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

    let expandedFilter = config.filter;
    if (sourceFile && sourceFile instanceof TFile) {
        expandedFilter = expandedFilter.replace(/\{\{this\.filename\}\}/g, sourceFile.basename);

        const folderName = sourceFile.parent ? sourceFile.parent.name : '';
        expandedFilter = expandedFilter.replace(/\{\{this\.folder\}\}/g, folderName);

        const pathNoExt = sourceFile.path.replace(/\.md$/, '');
        expandedFilter = expandedFilter.replace(/\{\{this\.path\}\}/g, pathNoExt);
    }

    const parsedFilter = parseFilter(expandedFilter);
    if (!parsedFilter) {
        el.createEl("div", { text: `Error: unsupported or invalid filter format '${config.filter}'.`, cls: 'moc-error' });
        return;
    }

    const folderPath = expandedFolder.trim().replace(/^\/+|\/+$/g, '');
    const isRecursive = config.recursive === true;

    let sortField = 'name';
    let sortDirection = 'desc';
    if (config.sort !== undefined) {
        if (typeof config.sort !== 'string') {
            el.createEl("div", { text: "Error: invalid 'sort' format in moc block.", cls: 'moc-error' });
            return;
        }
        const parts = config.sort.trim().split(/\s+/);
        if (parts.length > 0) {
            sortField = parts[0]!.toLowerCase();
        }
        if (parts.length > 1) {
            sortDirection = parts[1]!.toLowerCase();
        }

        const validSortFields = ['ctime', 'mtime', 'name'];
        if (!validSortFields.includes(sortField)) {
            el.createEl("div", { text: `Error: invalid sort field '${sortField}'. Must be one of: ${validSortFields.join(', ')}.`, cls: 'moc-error' });
            return;
        }

        const validSortDirections = ['asc', 'desc'];
        if (!validSortDirections.includes(sortDirection)) {
            el.createEl("div", { text: `Error: invalid sort direction '${sortDirection}'. Must be 'asc' or 'desc'.`, cls: 'moc-error' });
            return;
        }
    }

    if (config.limit !== undefined) {
        if (typeof config.limit !== 'number' || config.limit <= 0) {
            el.createEl("div", { text: "Error: invalid 'limit' in moc block. Must be a positive number.", cls: 'moc-error' });
            return;
        }
    }

    // 1. Find all matching files
    const allFiles = app.vault.getMarkdownFiles();

    let matchedFiles = allFiles.filter(file => {
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

    if (config.sort !== undefined) {
        matchedFiles.sort((a, b) => {
            let valA, valB;
            if (sortField === 'ctime') {
                valA = a.stat.ctime;
                valB = b.stat.ctime;
            } else if (sortField === 'mtime') {
                valA = a.stat.mtime;
                valB = b.stat.mtime;
            } else {
                valA = a.basename;
                valB = b.basename;
            }

            if (sortField === 'name') {
                const cmp = String(valA).localeCompare(String(valB));
                if (cmp !== 0) return sortDirection === 'asc' ? cmp : -cmp;
            } else {
                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    if (config.limit !== undefined) {
        matchedFiles = matchedFiles.slice(0, config.limit);
    }

    // 2. Extract elements
    const matchedBlocks: MatchedBlock[] = [];

    for (const file of matchedFiles) {
        const fileCache = app.metadataCache.getFileCache(file);
        if (!fileCache) continue;

        const frontmatterResult = evaluateFrontmatter(fileCache.frontmatter, parsedFilter);
        if (frontmatterResult === false) {
            continue; // Skip file entirely if properties condition fails
        }

        const fileContent = await app.vault.cachedRead(file);
        const lines = fileContent.split(/\r?\n/);






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


                    const blockLines: string[] = [];
                    for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
                        let currentLine = lines[lineNum];
                        if (currentLine === undefined) continue;

                        if (baseIndent && currentLine.startsWith(baseIndent)) {
                            currentLine = currentLine.substring(baseIndent.length);
                        }
                        blockLines.push(currentLine);
                    }
                    const blockText = blockLines.join('\n');
                    matchedBlocks.push({ file, lines: blockLines, tags: extractTags(blockText) });

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


                    const blockLines: string[] = [];
                    for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
                        if (lines[lineNum] !== undefined) {
                            blockLines.push(lines[lineNum] as string);
                        }
                    }
                    const blockText = blockLines.join('\n');
                    matchedBlocks.push({ file, lines: blockLines, tags: extractTags(blockText) });

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

                    matchedBlocks.push({ file, lines: sectionLines as string[], tags: extractTags(sectionText) });
                }
            }
        }

        // matchedBlocks already updated
    }

    // Apply find & replace to matched blocks if configured
    if (config.applyFnR) {
        const ruleNames = Array.isArray(config.applyFnR) ? config.applyFnR : [config.applyFnR];
        for (const ruleName of ruleNames) {
            const rule = settings.rules?.find(r => r.name === ruleName);
            if (rule) {
                for (const block of matchedBlocks) {
                    const blockText = block.lines.join('\n');
                    const replacedText = applyFindReplace(blockText, rule.find, rule.replace);
                    block.lines = replacedText.split(/\r?\n/);
                    block.tags = extractTags(replacedText);
                }
            }
        }
    }

    // 3. Render output
    if (matchedBlocks.length === 0) {
        el.createEl("div", { text: `No elements matching filter found in '${config.folder}'.`, cls: 'moc-empty' });
        return;
    }


    const outputLines: string[] = [];

    if (!config.groupBy) {
        // Default behavior: group by file
        const filesMap = new Map<string, MatchedBlock[]>();
        for (const block of matchedBlocks) {
            const filePath = block.file.path;
            if (!filesMap.has(filePath)) {
                filesMap.set(filePath, []);
            }
            filesMap.get(filePath)!.push(block);
        }

        for (const [filePath, blocks] of filesMap.entries()) {
            const basename = blocks[0]?.file.basename;
            outputLines.push(`### [[${filePath}|${basename}]]`);
            outputLines.push("");
            for (const block of blocks) {
                outputLines.push(...block.lines);
            }
            outputLines.push("");
        }
    } else {
        // Grouped behavior
        const groupsMap = new Map<string, MatchedBlock[]>();

        for (const block of matchedBlocks) {
            let groupKeys: string[] = [];

            if (config.groupBy === 'folder') {
                const parentPath = block.file.parent ? block.file.parent.path : '/';
                groupKeys.push(parentPath);
            } else if (config.groupBy === 'cday') {
                groupKeys.push(moment(block.file.stat.ctime).format('YYYY-MM-DD'));
            } else if (config.groupBy === 'mday') {
                groupKeys.push(moment(block.file.stat.mtime).format('YYYY-MM-DD'));
            } else if (config.groupBy === 'tag') {
                if (block.tags.length > 0) {
                    groupKeys.push(...block.tags);
                } else {
                    groupKeys.push("Untagged");
                }
            } else {
                groupKeys.push("Unknown");
            }

            for (const key of groupKeys) {
                if (!groupsMap.has(key)) {
                    groupsMap.set(key, []);
                }
                groupsMap.get(key)!.push(block);
            }
        }

        // Sort groups alphabetically (except Untagged which could go last, but simple sort is fine for now)
        const sortedGroups = Array.from(groupsMap.keys()).sort();

        for (const group of sortedGroups) {
            outputLines.push(`### ${group}`);
            outputLines.push("");

            const blocks = groupsMap.get(group)!;
            const filesMap = new Map<string, MatchedBlock[]>();
            for (const block of blocks) {
                const filePath = block.file.path;
                if (!filesMap.has(filePath)) {
                    filesMap.set(filePath, []);
                }
                filesMap.get(filePath)!.push(block);
            }

            for (const [filePath, fileBlocks] of filesMap.entries()) {
                const basename = fileBlocks[0]?.file.basename;
                outputLines.push(`#### [[${filePath}|${basename}]]`);
                outputLines.push("");
                for (const block of fileBlocks) {
                    outputLines.push(...block.lines);
                }
                outputLines.push("");
            }
        }
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
