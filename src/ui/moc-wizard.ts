import { App, Modal, Setting, MarkdownView, Notice } from 'obsidian';
import MOCPlugin from '../main';
import {
    FolderSuggest,
    MultiTokenFolderSuggest,
    MultiTokenFileSuggest,
    PropertyKeySuggest,
    TemplateSuggest,
    FilterSuggest,
} from './moc-wizard-suggests';

export class MocWizardModal extends Modal {
    folder: string = '';
    element: string = 'List';
    recursive: boolean = false;
    filterString: string = '';
    groupBy: string = '';
    propertyKey: string = '';
    sortField: string = '';
    sortDirection: string = 'asc';
    limit: string = '';
    offset: string = '';
    plugin: MOCPlugin;
    applyFnR: string[] = [];
    template: string = '';
    blockSeparator: string = 'none';
    noteSeparator: string = 'newline';
    showCount: boolean = false;
    excludeFolder: string = '';
    excludeFile: string = '';

    constructor(app: App, plugin: MOCPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Create map of content block' });

        new Setting(contentEl)
            .setName('Folder')
            .setDesc('The vault folder to search in (autocomplete supported)')
            .addText(text => {
                text.setPlaceholder('Example: diary (leave blank for entire vault)')
                    .setValue(this.folder)
                    .onChange(value => {
                        this.folder = value;
                    });
                new FolderSuggest(this.app, text.inputEl);
            });

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
            .setName('Exclude folder')
            .setDesc('Folder(s) to exclude (comma separated, autocomplete supported)')
            .addText(text => {
                text.setPlaceholder('Example: Archive, secret')
                    .setValue(this.excludeFolder)
                    .onChange(value => {
                        this.excludeFolder = value;
                    });
                new MultiTokenFolderSuggest(this.app, text.inputEl, () => this.folder);
            });

        new Setting(contentEl)
            .setName('Exclude file')
            .setDesc('File(s) to exclude (comma separated, autocomplete supported)')
            .addText(text => {
                text.setPlaceholder('Example: Templates/daily')
                    .setValue(this.excludeFile)
                    .onChange(value => {
                        this.excludeFile = value;
                    });
                new MultiTokenFileSuggest(this.app, text.inputEl, () => this.folder);
            });

        new Setting(contentEl)
            .setName('Filter string')
            .setDesc('Filter condition with context-aware autocomplete for functions, tags & frontmatter properties')
            .addText(text => {
                text.setPlaceholder('Example: has_word("moc")');
                text.setValue(this.filterString);
                text.onChange(value => {
                    this.filterString = value;
                });

                new FilterSuggest(
                    this.app,
                    text.inputEl,
                    () => this.element,
                    () => this.folder
                );
            });

        contentEl.createEl('h3', { text: 'Optional result shaping' });

        new Setting(contentEl)
            .setName('Show count')
            .setDesc('Append a result count summary and show counts on group headings')
            .addToggle(toggle => toggle
                .setValue(this.showCount)
                .onChange(value => {
                    this.showCount = value;
                }));

        const propertySettingEl = contentEl.createDiv();

        new Setting(contentEl)
            .setName('Group by')
            .setDesc('Group results by a property')
            .addDropdown(drop => drop
                .addOption('', 'None')
                .addOption('folder', 'Folder')
                .addOption('tag', 'Tag')
                .addOption('cday', 'Creation day')
                .addOption('mday', 'Modification day')
                .addOption('property', 'Property...')
                .setValue(this.groupBy)
                .onChange(value => {
                    this.groupBy = value;
                    this.renderPropertySetting(propertySettingEl);
                }));

        this.renderPropertySetting(propertySettingEl);

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
            .setName('Offset')
            .setDesc('Number of results to skip (non-negative integer)')
            .addText(text => text
                .setPlaceholder('Example: 5')
                .setValue(this.offset)
                .onChange(value => {
                    this.offset = value;
                }));

        new Setting(contentEl)
            .setName('Block separator')
            .setDesc('Separator between extracted blocks')
            .addDropdown(drop => drop
                .addOption('none', 'None')
                .addOption('divider', 'Divider line')
                .addOption('newline', 'Empty line')
                .setValue(this.blockSeparator)
                .onChange(value => {
                    this.blockSeparator = value;
                }));

        new Setting(contentEl)
            .setName('Note separator')
            .setDesc('Separator between different notes')
            .addDropdown(drop => drop
                .addOption('newline', 'Empty line')
                .addOption('divider', 'Divider line')
                .addOption('none', 'None')
                .setValue(this.noteSeparator)
                .onChange(value => {
                    this.noteSeparator = value;
                }));

        new Setting(contentEl)
            .setName('Template (optional)')
            .setDesc('Custom output format using placeholders (type {{ for suggestions)')
            .addText(text => {
                text.setPlaceholder('- {{content}} — [[{{path}}|{{file}}]]')
                    .setValue(this.template)
                    .onChange(value => {
                        this.template = value;
                    });
                new TemplateSuggest(this.app, text.inputEl);
            });

        contentEl.createEl('h3', { text: 'Find and replace (optional)' });

        const ruleChainContainer = contentEl.createDiv({ cls: 'moc-rule-chain-container' });
        this.renderRuleChain(ruleChainContainer);

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Insert block')
                .setCta()
                .onClick(() => {
                    this.insertMocBlock();
                    this.close();
                }));
    }

    renderPropertySetting(containerEl: HTMLElement) {
        containerEl.empty();
        if (this.groupBy === 'property') {
            new Setting(containerEl)
                .setName('Property key')
                .setDesc('Enter or select frontmatter property key (e.g., status, project)')
                .addText(text => {
                    text.setPlaceholder('Property key...')
                        .setValue(this.propertyKey)
                        .onChange(value => {
                            this.propertyKey = value;
                        });
                    new PropertyKeySuggest(this.app, text.inputEl, () => this.folder);
                });
        }
    }

    renderRuleChain(containerEl: HTMLElement) {
        containerEl.empty();

        const rules = this.plugin.settings.rules || [];
        if (rules.length === 0) {
            containerEl.createEl('p', { text: 'No rules defined yet. Define them in settings first.', cls: 'moc-no-rules' });
            return;
        }

        // 1. Render currently selected rules in order
        const selectedList = containerEl.createDiv({ cls: 'moc-wizard-selected-rules' });
        if (this.applyFnR.length === 0) {
            selectedList.createEl('p', { text: 'No rules selected yet.', cls: 'moc-no-rules' });
        } else {
            for (let i = 0; i < this.applyFnR.length; i++) {
                const ruleName = this.applyFnR[i];
                const rule = rules.find(r => r.name === ruleName);
                if (!rule) continue;

                const row = selectedList.createDiv({ cls: 'moc-rule-chain-item' });

                const nameSpan = row.createSpan({ cls: 'moc-rule-chain-name' });
                nameSpan.createEl('strong', { text: `${i + 1}. ${rule.name}` });
                nameSpan.createSpan({ text: ` (Find: "${rule.find}" ➔ Replace: "${rule.replace}")`, cls: 'moc-rule-chain-details' });

                const buttons = row.createDiv({ cls: 'moc-rule-chain-buttons' });

                // Move Up button
                const upBtn = buttons.createEl('button', { text: '▲', title: 'Move up' });
                if (i === 0) {
                    upBtn.disabled = true;
                } else {
                    upBtn.onClickEvent((e) => {
                        e.preventDefault();
                        const temp = this.applyFnR[i];
                        this.applyFnR[i] = this.applyFnR[i - 1]!;
                        this.applyFnR[i - 1] = temp!;
                        this.renderRuleChain(containerEl);
                    });
                }

                // Move Down button
                const downBtn = buttons.createEl('button', { text: '▼', title: 'Move down' });
                if (i === this.applyFnR.length - 1) {
                    downBtn.disabled = true;
                } else {
                    downBtn.onClickEvent((e) => {
                        e.preventDefault();
                        const temp = this.applyFnR[i];
                        this.applyFnR[i] = this.applyFnR[i + 1]!;
                        this.applyFnR[i + 1] = temp!;
                        this.renderRuleChain(containerEl);
                    });
                }

                // Remove button
                const removeBtn = buttons.createEl('button', { text: 'Remove', cls: 'mod-warning' });
                removeBtn.onClickEvent((e) => {
                    e.preventDefault();
                    this.applyFnR.splice(i, 1);
                    this.renderRuleChain(containerEl);
                });
            }
        }

        // 2. Render Add Dropdown at the bottom if there are remaining rules
        const remainingRules = rules.filter(r => !this.applyFnR.includes(r.name));
        if (remainingRules.length > 0) {
            const dropdownOptions: Record<string, string> = { '': 'Select a rule to add...' };
            for (const r of remainingRules) {
                dropdownOptions[r.name] = r.name;
            }

            new Setting(containerEl)
                .setName('Add rule to chain')
                .setDesc('Choose a rule to append to the search-and-replace sequence')
                .addDropdown(drop => drop
                    .addOptions(dropdownOptions)
                    .setValue('')
                    .onChange(value => {
                        if (value) {
                            this.applyFnR.push(value);
                            this.renderRuleChain(containerEl);
                        }
                    }));
        }
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

            if (this.offset) {
                if (!/^(0|[1-9]\d*)$/.test(this.offset)) {
                    new Notice('Offset must be a non-negative integer');
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

            if (this.excludeFolder.trim() !== '') {
                const parts = this.excludeFolder.split(',').map(s => s.trim()).filter(s => s !== '');
                if (parts.length === 1) {
                    yamlLines.push(`excludeFolder: ${parts[0]}`);
                } else if (parts.length > 1) {
                    yamlLines.push(`excludeFolder: ${JSON.stringify(parts)}`);
                }
            }

            if (this.excludeFile.trim() !== '') {
                const parts = this.excludeFile.split(',').map(s => s.trim()).filter(s => s !== '');
                if (parts.length === 1) {
                    yamlLines.push(`excludeFile: ${parts[0]}`);
                } else if (parts.length > 1) {
                    yamlLines.push(`excludeFile: ${JSON.stringify(parts)}`);
                }
            }

            if (this.groupBy) {
                if (this.groupBy === 'property' && this.propertyKey) {
                    yamlLines.push(`groupBy: property(${this.propertyKey})`);
                } else if (this.groupBy !== 'property') {
                    yamlLines.push(`groupBy: ${this.groupBy}`);
                }
            }

            if (this.sortField) {
                yamlLines.push(`sort: ${this.sortField} ${this.sortDirection}`);
            }

            if (this.limit) {
                yamlLines.push(`limit: ${this.limit}`);
            }

            if (this.offset) {
                yamlLines.push(`offset: ${this.offset}`);
            }

            if (this.applyFnR.length > 0) {
                if (this.applyFnR.length === 1) {
                    yamlLines.push(`applyFnR: ${this.applyFnR[0]}`);
                } else {
                    yamlLines.push(`applyFnR: ${JSON.stringify(this.applyFnR)}`);
                }
            }

            if (this.template) {
                yamlLines.push(`template: ${JSON.stringify(this.template)}`);
            }

            if (this.blockSeparator && this.blockSeparator !== 'none') {
                yamlLines.push(`blockSeparator: ${this.blockSeparator}`);
            }

            if (this.noteSeparator && this.noteSeparator !== 'newline') {
                yamlLines.push(`noteSeparator: ${this.noteSeparator}`);
            }

            if (this.showCount) {
                yamlLines.push('showCount: true');
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
