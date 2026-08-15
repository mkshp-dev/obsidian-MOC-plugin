import { App, AbstractInputSuggest, TFolder } from 'obsidian';

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function getFrontmatterKeys(app: App, folderPath: string): string[] {
    const keys = new Set<string>();
    const normalized = folderPath.trim().replace(/^\/+|\/+$/g, '');
    for (const file of app.vault.getMarkdownFiles()) {
        const parentPath = file.parent ? file.parent.path.replace(/^\/+|\/+$/g, '') : '';
        const inFolder =
            normalized === '' ||
            parentPath === normalized ||
            parentPath.startsWith(normalized + '/');
        if (inFolder) {
            const cache = app.metadataCache.getFileCache(file);
            if (cache?.frontmatter) {
                for (const key of Object.keys(cache.frontmatter)) {
                    if (key !== 'position') keys.add(key);
                }
            }
        }
    }
    return Array.from(keys).sort();
}

export function getKnownTags(app: App): string[] {
    const tags = new Set<string>();
    for (const file of app.vault.getMarkdownFiles()) {
        const cache = app.metadataCache.getFileCache(file);
        if (cache?.tags) {
            for (const tagCache of cache.tags) {
                tags.add(tagCache.tag);
            }
        }
        const frontmatter: Record<string, unknown> | undefined = cache?.frontmatter;
        if (frontmatter && 'tags' in frontmatter) {
            const fmTags: unknown = frontmatter['tags'];
            if (Array.isArray(fmTags)) {
                for (const t of fmTags) {
                    if (typeof t === 'string') {
                        tags.add(t.startsWith('#') ? t : `#${t}`);
                    }
                }
            } else if (typeof fmTags === 'string') {
                for (const t of fmTags.split(/[\s,]+/)) {
                    const trimmed = t.trim();
                    if (trimmed) {
                        tags.add(trimmed.startsWith('#') ? trimmed : `#${trimmed}`);
                    }
                }
            }
        }
    }
    return Array.from(tags).sort();
}

// ─── FolderSuggest ───────────────────────────────────────────────────────────
// Used on the main "folder" field. Suggests all vault folders.

export class FolderSuggest extends AbstractInputSuggest<string> {
    private inputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.inputEl = inputEl;
    }

    getSuggestions(query: string): string[] {
        const lower = query.toLowerCase();
        const results: string[] = [];

        // Include vault root option when query is empty or matches
        if (lower === '' || '(entire vault)'.includes(lower)) {
            results.push('');
        }

        for (const f of this.app.vault.getAllLoadedFiles()) {
            if (f instanceof TFolder && f.path !== '/' && f.path.toLowerCase().contains(lower)) {
                results.push(f.path);
            }
        }

        return results.sort((a, b) => {
            if (a === '') return -1;
            if (b === '') return 1;
            return a.localeCompare(b);
        });
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.setText(value || '/ (entire vault)');
    }

    selectSuggestion(value: string): void {
        this.inputEl.value = value;
        this.inputEl.dispatchEvent(new Event('input'));
        this.close();
    }
}

// ─── MultiTokenFolderSuggest ─────────────────────────────────────────────────
// Used on excludeFolder. Autocompletes the last comma-separated token,
// restricted to subfolders inside the selected folder.

export class MultiTokenFolderSuggest extends AbstractInputSuggest<string> {
    private inputEl: HTMLInputElement;
    private getFolder: () => string;

    constructor(app: App, inputEl: HTMLInputElement, getFolder: () => string) {
        super(app, inputEl);
        this.inputEl = inputEl;
        this.getFolder = getFolder;
    }

    private currentToken(value: string): string {
        const parts = value.split(',');
        return (parts[parts.length - 1] ?? '').trimStart();
    }

    getSuggestions(query: string): string[] {
        const token = this.currentToken(query).toLowerCase();
        const baseFolder = this.getFolder().trim().replace(/^\/+|\/+$/g, '');
        const results: string[] = [];

        for (const f of this.app.vault.getAllLoadedFiles()) {
            if (f instanceof TFolder && f.path !== '/') {
                const folderPath = f.path.replace(/^\/+|\/+$/g, '');
                
                // If a base folder is specified, only include folders inside it
                if (baseFolder !== '') {
                    if (!folderPath.startsWith(baseFolder + '/') && folderPath !== baseFolder) {
                        continue;
                    }
                }

                if (folderPath.toLowerCase().contains(token)) {
                    results.push(folderPath);
                }
            }
        }
        return results.sort((a, b) => a.localeCompare(b));
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.setText(value);
    }

    selectSuggestion(value: string): void {
        const parts = this.inputEl.value.split(',');
        const prefix = parts.slice(0, -1).join(',');
        this.inputEl.value = prefix ? `${prefix}, ${value}` : value;
        this.inputEl.dispatchEvent(new Event('input'));
        this.close();
    }
}

