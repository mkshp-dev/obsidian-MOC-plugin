import { App, CachedMetadata, Keymap, MarkdownRenderer, MarkdownPostProcessorContext, MarkdownRenderChild, moment, Notice, setIcon, TFile, debounce, TAbstractFile } from 'obsidian';
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
    propOperator?: string;
    propValue?: unknown;
}


function tokenizeFilter(input: string): string[] | null {
    const tokenRegex = /\s*(AND\b|OR\b|NOT\b|\(|\)|properties\(\s*[a-zA-Z0-9_-]+\s*(?:==|!=|>=|<=|>|<)\s*(?:["'].*?["']|[^"\s)]+)\s*\)|(?:has_word|contains|has_text|matches|has_tag)\(\s*["'].*?["']\s*\)|(?:is_completed|is_incomplete)\(\s*\))\s*/iy;
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

    const propertiesPattern = /^properties\(\s*([a-zA-Z0-9_-]+)\s*(==|!=|>=|<=|>|<)\s*(?:["'](.*?)["']|([^"\s)]+))\s*\)$/;
    const propMatch = filterString.match(propertiesPattern);
    if (propMatch) {
        return {
            type: 'properties',
            propKey: propMatch[1],
            propOperator: propMatch[2] || '==',
            propValue: propMatch[3] !== undefined ? propMatch[3] : propMatch[4]
        };
    }

    const stringMatchPattern = /^(has_word|contains|has_text|matches|has_tag)\(\s*["'](.*?)["']\s*\)$/;
    const boolPattern = /^(is_completed|is_incomplete)\(\s*\)$/;

    const strMatch = filterString.match(stringMatchPattern);
    if (strMatch) {
        let type = strMatch[1] as FilterType;
        const value = strMatch[2];
        if (type === 'has_word' || type === 'has_text') {
            type = 'contains';
        }
        if (type === 'matches') {
            try {
                if (value !== undefined) {
                    const regexMatch = value.match(/^\/(.*)\/([a-zA-Z]*)$/);
                    if (regexMatch) {
                        const [, pattern, flags] = regexMatch;
                        return { type, value, regex: new RegExp(pattern!, flags) };
                    }
                }
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
        case 'has_tag': {
            if (filter.value === undefined) return false;
            let queryTag = filter.value.trim().toLowerCase();
            if (!queryTag.startsWith('#')) {
                queryTag = '#' + queryTag;
            }
            const extracted = extractTags(text).map(t => t.toLowerCase());
            return extracted.some(t => t === queryTag || t.startsWith(queryTag + '/'));
        }
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
            if (!(condition.propKey as string in frontmatter)) return false;

            const op = condition.propOperator || '==';
            const frontmatterValue = frontmatter[condition.propKey as string];
            const expectedValue = condition.propValue;

            const valuesEqual = areFrontmatterValuesEqual(frontmatterValue, expectedValue);
            if (op === '==') return valuesEqual;
            if (op === '!=') return !valuesEqual;

            let left: string | number | boolean = String(frontmatterValue);
            let right: string | number | boolean = String(expectedValue);

            const leftNum = Number(left);
            const rightNum = Number(right);

            if (!isNaN(leftNum) && !isNaN(rightNum) && left.trim() !== '' && right.trim() !== '') {
                left = leftNum;
                right = rightNum;
            } else {
                const leftDate = Date.parse(left);
                const rightDate = Date.parse(right);
                if (!isNaN(leftDate) && !isNaN(rightDate)) {
                    left = leftDate;
                    right = rightDate;
                }
            }

            if (op === '>') return left > right;
            if (op === '<') return left < right;
            if (op === '>=') return left >= right;
            if (op === '<=') return left <= right;
            return false;
        }
        return null; // Not a property condition, cannot evaluate at file level
    }
    return null;
}

function areFrontmatterValuesEqual(frontmatterValue: unknown, expectedValue: unknown): boolean {
    if (typeof frontmatterValue === 'boolean') {
        return typeof expectedValue === 'string' &&
            (expectedValue === 'true' || expectedValue === 'false') &&
            frontmatterValue === (expectedValue === 'true');
    }

    if (typeof frontmatterValue === 'number') {
        const expectedNumber = Number(expectedValue);
        return Number.isFinite(expectedNumber) && frontmatterValue === expectedNumber;
    }

    return String(frontmatterValue) === String(expectedValue);
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
            const tag = match[1].replace(/[.,;:!?)"'\s]+$/, '');
            if (tag.length > 1) {
                tags.add(tag);
            }
        }
    }
    return Array.from(tags);
}

export interface TaskLineRef {
    /** Zero-based line number of the task within its source file. */
    line: number;
    /** The task line exactly as it appears in the source, used to detect stale writes. */
    sourceText: string;
}

export interface TaskRef extends TaskLineRef {
    file: TFile;
}

/** Points at where a matched block begins in its source note. */
export interface BlockRef {
    file: TFile;
    /** Zero-based line number of the block's first line. */
    line: number;
}

export interface MatchedBlock {
    file: TFile;
    lines: string[];
    tags: string[];
    taskLines: TaskLineRef[];
    /** Zero-based line number this block starts at in its source note. */
    startLine: number;
}

/**
 * A slice of the rendered output. Segments carrying a `ref` are matched blocks
 * and get their own container plus a jump-to-source control; the rest are the
 * headings, separators and counts emitted around them.
 */
export interface MocSegment {
    markdown: string;
    ref?: BlockRef;
}

interface BlockRange {
    ref: BlockRef;
    /** Inclusive index into the emitted output lines. */
    start: number;
    /** Inclusive index into the emitted output lines. */
    end: number;
}

/**
 * Splits the emitted lines into renderable segments, isolating each matched
 * block so it can be rendered into its own element. The concatenation of every
 * segment's markdown is identical to the flat output used by Copy and Bake.
 */
export function buildSegments(outputLines: string[], blockRanges: BlockRange[]): MocSegment[] {
    const segments: MocSegment[] = [];
    let cursor = 0;

    for (const range of blockRanges) {
        if (range.start > cursor) {
            segments.push({ markdown: outputLines.slice(cursor, range.start).join('\n') });
        }
        segments.push({
            markdown: outputLines.slice(range.start, range.end + 1).join('\n'),
            ref: range.ref
        });
        cursor = range.end + 1;
    }

    if (cursor < outputLines.length) {
        segments.push({ markdown: outputLines.slice(cursor).join('\n') });
    }

    return segments;
}

const TASK_MARKER_PATTERN = /^(\s*(?:>\s*)*(?:[-*+]|\d+[.)])\s+\[)(.)(\])/;

/**
 * Flips a task line between checked and unchecked, preserving indentation, list
 * marker, blockquote prefix and everything after the checkbox. Any state other
 * than a space is treated as checked, so custom states collapse to unchecked on
 * the first click. Returns null when the line is not a task.
 */
export function toggleTaskMarker(line: string): string | null {
    const match = line.match(TASK_MARKER_PATTERN);
    if (!match) return null;

    const [, prefix, state, suffix] = match;
    const nextState = state === ' ' ? 'x' : ' ';
    return `${prefix}${nextState}${suffix}${line.slice(match[0].length)}`;
}

/**
 * True when a task line is in any state other than unchecked, mirroring how
 * Obsidian renders custom states such as `[/]` as checked. Null if not a task.
 */
export function isTaskLineChecked(line: string): boolean | null {
    const match = line.match(TASK_MARKER_PATTERN);
    if (!match) return null;
    return match[2] !== ' ';
}

/**
 * Maps every task line in a file to its source text, keyed by line number.
 * Derived from the metadata cache so that `- [ ]` inside a fenced code block is
 * ignored, matching what Obsidian actually renders as a checkbox.
 */
function buildTaskLineMap(fileCache: CachedMetadata | null, lines: string[]): Map<number, string> {
    const map = new Map<number, string>();
    if (!fileCache || !fileCache.listItems) return map;

    for (const item of fileCache.listItems) {
        if (item.task === undefined) continue;
        const line = item.position.start.line;
        const sourceText = lines[line];
        if (sourceText !== undefined) {
            map.set(line, sourceText);
        }
    }
    return map;
}

/** Collects the task lines falling inside a matched block, in document order. */
function collectTaskLines(taskLineMap: Map<number, string>, startLine: number, endLine: number): TaskLineRef[] {
    const refs: TaskLineRef[] = [];
    for (let line = startLine; line <= endLine; line++) {
        const sourceText = taskLineMap.get(line);
        if (sourceText !== undefined) {
            refs.push({ line, sourceText });
        }
    }
    return refs;
}

export type TaskToggleResult = 'ok' | 'stale' | 'missing';

/**
 * Toggles a task in its source note. The write is skipped unless the target
 * line still matches the text it had when the block was rendered, so a stale
 * MOC view can never overwrite an edit made elsewhere.
 */
export async function toggleTaskInSource(app: App, ref: TaskRef): Promise<TaskToggleResult> {
    const file = app.vault.getAbstractFileByPath(ref.file.path);
    if (!(file instanceof TFile)) return 'missing';

    let outcome: TaskToggleResult = 'ok';

    await app.vault.process(file, (data) => {
        const eol = data.includes('\r\n') ? '\r\n' : '\n';
        const lines = data.split(/\r?\n/);
        const current = lines[ref.line];

        if (current === undefined || current !== ref.sourceText) {
            outcome = 'stale';
            return data;
        }

        const toggled = toggleTaskMarker(current);
        if (toggled === null) {
            outcome = 'stale';
            return data;
        }

        lines[ref.line] = toggled;
        return lines.join(eol);
    });

    return outcome;
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

export function applyTemplate(text: string, template: string, file: TFile): string {
    return template.replace(/\{\{(content|file|path|link)\}\}/g, (match, p1) => {
        if (p1 === 'content') return text;
        if (p1 === 'file') return file.basename;
        if (p1 === 'path') return file.path;
        if (p1 === 'link') return `[[${file.path}|${file.basename}]]`;
        return match;
    });
}

export interface MocConfig {
    folder?: string;
    element?: string;
    filter?: string;
    recursive?: boolean;
    groupBy?: string;
    sort?: string;
    limit?: number;
    offset?: number;
    applyFnR?: string | string[];
    template?: string;
    blockSeparator?: 'none' | 'divider' | 'newline';
    noteSeparator?: 'none' | 'divider' | 'newline';
    showCount?: boolean;
    excludeFolder?: string | string[];
    excludeFile?: string | string[];
}

export interface MocRenderResult {
    markdownText?: string;
    error?: string;
    cls?: string;
    /**
     * Source locations of every task emitted into `markdownText`, in the order
     * they appear. Rendered checkboxes are matched to these positionally.
     */
    taskRefs?: TaskRef[];
    /**
     * True when `template` or `applyFnR` rewrote the matched blocks, which
     * breaks the positional mapping between checkboxes and source lines.
     */
    tasksTransformed?: boolean;
    /**
     * `markdownText` split so each matched block can be rendered into its own
     * element. Joining every segment reproduces `markdownText` exactly.
     */
    segments?: MocSegment[];
}

class MocRenderChild extends MarkdownRenderChild {
    config: MocConfig;
    app: App;
    sourcePath: string;
    settings: MOCPluginSettings;
    folderPath: string;
    isRecursive: boolean;
    updateDebounced: () => void;
    el: HTMLElement;
    ctx: MarkdownPostProcessorContext;
    wrapper: HTMLDivElement | null = null;
    container: HTMLDivElement | null = null;

    constructor(
        containerEl: HTMLElement,
        config: MocConfig,
        app: App,
        sourcePath: string,
        settings: MOCPluginSettings,
        folderPath: string,
        isRecursive: boolean,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) {
        super(containerEl);
        this.config = config;
        this.app = app;
        this.sourcePath = sourcePath;
        this.settings = settings;
        this.folderPath = folderPath;
        this.isRecursive = isRecursive;
        this.el = el;
        this.ctx = ctx;

        this.updateDebounced = debounce(async () => {
            await this.renderMoc();
        }, 500, true);
    }

    onload() {
        // Register event listeners to update MOC on file changes
        this.registerEvent(this.app.vault.on('modify', this.onFileChange.bind(this)));
        this.registerEvent(this.app.vault.on('create', this.onFileChange.bind(this)));
        this.registerEvent(this.app.vault.on('delete', this.onFileChange.bind(this)));

        // Initial render is handled by processMocBlock
    }

    onFileChange(file: TAbstractFile) {
        if (file instanceof TFile && file.extension === 'md') {
            // Check if file is in the watched folder
            const parentPath = file.parent ? file.parent.path : '';
            const normalizedParent = parentPath.replace(/^\/+|\/+$/g, '');

            let shouldUpdate = false;

            if (normalizedParent === this.folderPath) {
                shouldUpdate = true;
            } else if (this.isRecursive) {
                if (this.folderPath === '') {
                    shouldUpdate = true;
                } else if (normalizedParent.startsWith(this.folderPath + '/')) {
                    shouldUpdate = true;
                }
            }

            if (shouldUpdate) {
                this.updateDebounced();
            }
        }
    }

    async renderMoc() {
        const result = await generateMocMarkdown(this.config, this.app, this.sourcePath, this.settings);

        if (this.container) {
            this.container.empty();
            if (result.error) {
                this.container.createDiv({ text: result.error, cls: result.cls || 'moc-error' });
            } else if (result.markdownText) {
                if (result.segments && result.segments.length > 0) {
                    await this.renderSegments(result.segments);
                } else {
                    await MarkdownRenderer.render(this.app, result.markdownText, this.container, this.sourcePath, this);
                }
                this.attachTaskHandlers(result.taskRefs || [], result.tasksTransformed === true);
            }
        }
    }

    /**
     * Renders the output segment by segment so every matched block lands in its
     * own element. That gives each block a stable handle for the jump-to-source
     * control, which a single flat render cannot provide.
     */
    private async renderSegments(segments: MocSegment[]) {
        if (!this.container) return;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i]!;

            if (segment.markdown.trim() === '') {
                // A blank segment sitting between two blocks is the blank line
                // emitted by `blockSeparator: newline`. Rendering each block into
                // its own element loses the spacing that blank line used to
                // create, so stand an explicit spacer in its place. Blank lines
                // anywhere else are structural and already absorbed into the
                // neighbouring heading segment.
                if (segments[i - 1]?.ref && segments[i + 1]?.ref) {
                    this.container.createDiv({ cls: 'moc-spacer' });
                }
                continue;
            }

            if (!segment.ref) {
                const segmentEl = this.container.createDiv({ cls: 'moc-segment' });
                await MarkdownRenderer.render(this.app, segment.markdown, segmentEl, this.sourcePath, this);
                continue;
            }

            const blockEl = this.container.createDiv({ cls: 'moc-block' });
            await MarkdownRenderer.render(this.app, segment.markdown, blockEl, this.sourcePath, this);
            this.addJumpButton(blockEl, segment.ref);
        }
    }

    private addJumpButton(blockEl: HTMLElement, ref: BlockRef) {
        if (!this.settings.showJumpToSource) return;

        // aria-label only: Obsidian renders its own tooltip from it, and adding
        // a `title` would stack a second, native tooltip behind it.
        const button = blockEl.createEl('button', {
            cls: 'moc-jump-button',
            attr: {
                'aria-label': `Open ${ref.file.basename}, line ${ref.line + 1}`
            }
        });
        setIcon(button, 'arrow-up-right');

        button.onClickEvent(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.jumpToSource(e, ref);
        });
    }

    private async jumpToSource(evt: MouseEvent, ref: BlockRef) {
        const file = this.app.vault.getAbstractFileByPath(ref.file.path);
        if (!(file instanceof TFile)) {
            new Notice(`Could not open source: '${ref.file.path}' no longer exists.`);
            return;
        }

        // Mod-click (or middle click) opens in a new pane, matching how Obsidian
        // treats links everywhere else.
        const leaf = this.app.workspace.getLeaf(Keymap.isModEvent(evt));
        await leaf.openFile(file, { eState: { line: ref.line } });
    }

    /**
     * Makes rendered task checkboxes write back to their source notes.
     *
     * Checkboxes are paired with `taskRefs` by position, which holds because the
     * generator records each task in the same order it emits it. If the counts
     * disagree for any reason the mapping is untrustworthy, so every checkbox is
     * disabled rather than risk writing to the wrong line.
     */
    private attachTaskHandlers(taskRefs: TaskRef[], tasksTransformed: boolean) {
        if (!this.container || !this.settings.interactiveTasks) return;

        const checkboxes = Array.from(
            this.container.querySelectorAll<HTMLInputElement>('input.task-list-item-checkbox')
        );
        if (checkboxes.length === 0) return;

        if (tasksTransformed || checkboxes.length !== taskRefs.length) {
            const reason = tasksTransformed
                ? 'Read-only: tasks cannot be toggled when template or applyFnR is used.'
                : 'Read-only: rendered tasks could not be matched to their source lines.';
            for (const checkbox of checkboxes) {
                checkbox.disabled = true;
                checkbox.title = reason;
            }
            return;
        }

        for (let i = 0; i < checkboxes.length; i++) {
            const checkbox = checkboxes[i]!;
            const ref = taskRefs[i]!;

            checkbox.disabled = false;
            checkbox.title = `Toggle in ${ref.file.path}`;
            checkbox.onClickEvent(async (e) => {
                e.preventDefault();
                await this.handleTaskToggle(checkbox, ref);
            });
        }
    }

    private async handleTaskToggle(checkbox: HTMLInputElement, ref: TaskRef) {
        // Derived from the source line rather than the checkbox: a click has
        // already flipped `checked` by the time this runs, and preventDefault
        // only restores it afterwards, so the DOM is not a reliable source here.
        const nextChecked = isTaskLineChecked(ref.sourceText) === false;
        const nextSourceText = toggleTaskMarker(ref.sourceText);

        const outcome = await toggleTaskInSource(this.app, ref);

        if (outcome === 'missing') {
            new Notice(`Could not update task: '${ref.file.path}' no longer exists.`);
            await this.renderMoc();
            return;
        }

        if (outcome === 'stale') {
            new Notice('Could not update task: the source line has changed. Refreshing.');
            await this.renderMoc();
            return;
        }

        // Keep the ref in step with the file so that clicking the same checkbox
        // again before the debounced re-render lands still toggles cleanly.
        if (nextSourceText !== null) {
            ref.sourceText = nextSourceText;
        }

        // Reflect the change immediately; the vault 'modify' event re-renders the
        // block shortly after, which reconciles grouping, filters and counts.
        checkbox.checked = nextChecked;

        const listItem = checkbox.closest('.task-list-item');
        if (listItem instanceof HTMLElement) {
            listItem.toggleClass('is-checked', nextChecked);
            listItem.setAttribute('data-task', nextChecked ? 'x' : ' ');
        }
    }
}

export async function generateMocMarkdown(
    config: MocConfig,
    app: App,
    sourcePath: string,
    settings: MOCPluginSettings
): Promise<MocRenderResult> {
    const sourceFile = app.vault.getAbstractFileByPath(sourcePath);

    if (!config.folder || typeof config.folder !== 'string') {
        return { error: "Error: invalid or missing 'folder' in moc block.", cls: 'moc-error' };
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
        return { error: `Error: element must be one of: ${validElements.join(', ')}.`, cls: 'moc-error' };
    }

    if (!config.filter || typeof config.filter !== 'string') {
        return { error: "Error: invalid or missing 'filter' in moc block.", cls: 'moc-error' };
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
        return { error: `Error: unsupported or invalid filter format '${config.filter}'.`, cls: 'moc-error' };
    }

    const folderPath = expandedFolder.trim().replace(/^\/+|\/+$/g, '');
    const isRecursive = config.recursive === true;

    let sortField = 'name';
    let sortDirection = 'desc';
    if (config.sort !== undefined) {
        if (typeof config.sort !== 'string') {
            return { error: "Error: invalid 'sort' format in moc block.", cls: 'moc-error' };
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
            return { error: `Error: invalid sort field '${sortField}'. Must be one of: ${validSortFields.join(', ')}.`, cls: 'moc-error' };
        }

        const validSortDirections = ['asc', 'desc'];
        if (!validSortDirections.includes(sortDirection)) {
            return { error: `Error: invalid sort direction '${sortDirection}'. Must be 'asc' or 'desc'.`, cls: 'moc-error' };
        }
    }

    if (config.limit !== undefined) {
        if (typeof config.limit !== 'number' || config.limit <= 0) {
            return { error: "Error: invalid 'limit' in moc block. Must be a positive number.", cls: 'moc-error' };
        }
    }

    if (config.offset !== undefined) {
        if (typeof config.offset !== 'number' || config.offset < 0 || !Number.isInteger(config.offset)) {
            return { error: "Error: invalid 'offset' in moc block. Must be a non-negative integer.", cls: 'moc-error' };
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

    if (config.excludeFolder) {
        let excludeFolders = Array.isArray(config.excludeFolder) ? config.excludeFolder : [config.excludeFolder];
        excludeFolders = excludeFolders.map(folder => folder.trim().replace(/^\/+|\/+$/g, ''));
        matchedFiles = matchedFiles.filter(file => {
            return !excludeFolders.some(exFolder => {
                const parentPath = file.parent ? file.parent.path.replace(/^\/+|\/+$/g, '') : '';
                return parentPath === exFolder || parentPath.startsWith(exFolder + '/');
            });
        });
    }

    if (config.excludeFile) {
        let excludeFiles = Array.isArray(config.excludeFile) ? config.excludeFile : [config.excludeFile];
        excludeFiles = excludeFiles.map(file => file.trim().replace(/^\/+|\/+$/g, ''));
        matchedFiles = matchedFiles.filter(file => {
            const normalizedPath = file.path.replace(/^\/+|\/+$/g, '');
            return !excludeFiles.some(exFile => {
                // If exFile doesn't have an extension, try appending .md for a match
                const exFileWithExt = exFile.endsWith('.md') ? exFile : exFile + '.md';
                return normalizedPath === exFile || normalizedPath === exFileWithExt;
            });
        });
    }

    if (matchedFiles.length === 0) {
        return { error: `No markdown files found in folder '${config.folder}'.`, cls: 'moc-empty' };
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

    if (config.offset !== undefined || config.limit !== undefined) {
        const start = config.offset || 0;
        const end = config.limit !== undefined ? start + config.limit : undefined;
        matchedFiles = matchedFiles.slice(start, end);
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
        const taskLineMap = buildTaskLineMap(fileCache, lines);

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
                    matchedBlocks.push({
                        file,
                        lines: blockLines,
                        tags: extractTags(blockText),
                        taskLines: collectTaskLines(taskLineMap, startLine, endLine),
                        startLine
                    });
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

                    for (let j = i + 1; j < headings.length; j++) {
                        const nextHeading = headings[j];
                        if (nextHeading && nextHeading.level <= heading.level) {
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
                    matchedBlocks.push({
                        file,
                        lines: blockLines,
                        tags: extractTags(blockText),
                        taskLines: collectTaskLines(taskLineMap, startLine, endLine),
                        startLine
                    });
                }
            }
        } else if (config.element === 'Paragraph' || config.element === 'Blockquote') {
            if (!fileCache.sections || fileCache.sections.length === 0) continue;

            const targetType = config.element.toLowerCase();

            for (const section of fileCache.sections) {
                if (section.type !== targetType) continue;

                const startLine = section.position.start.line;
                const endLine = section.position.end.line;

                const sectionLines = [];
                for (let i = startLine; i <= endLine; i++) {
                    if (lines[i] !== undefined) {
                        sectionLines.push(lines[i]);
                    }
                }
                const sectionText = sectionLines.join('\n');

                if (evaluateFilter(sectionText, parsedFilter)) {
                    matchedBlocks.push({
                        file,
                        lines: sectionLines as string[],
                        tags: extractTags(sectionText),
                        taskLines: collectTaskLines(taskLineMap, startLine, endLine),
                        startLine
                    });
                }
            }
        }
    }

    // Set when a block's text is actually rewritten. Rewritten text can gain or
    // lose checkboxes, which breaks the positional mapping from a rendered
    // checkbox back to its source line, so tasks are rendered read-only.
    // Text that comes back byte-identical leaves the mapping intact.
    let tasksTransformed = false;

    if (config.applyFnR) {
        const ruleNames = Array.isArray(config.applyFnR) ? config.applyFnR : [config.applyFnR];
        for (const ruleName of ruleNames) {
            const rule = settings.rules?.find(r => r.name === ruleName);
            if (rule) {
                for (const block of matchedBlocks) {
                    const blockText = block.lines.join('\n');
                    const replacedText = applyFindReplace(blockText, rule.find, rule.replace);
                    if (replacedText !== blockText) {
                        tasksTransformed = true;
                    }
                    block.lines = replacedText.split(/\r?\n/);
                    block.tags = extractTags(replacedText);
                }
            }
        }
    }

    if (config.template) {
        // Template must refer to a file in settings.templateFolder
        const templateFolder = (settings.templateFolder || '').trim().replace(/^\/+|\/+$/g, '');
        
        if (templateFolder === '') {
            return { error: "Error: Template folder not configured in settings.", cls: 'moc-error' };
        }

        let templateFile: TFile | null = null;

        // Try to find the template file
        const pathWithExt = `${templateFolder}/${config.template}.md`;
        const pathDirect = `${templateFolder}/${config.template}`;
        const fileDirect = app.vault.getAbstractFileByPath(pathWithExt) || app.vault.getAbstractFileByPath(pathDirect);
        if (fileDirect instanceof TFile) {
            templateFile = fileDirect;
        }

        if (!templateFile) {
            // Search by basename in templateFolder
            const files = app.vault.getMarkdownFiles();
            const matchedFile = files.find(f => {
                const parentPath = f.parent ? f.parent.path.replace(/^\/+|\/+$/g, '') : '';
                if (parentPath !== templateFolder && !parentPath.startsWith(templateFolder + '/')) {
                    return false;
                }
                return f.basename === config.template || f.path === config.template || f.path === `${config.template}.md`;
            });
            if (matchedFile) {
                templateFile = matchedFile;
            }
        }

        if (!templateFile) {
            return { error: `Error: Template file '${config.template}' not found in template folder '${templateFolder}'.`, cls: 'moc-error' };
        }

        const templateContent = await app.vault.cachedRead(templateFile);

        for (const block of matchedBlocks) {
            const blockText = block.lines.join('\n');
            const replacedText = applyTemplate(blockText, templateContent, block.file);
            if (replacedText !== blockText) {
                tasksTransformed = true;
            }
            block.lines = replacedText.split(/\r?\n/);
            block.tags = extractTags(replacedText);
        }
    }

    if (matchedBlocks.length === 0) {
        return { error: `No elements matching filter found in '${config.folder}'.`, cls: 'moc-empty' };
    }

    const outputLines: string[] = [];
    // Recorded as blocks are emitted so the order matches the rendered output.
    const taskRefs: TaskRef[] = [];
    const blockRanges: BlockRange[] = [];

    if (!config.groupBy) {
        const filesMap = new Map<string, MatchedBlock[]>();
        for (const block of matchedBlocks) {
            const filePath = block.file.path;
            if (!filesMap.has(filePath)) {
                filesMap.set(filePath, []);
            }
            filesMap.get(filePath)!.push(block);
        }

        const filePaths = Array.from(filesMap.keys());
        for (let idx = 0; idx < filePaths.length; idx++) {
            const filePath = filePaths[idx]!;
            const blocks = filesMap.get(filePath)!;
            const basename = blocks[0]?.file.basename;
            outputLines.push(`### [[${filePath}|${basename}]]`);
            outputLines.push("");
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                if (block) {
                    const blockStart = outputLines.length;
                    outputLines.push(...block.lines);
                    blockRanges.push({
                        ref: { file: block.file, line: block.startLine },
                        start: blockStart,
                        end: outputLines.length - 1
                    });
                    for (const taskLine of block.taskLines) {
                        taskRefs.push({ file: block.file, ...taskLine });
                    }
                    if (i < blocks.length - 1) {
                        if (config.blockSeparator === 'divider') {
                            outputLines.push("");
                            outputLines.push("---");
                            outputLines.push("");
                        } else if (config.blockSeparator === 'newline') {
                            outputLines.push("");
                        }
                    }
                }
            }
            
            if (idx < filePaths.length - 1) {
                if (config.noteSeparator === 'divider') {
                    outputLines.push("");
                    outputLines.push("---");
                    outputLines.push("");
                } else if (config.noteSeparator === 'none') {
                    // Do nothing
                } else {
                    outputLines.push("");
                }
            } else {
                outputLines.push("");
            }
        }
    } else {
        const groupsMap = new Map<string, MatchedBlock[]>();

        for (const block of matchedBlocks) {
            let groupKeys: string[] = [];

            if (config.groupBy === 'folder') {
                const parentPath = block.file.parent ? block.file.parent.path : '/';
                groupKeys.push(parentPath);
            } else if (config.groupBy === 'cday') {
                const safeMoment = moment as unknown as (date?: number | string | Date) => { format(formatStr: string): string };
                groupKeys.push(safeMoment(block.file.stat.ctime).format('YYYY-MM-DD'));
            } else if (config.groupBy === 'mday') {
                const safeMoment = moment as unknown as (date?: number | string | Date) => { format(formatStr: string): string };
                groupKeys.push(safeMoment(block.file.stat.mtime).format('YYYY-MM-DD'));
            } else if (config.groupBy === 'tag') {
                if (block.tags.length > 0) {
                    groupKeys.push(...block.tags);
                } else {
                    groupKeys.push("Untagged");
                }
            } else if (config.groupBy.startsWith('property(') && config.groupBy.endsWith(')')) {
                const match = config.groupBy.match(/^property\((.*?)\)$/);
                if (match && match[1]) {
                    const key = match[1].trim();
                    if (key) {
                        const frontmatter = app.metadataCache.getFileCache(block.file)?.frontmatter;
                        if (frontmatter) {
                            const val = frontmatter[key] as unknown;
                            if (val !== undefined && val !== null && val !== "") {
                                if (Array.isArray(val)) {
                                    groupKeys.push(val.map(v => String(v)).join(', '));
                                } else if (typeof val === 'object') {
                                    groupKeys.push(JSON.stringify(val));
                                } else {
                                    groupKeys.push(`${val as string | number | boolean}`);
                                }
                            } else {
                                groupKeys.push("(none)");
                            }
                        } else {
                            groupKeys.push("(none)");
                        }
                    } else {
                        groupKeys.push("(none)");
                    }
                } else {
                    groupKeys.push("(none)");
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

        const sortedGroups = Array.from(groupsMap.keys()).sort();

        for (const group of sortedGroups) {
            const blocks = groupsMap.get(group)!;
            const headingText = config.showCount ? `### ${group} (${blocks.length})` : `### ${group}`;
            outputLines.push(headingText);
            outputLines.push("");

            const filesMap = new Map<string, MatchedBlock[]>();
            for (const block of blocks) {
                const filePath = block.file.path;
                if (!filesMap.has(filePath)) {
                    filesMap.set(filePath, []);
                }
                filesMap.get(filePath)!.push(block);
            }

            const filePaths = Array.from(filesMap.keys());
            for (let idx = 0; idx < filePaths.length; idx++) {
                const filePath = filePaths[idx]!;
                const fileBlocks = filesMap.get(filePath)!;
                const basename = fileBlocks[0]?.file.basename;
                outputLines.push(`#### [[${filePath}|${basename}]]`);
                outputLines.push("");
                for (let i = 0; i < fileBlocks.length; i++) {
                    const block = fileBlocks[i];
                    if (block) {
                        const blockStart = outputLines.length;
                        outputLines.push(...block.lines);
                        blockRanges.push({
                            ref: { file: block.file, line: block.startLine },
                            start: blockStart,
                            end: outputLines.length - 1
                        });
                        for (const taskLine of block.taskLines) {
                            taskRefs.push({ file: block.file, ...taskLine });
                        }
                        if (i < fileBlocks.length - 1) {
                            if (config.blockSeparator === 'divider') {
                                outputLines.push("");
                                outputLines.push("---");
                                outputLines.push("");
                            } else if (config.blockSeparator === 'newline') {
                                outputLines.push("");
                            }
                        }
                    }
                }
                
                if (idx < filePaths.length - 1) {
                    if (config.noteSeparator === 'divider') {
                        outputLines.push("");
                        outputLines.push("---");
                        outputLines.push("");
                    } else if (config.noteSeparator === 'none') {
                        // Do nothing
                    } else {
                        outputLines.push("");
                    }
                } else {
                    outputLines.push("");
                }
            }
        }
    }

    if (config.showCount) {
        const totalBlocks = matchedBlocks.length;
        const uniqueFiles = new Set(matchedBlocks.map(b => b.file.path)).size;
        const resultText = totalBlocks === 1 ? 'result' : 'results';
        const fileText = uniqueFiles === 1 ? 'file' : 'files';

        outputLines.push("");
        outputLines.push(`<div class="moc-count">${totalBlocks} ${resultText} in ${uniqueFiles} ${fileText}</div>`);
    }

    const markdownText = outputLines.join('\n');
    return { markdownText, taskRefs, tasksTransformed, segments: buildSegments(outputLines, blockRanges) };
}
export async function processMocBlock(
    config: MocConfig,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
    app: App,
    sourcePath: string,
    settings: MOCPluginSettings
) {
    const wrapper = el.createDiv({ cls: 'moc-wrapper' });

    const toolbar = wrapper.createDiv({ cls: 'moc-toolbar' });

    const copyButton = toolbar.createEl('button', {
        text: 'Copy',
        cls: 'moc-bake-button',
        title: 'Copy as Markdown'
    });

    const bakeButton = toolbar.createEl('button', {
        text: 'Bake',
        cls: 'moc-bake-button',
        title: 'Bake dynamic block to static Markdown'
    });

    const container = wrapper.createDiv({ cls: 'moc-container' });

    // Determine folderPath and isRecursive for the MocRenderChild
    let folderPath = '';
    let isRecursive = false;

    if (config.folder && typeof config.folder === 'string') {
        let expandedFolder = config.folder;
        const sourceFile = app.vault.getAbstractFileByPath(sourcePath);
        if (sourceFile && sourceFile instanceof TFile) {
            expandedFolder = expandedFolder.replace(/\{\{this\.filename\}\}/g, sourceFile.basename);
            const folderName = sourceFile.parent ? sourceFile.parent.name : '';
            expandedFolder = expandedFolder.replace(/\{\{this\.folder\}\}/g, folderName);
            const pathNoExt = sourceFile.path.replace(/\.md$/, '');
            expandedFolder = expandedFolder.replace(/\{\{this\.path\}\}/g, pathNoExt);
        }
        folderPath = expandedFolder.trim().replace(/^\/+|\/+$/g, '');
        isRecursive = config.recursive === true;
    }

    const childComponent = new MocRenderChild(
        container,
        config,
        app,
        sourcePath,
        settings,
        folderPath,
        isRecursive,
        el,
        ctx
    );
    childComponent.wrapper = wrapper;
    childComponent.container = container;
    ctx.addChild(childComponent);

    copyButton.onClickEvent(async (e) => {
        e.preventDefault();
        const result = await generateMocMarkdown(config, app, sourcePath, settings);
        if (result.markdownText) {
            await navigator.clipboard.writeText(result.markdownText);
            new Notice("Copied to clipboard");
        } else {
            new Notice("Could not copy to clipboard: " + (result.error || "Unknown error"));
        }
    });

    bakeButton.onClickEvent(async (e) => {
        e.preventDefault();
        const sectionInfo = ctx.getSectionInfo(el);
        if (!sectionInfo) {
            new Notice("Could not determine section to bake");
            return;
        }
        const file = app.vault.getAbstractFileByPath(sourcePath);
        if (file instanceof TFile) {
            const result = await generateMocMarkdown(config, app, sourcePath, settings);
            if (result.markdownText) {
                await app.vault.process(file, (data) => {
                    const lines = data.split(/\r?\n/);
                    lines.splice(sectionInfo.lineStart, sectionInfo.lineEnd - sectionInfo.lineStart + 1, result.markdownText as string);
                    return lines.join('\n');
                });
                new Notice("Block baked");
            } else {
                new Notice("Could not bake block: " + (result.error || "Unknown error"));
            }
        } else {
             new Notice("Source file not found");
        }
    });

    // Initial render
    await childComponent.renderMoc();
}
