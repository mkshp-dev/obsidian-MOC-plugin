import { App, Modal, Setting, MarkdownView, AbstractInputSuggest, Notice } from 'obsidian';

class FilterSuggest extends AbstractInputSuggest<string> {
    textInputEl: HTMLInputElement;

    constructor(app: App, textInputEl: HTMLInputElement) {
        super(app, textInputEl);
        this.textInputEl = textInputEl;
    }

    getSuggestions(inputStr: string): string[] {
        const cursorPosition = this.textInputEl.selectionStart || 0;
        const textBeforeCursor = inputStr.substring(0, cursorPosition);

        // Find the word we are currently typing (it might be part of an operator or function)
        const match = textBeforeCursor.match(/([a-zA-Z_]+)$/);
        const currentWord = match ? match[1] : '';

        const suggestions = [
            'has_word("")',
            'contains("")',
            'has_text("")',
            'matches("")',
            'has_tag("")',
            'is_completed()',
            'is_incomplete()',
            'properties( == "")',
            'AND',
            'OR',
            'NOT'
        ];

        if (!currentWord) {
            return suggestions;
        }

        return suggestions.filter(s => s.toLowerCase().startsWith(currentWord.toLowerCase()));
    }

    renderSuggestion(suggestion: string, el: HTMLElement): void {
        el.setText(suggestion);
    }

    selectSuggestion(suggestion: string): void {
        const cursorPosition = this.textInputEl.selectionStart || 0;
        const inputStr = this.textInputEl.value;
        const textBeforeCursor = inputStr.substring(0, cursorPosition);

        const match = textBeforeCursor.match(/([a-zA-Z_]+)$/);
        const currentWordLength = match ? match[1]!.length : 0;

        const start = inputStr.substring(0, cursorPosition - currentWordLength);
        const end = inputStr.substring(cursorPosition);

        const newValue = start + suggestion + end;
        this.textInputEl.value = newValue;

        // Adjust cursor position if there are quotes or parens
        let newCursorPos = start.length + suggestion.length;
        if (suggestion.endsWith('("")')) {
            newCursorPos -= 2; // put cursor between quotes
        } else if (suggestion === 'properties( == "")') {
            newCursorPos -= 7; // put cursor right before ==
        }

        this.textInputEl.setSelectionRange(newCursorPos, newCursorPos);

        // Trigger input event so the setting value gets updated
        this.textInputEl.dispatchEvent(new Event('input'));
    }
}


export class MocWizardModal extends Modal {
    folder: string = '';
    element: string = 'List';
    recursive: boolean = false;
    filterString: string = '';
    groupBy: string = '';
    sortField: string = '';
    sortDirection: string = 'asc';
    limit: string = '';

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Create map of content block' });

        new Setting(contentEl)
            .setName('Folder')
            .setDesc('The vault folder to search in')
            .addText(text => text
                .setPlaceholder('Example: diary')
                .setValue(this.folder)
                .onChange(value => {
                    this.folder = value;
                }));

        new Setting(contentEl)
            .setName('Element')
            .setDesc('Type of element to extract')
            .addDropdown(drop => drop
                .addOption('List', 'List')
                .addOption('Task', 'Task')
                .addOption('Heading', 'Heading')
                .addOption('Paragraph', 'Paragraph')
                .addOption('Blockquote', 'Blockquote')
                .setValue(this.element)
                .onChange(value => {
                    this.element = value;
                }));

        new Setting(contentEl)
            .setName('Recursive')
            .setDesc('Include subfolders')
            .addToggle(toggle => toggle
                .setValue(this.recursive)
                .onChange(value => {
                    this.recursive = value;
                }));

        new Setting(contentEl)
            .setName('Filter string')
            .setDesc('Type the complex logical filter condition')
            .addText(text => {
                text.setPlaceholder('Example: has_word("moc")');
                text.setValue(this.filterString);
                text.onChange(value => {
                    this.filterString = value;
                });

                // Add autocomplete suggester
                new FilterSuggest(this.app, text.inputEl);
            });

        contentEl.createEl('h3', { text: 'Optional result shaping' });

        new Setting(contentEl)
            .setName('Group by')
            .setDesc('Group results by a property')
            .addDropdown(drop => drop
                .addOption('', 'None')
                .addOption('folder', 'Folder')
                .addOption('tag', 'Tag')
                .addOption('cday', 'Creation day')
                .addOption('mday', 'Modification day')
                .setValue(this.groupBy)
                .onChange(value => {
                    this.groupBy = value;
                }));

        new Setting(contentEl)
            .setName('Sort')
            .setDesc('Sort results by a field')
            .addDropdown(drop => drop
                .addOption('', 'None')
                .addOption('name', 'Name')
                .addOption('ctime', 'Creation time')
                .addOption('mtime', 'Modification time')
                .setValue(this.sortField)
                .onChange(value => {
                    this.sortField = value;
                }))
            .addDropdown(drop => drop
                .addOption('asc', 'Ascending')
                .addOption('desc', 'Descending')
                .setValue(this.sortDirection)
                .onChange(value => {
                    this.sortDirection = value;
                }));

        new Setting(contentEl)
            .setName('Limit')
            .setDesc('Maximum number of results (positive integer)')
            .addText(text => text
                .setPlaceholder('Example: 10')
                .setValue(this.limit)
                .onChange(value => {
                    this.limit = value;
                }));

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Insert block')
                .setCta()
                .onClick(() => {
                    this.insertMocBlock();
                    this.close();
                }));
    }



    insertMocBlock() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
            const editor = view.editor;
            const filterString = this.filterString;

            if (this.limit) {
                if (!/^[1-9]\d*$/.test(this.limit)) {
                    new Notice('Limit must be a positive integer');
                    return;
                }
            }

            const yamlLines = [
                '```moc',
                `folder: ${this.folder}`,
                `element: ${this.element}`,
                `filter: ${filterString}`,
            ];

            if (this.recursive) {
                yamlLines.push('recursive: true');
            }

            if (this.groupBy) {
                yamlLines.push(`groupBy: ${this.groupBy}`);
            }

            if (this.sortField) {
                yamlLines.push(`sort: ${this.sortField} ${this.sortDirection}`);
            }

            if (this.limit) {
                yamlLines.push(`limit: ${this.limit}`);
            }

            yamlLines.push('```\n');

            const block = yamlLines.join('\n');
            editor.replaceSelection(block);
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