// ─── MultiTokenFileSuggest ───────────────────────────────────────────────────
// Used on excludeFile. Autocompletes the last comma-separated token,
// restricted to files inside the selected folder.

export class MultiTokenFileSuggest extends AbstractInputSuggest<string> {
    private inputEl: HTMLInputElement;
    private getFolder: () => string;

    constructor(app: App, inputEl: HTMLInputElement, getFolder: () => string) {
        super(app, inputEl);
        this.inputEl = inputEl;
        this.getFolder = getFolder;
    }

    private currentToken(value: string): string {
        const parts = value.split(',');
        return (parts[parts.length - 1] ?? '').trimStart();
    }

    getSuggestions(query: string): string[] {
        const token = this.currentToken(query).toLowerCase();
        const baseFolder = this.getFolder().trim().replace(/^\/+|\/+$/g, '');

        return this.app.vault
            .getMarkdownFiles()
            .filter(f => {
                if (baseFolder !== '') {
                    const parentPath = f.parent ? f.parent.path.replace(/^\/+|\/+$/g, '') : '';
                    if (parentPath !== baseFolder && !parentPath.startsWith(baseFolder + '/')) {
                        return false;
                    }
                }
                return true;
            })
            .map(f => f.path.replace(/\.md$/, ''))
            .filter(p => p.toLowerCase().contains(token))
            .sort((a, b) => a.localeCompare(b))
            .slice(0, 50);
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.setText(value);
    }

    selectSuggestion(value: string): void {
        const parts = this.inputEl.value.split(',');
        const prefix = parts.slice(0, -1).join(',');
        this.inputEl.value = prefix ? `${prefix}, ${value}` : value;
        this.inputEl.dispatchEvent(new Event('input'));
        this.close();
    }
}

// ─── PropertyKeySuggest ──────────────────────────────────────────────────────
// Used on the groupBy "property key" field. Scans frontmatter from the
// currently selected folder to suggest real property names.

export class PropertyKeySuggest extends AbstractInputSuggest<string> {
    private inputEl: HTMLInputElement;
    private getFolder: () => string;

    constructor(app: App, inputEl: HTMLInputElement, getFolder: () => string) {
        super(app, inputEl);
        this.inputEl = inputEl;
        this.getFolder = getFolder;
    }

    getSuggestions(query: string): string[] {
        const lower = query.toLowerCase();
        return getFrontmatterKeys(this.app, this.getFolder())
            .filter(k => k.toLowerCase().contains(lower));
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.setText(value);
    }

    selectSuggestion(value: string): void {
        this.inputEl.value = value;
        this.inputEl.dispatchEvent(new Event('input'));
        this.close();
    }
}

// ─── TemplateSuggest ─────────────────────────────────────────────────────────
// Used on the template textarea. Triggers when the user types {{ and suggests
// the four available placeholders.

const TEMPLATE_PLACEHOLDERS = ['{{content}}', '{{file}}', '{{path}}', '{{link}}'];

export class TemplateSuggest extends AbstractInputSuggest<string> {
    private inputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.inputEl = inputEl;
    }

    getSuggestions(query: string): string[] {
        const cursor = this.inputEl.selectionStart ?? query.length;
        const before = query.substring(0, cursor);
        const openBrace = before.lastIndexOf('{{');
        if (openBrace === -1) return [];
        // Don't suggest if already closed
        if (before.indexOf('}}', openBrace) !== -1) return [];
        const partial = before.substring(openBrace + 2).toLowerCase();
        return TEMPLATE_PLACEHOLDERS.filter(p =>
            p.replace(/^\{\{|\}\}$/g, '').toLowerCase().startsWith(partial)
        );
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.setText(value);
    }

    selectSuggestion(value: string): void {
        const cursor = this.inputEl.selectionStart ?? this.inputEl.value.length;
        const full = this.inputEl.value;
        const before = full.substring(0, cursor);
        const openBrace = before.lastIndexOf('{{');
        if (openBrace === -1) return;
        const newValue = full.substring(0, openBrace) + value + full.substring(cursor);
        this.inputEl.value = newValue;
        const newCursor = openBrace + value.length;
        this.inputEl.setSelectionRange(newCursor, newCursor);
        this.inputEl.dispatchEvent(new Event('input'));
        this.close();
    }
}

// ─── FilterSuggest ────────────────────────────────────────────────────────────
// Smart filter autocomplete with three context modes:
//   1. Inside properties( → suggests real frontmatter keys from selected folder
//   2. Inside has_tag("  → suggests real tags from metadata cache
//   3. Default           → function tokens with properties() pre-filled with real keys

