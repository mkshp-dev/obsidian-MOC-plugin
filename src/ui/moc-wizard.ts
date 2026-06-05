/* eslint-disable obsidianmd/ui/sentence-case */
import { App, Modal, Setting, MarkdownView } from 'obsidian';

export class MocWizardModal extends Modal {
    folder: string = '';
    element: string = 'List';
    recursive: boolean = false;
    filterType: string = 'has_word';
    filterValue: string = '';
    private filterValueSetting: Setting | null = null;

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
                .setPlaceholder('E.g. diary')
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
            .setName('Filter type')
            .setDesc('The matching condition to apply')
            .addDropdown(drop => drop
                .addOption('has_word', 'has_word')
                .addOption('contains', 'contains')
                .addOption('has_text', 'has_text')
                .addOption('matches', 'matches')
                .addOption('has_tag', 'has_tag')
                .addOption('is_completed', 'is_completed')
                .addOption('is_incomplete', 'is_incomplete')
                .setValue(this.filterType)
                .onChange(value => {
                    this.filterType = value;
                    this.updateFilterValueVisibility();
                }));

        this.filterValueSetting = new Setting(contentEl)
            .setName('Filter value')
            .setDesc('The value for the filter function')
            .addText(text => text
                .setPlaceholder('e.g., MOC')
                .setValue(this.filterValue)
                .onChange(value => {
                    this.filterValue = value;
                }));

        this.updateFilterValueVisibility();

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Insert MOC block')
                .setCta()
                .onClick(() => {
                    this.insertMocBlock();
                    this.close();
                }));
    }

    updateFilterValueVisibility() {
        if (!this.filterValueSetting) return;

        const isBoolFilter = this.filterType === 'is_completed' || this.filterType === 'is_incomplete';
        if (isBoolFilter) {
            this.filterValueSetting.settingEl.toggle(false);
        } else {
            this.filterValueSetting.settingEl.toggle(true);
        }
    }

    insertMocBlock() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
            const editor = view.editor;
            let filterString = '';
            if (this.filterType === 'is_completed' || this.filterType === 'is_incomplete') {
                filterString = `${this.filterType}()`;
            } else {
                filterString = `${this.filterType}("${this.filterValue}")`;
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