export class FilterSuggest extends AbstractInputSuggest<string> {
    private inputEl: HTMLInputElement;
    private getElement: () => string;
    private getFolder: () => string;

    constructor(
        app: App,
        inputEl: HTMLInputElement,
        getElement: () => string,
        getFolder: () => string
    ) {
        super(app, inputEl);
        this.inputEl = inputEl;
        this.getElement = getElement;
        this.getFolder = getFolder;
    }

    getSuggestions(inputStr: string): string[] {
        const cursor = this.inputEl.selectionStart ?? inputStr.length;
        const before = inputStr.substring(0, cursor);

        // Context 1: completing a property key inside properties(key...
        const propKeyMatch = before.match(/properties\(\s*([a-zA-Z0-9_-]*)$/);
        if (propKeyMatch) {
            const partial = (propKeyMatch[1] ?? '').toLowerCase();
            return getFrontmatterKeys(this.app, this.getFolder())
                .filter(k => k.toLowerCase().startsWith(partial));
        }

        // Context 2: completing a tag inside has_tag("partial...
        const tagMatch = before.match(/has_tag\(\s*["']([^"']*)$/);
        if (tagMatch) {
            const partial = (tagMatch[1] ?? '').toLowerCase();
            return getKnownTags(this.app)
                .filter(t => t.toLowerCase().startsWith(partial));
        }

        // Context 3: default — suggest full function/operator tokens
        const wordMatch = before.match(/([a-zA-Z_]+)$/);
        const currentWord = wordMatch ? (wordMatch[1] ?? '') : '';

        const isTaskOrList = this.getElement() === 'Task' || this.getElement() === 'List';
        const propKeys = getFrontmatterKeys(this.app, this.getFolder());

        // Build properties() suggestions using real keys if available
        const propSuggestions = propKeys.length > 0
            ? propKeys.flatMap(k => [
                `properties(${k} == "")`,
                `properties(${k} != "")`,
                `properties(${k} > "")`,
                `properties(${k} >= "")`,
                `properties(${k} < "")`,
                `properties(${k} <= "")`,
            ])
            : [
                'properties( == "")',
                'properties( != "")',
                'properties( > "")',
                'properties( >= "")',
                'properties( < "")',
                'properties( <= "")',
            ];

        const suggestions = [
            'contains("")',
            'matches("")',
            'has_tag("")',
            ...(isTaskOrList ? ['is_completed()', 'is_incomplete()'] : []),
            ...propSuggestions,
            'AND',
            'OR',
            'NOT',
        ];

        if (!currentWord) return suggestions;
        return suggestions.filter(s => s.toLowerCase().startsWith(currentWord.toLowerCase()));
    }

    renderSuggestion(suggestion: string, el: HTMLElement): void {
        el.setText(suggestion);
    }

    selectSuggestion(suggestion: string): void {
        const cursor = this.inputEl.selectionStart ?? this.inputEl.value.length;
        const inputStr = this.inputEl.value;
        const before = inputStr.substring(0, cursor);

        // Context 1: splice a property key into properties(
        const propKeyMatch = before.match(/^(.*properties\(\s*)([a-zA-Z0-9_-]*)$/);
        if (propKeyMatch && !suggestion.startsWith('properties(')) {
            const prefix = propKeyMatch[1]!;
            const after = inputStr.substring(cursor);
            this.inputEl.value = prefix + suggestion + after;
            const pos = prefix.length + suggestion.length;
            this.inputEl.setSelectionRange(pos, pos);
            this.inputEl.dispatchEvent(new Event('input'));
            return;
        }

        // Context 2: splice a tag into has_tag("
        const tagMatch = before.match(/^(.*has_tag\(\s*["'])([^"']*)$/);
        if (tagMatch && !suggestion.startsWith('has_tag(')) {
            const prefix = tagMatch[1]!;
            const after = inputStr.substring(cursor);
            this.inputEl.value = prefix + suggestion + after;
            const pos = prefix.length + suggestion.length;
            this.inputEl.setSelectionRange(pos, pos);
            this.inputEl.dispatchEvent(new Event('input'));
            return;
        }

        // Context 3: replace the current word token
        const wordMatch = before.match(/([a-zA-Z_]+)$/);
        const wordLen = wordMatch ? (wordMatch[1]!.length) : 0;
        const start = inputStr.substring(0, cursor - wordLen);
        const end = inputStr.substring(cursor);
        this.inputEl.value = start + suggestion + end;

        // Land cursor between quotes when present (e.g. contains(""))
        const quoteIdx = suggestion.lastIndexOf('""');
        const newCursor = quoteIdx !== -1
            ? start.length + quoteIdx + 1
            : start.length + suggestion.length;

        this.inputEl.setSelectionRange(newCursor, newCursor);
        this.inputEl.dispatchEvent(new Event('input'));
    }
}
