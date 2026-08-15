import { App, Modal, Setting, MarkdownView, Notice, setIcon } from 'obsidian';
import MOCPlugin from '../main';
import {
    FolderSuggest,
    MultiTokenFolderSuggest,
    MultiTokenFileSuggest,
    PropertyKeySuggest,
    TypedPropertySuggest,
    TagSuggest,
    TemplateSuggest,
    FilterSuggest,
    DynamicParameterSuggest,
} from './moc-wizard-suggests';
import {
    FilterBuilderNode,
    FilterGroupMode,
    FilterGroupNode,
    FilterPropertyOperator,
    FilterPropertyValueType,
    FilterRuleKind,
    FilterRuleNode,
    compileFilterTree,
    createDefaultFilterGroup,
    createDefaultFilterRule,
    getFilterValidationMessage,
} from './moc-filter-builder';

export class MocWizardModal extends Modal {
    folder: string = '';
    element: string = 'List';
    recursive: boolean = false;
    filterString: string = '';
    filterRoot: FilterGroupNode = createDefaultFilterGroup();
    isRawFilterMode: boolean = false;
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

        // Source section
        contentEl.createEl('h3', { text: 'Source' });
        const sourceContainer = contentEl.createDiv({ cls: 'moc-source-container' });

        // Folder row with Recursive toggle
        const folderRow = sourceContainer.createDiv({ cls: 'moc-shaping-row' });
        const folderLabel = folderRow.createSpan({ text: 'Folder', cls: 'moc-shaping-title' });
        folderLabel.title = 'Root folder to scan for elements';
        const folderGroup = folderRow.createDiv({ cls: 'moc-shaping-input-group' });
        const folderInput = folderGroup.createEl('input', {
            type: 'text',
            placeholder: 'Example: diary (leave blank for entire vault)',
            cls: 'moc-shaping-input',
        });
        folderInput.value = this.folder;
        folderInput.oninput = () => {
            this.folder = folderInput.value;
        };
        new FolderSuggest(this.app, folderInput);

        // Recursive toggle (on same row as Folder)
        const recursiveGroup = folderRow.createDiv({ cls: 'moc-recursive-group' });
        const recursiveSetting = new Setting(recursiveGroup)
            .setClass('moc-recursive-toggle-setting')
            .setName('Recursive')
            .addToggle(toggle => toggle
                .setValue(this.recursive)
                .onChange(value => {
                    this.recursive = value;
                }));
        recursiveSetting.descEl.remove();
        recursiveSetting.nameEl.title = 'Include subfolders in the scan';

        // Element row
        const elementRow = sourceContainer.createDiv({ cls: 'moc-shaping-row' });
        
        // Element dropdown
        const elementLabel = elementRow.createSpan({ text: 'Element', cls: 'moc-shaping-title' });
        elementLabel.createSpan({ text: ' *', cls: 'moc-mandatory-marker' });
        elementLabel.title = 'Type of element to include in the map';
        const elementGroup = elementRow.createDiv({ cls: 'moc-shaping-input-group' });
        const elementSelect = elementGroup.createEl('select', { cls: 'dropdown moc-shaping-select' });
        this.addSelectOption(elementSelect, 'List', 'List');
        this.addSelectOption(elementSelect, 'Task', 'Task');
        this.addSelectOption(elementSelect, 'Heading', 'Heading');
        this.addSelectOption(elementSelect, 'Paragraph', 'Paragraph');
        this.addSelectOption(elementSelect, 'Blockquote', 'Blockquote');
        elementSelect.value = this.element;
        elementSelect.onchange = () => {
            this.element = elementSelect.value;
            this.normalizeTaskFilters(this.filterRoot);
            this.onOpen();
        };

        // Exclude folder row
        const excludeFolderRow = sourceContainer.createDiv({ cls: 'moc-shaping-row' });
        const excludeFolderLabel = excludeFolderRow.createSpan({ text: 'Exclude folder', cls: 'moc-shaping-title' });
        excludeFolderLabel.title = 'Folders to exclude from scan (comma-separated)';
        const excludeFolderGroup = excludeFolderRow.createDiv({ cls: 'moc-shaping-input-group' });
        const excludeFolderInput = excludeFolderGroup.createEl('input', {
            type: 'text',
            placeholder: 'Example: Archive, secret',
            cls: 'moc-shaping-input',
        });
        excludeFolderInput.value = this.excludeFolder;
        excludeFolderInput.oninput = () => {
            this.excludeFolder = excludeFolderInput.value;
        };
        new MultiTokenFolderSuggest(this.app, excludeFolderInput, () => this.folder);

        // Exclude file row
        const excludeFileRow = sourceContainer.createDiv({ cls: 'moc-shaping-row' });
        const excludeFileLabel = excludeFileRow.createSpan({ text: 'Exclude file', cls: 'moc-shaping-title' });
        excludeFileLabel.title = 'Files to exclude from scan (comma-separated)';
        const excludeFileGroup = excludeFileRow.createDiv({ cls: 'moc-shaping-input-group' });
        const excludeFileInput = excludeFileGroup.createEl('input', {
            type: 'text',
            placeholder: 'Example: Templates/daily',
            cls: 'moc-shaping-input',
        });
        excludeFileInput.value = this.excludeFile;
        excludeFileInput.oninput = () => {
            this.excludeFile = excludeFileInput.value;
        };
        new MultiTokenFileSuggest(this.app, excludeFileInput, () => this.folder);

        const filtersHeading = contentEl.createEl('h3', { text: 'Filters' });
        filtersHeading.createSpan({ text: ' *', cls: 'moc-mandatory-marker' });
        const filterBuilderContainer = contentEl.createDiv();
        this.renderFilterBuilder(filterBuilderContainer);

        contentEl.createEl('h3', { text: 'Shaping' });

        const resultShapingContainer = contentEl.createDiv({ cls: 'moc-result-shaping-container' });
        this.renderResultShaping(resultShapingContainer);

        contentEl.createEl('h3', { text: 'Result manipulations' });
        
        const resultManipContainer = contentEl.createDiv({ cls: 'moc-result-manip-container' });
        
        // Template row
        const templateRow = resultManipContainer.createDiv({ cls: 'moc-shaping-row' });
        const templateLabel = templateRow.createSpan({ text: 'Template', cls: 'moc-shaping-title' });
        templateLabel.title = 'Apply a template file to format the output';
        const templateGroup = templateRow.createDiv({ cls: 'moc-shaping-input-group' });
        const templateInput = templateGroup.createEl('input', {
            type: 'text',
            placeholder: 'template-name',
            cls: 'moc-shaping-input',
        });
        templateInput.value = this.template;
        templateInput.oninput = () => {
            this.template = templateInput.value;
        };
        new TemplateSuggest(this.app, templateInput, () => this.plugin.settings.templateFolder || '');
        if (this.template) {
            const clearTemplateBtn = templateRow.createEl('button', {
                cls: 'clickable-icon moc-shaping-trash-btn',
                attr: { 'aria-label': 'Clear template' },
            });
            setIcon(clearTemplateBtn, 'trash-2');
            clearTemplateBtn.onClickEvent((e) => {
                e.preventDefault();
                this.template = '';
                this.onOpen();
            });
        }
        
        // Find and Replace
        const fnrRow = resultManipContainer.createDiv({ cls: 'moc-shaping-row' });
        const fnrLabel = fnrRow.createSpan({ text: 'Find and replace', cls: 'moc-shaping-title' });
        fnrLabel.title = 'Apply text replacements using literal text or regex';
        
        const fnrGroup = fnrRow.createDiv({ cls: 'moc-shaping-input-group' });
        
        const rules = this.plugin.settings.rules || [];
        const remainingRules = rules.filter(r => !this.applyFnR.includes(r.name));
        
        const addSelect = fnrGroup.createEl('select', { cls: 'dropdown moc-shaping-select' });
        this.addSelectOption(addSelect, '', remainingRules.length > 0 ? 'Select a rule to add...' : 'No more rules available');
        for (const r of remainingRules) {
            this.addSelectOption(addSelect, r.name, r.name);
        }
        
        if (remainingRules.length === 0) {
            addSelect.disabled = true;
        }
        
        addSelect.onchange = () => {
            const value = addSelect.value;
            if (value) {
                this.applyFnR.push(value);
                fnrRow.remove();
                this.onOpen();
            }
        };
        
        const ruleChainContainer = resultManipContainer.createDiv({ cls: 'moc-rule-chain-container' });
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

    renderResultShaping(containerEl: HTMLElement) {
        containerEl.empty();

        // 1. Group by section (Bases-style inline row)
        const groupRow = containerEl.createDiv({ cls: 'moc-shaping-row' });
        const groupLabel = groupRow.createSpan({ text: 'Group by', cls: 'moc-shaping-title' });
        groupLabel.title = 'Group results by a category (folder, tag, date, or property)';

        const groupGroup = groupRow.createDiv({ cls: 'moc-shaping-input-group' });

        const groupSelect = groupGroup.createEl('select', { cls: 'dropdown moc-shaping-select' });
        this.addSelectOption(groupSelect, '', 'None');
        this.addSelectOption(groupSelect, 'folder', 'Folder');
        this.addSelectOption(groupSelect, 'tag', 'Tag');
        this.addSelectOption(groupSelect, 'cday', 'Creation day');
        this.addSelectOption(groupSelect, 'mday', 'Modification day');
        this.addSelectOption(groupSelect, 'property', 'Property...');
        groupSelect.value = this.groupBy;
        groupSelect.onchange = () => {
            this.groupBy = groupSelect.value;
            if (this.groupBy !== 'property') {
                this.propertyKey = '';
            }
            this.renderResultShaping(containerEl);
        };

        if (this.groupBy === 'property') {
            const propInput = groupGroup.createEl('input', {
                type: 'text',
                placeholder: 'Property key...',
                cls: 'moc-shaping-input',
            });
            propInput.value = this.propertyKey;
            propInput.oninput = () => {
                this.propertyKey = propInput.value;
            };
            new PropertyKeySuggest(this.app, propInput, () => this.folder);
        }

        if (this.groupBy) {
            const clearGroupBtn = groupRow.createEl('button', {
                cls: 'clickable-icon moc-shaping-trash-btn',
                attr: { 'aria-label': 'Clear group by' },
            });
            setIcon(clearGroupBtn, 'trash-2');
            clearGroupBtn.onClickEvent((e) => {
                e.preventDefault();
                this.groupBy = '';
                this.propertyKey = '';
                this.renderResultShaping(containerEl);
            });
        }

        // 2. Sort by section (Bases-style inline row)
        const sortRow = containerEl.createDiv({ cls: 'moc-shaping-row' });
        const sortLabel = sortRow.createSpan({ text: 'Sort by', cls: 'moc-shaping-title' });
        sortLabel.title = 'Sort results by name or date';

        const sortGroup = sortRow.createDiv({ cls: 'moc-shaping-input-group' });

        const sortSelect = sortGroup.createEl('select', { cls: 'dropdown moc-shaping-select' });
        this.addSelectOption(sortSelect, '', 'None');
        this.addSelectOption(sortSelect, 'name', 'Name');
        this.addSelectOption(sortSelect, 'ctime', 'Creation time');
        this.addSelectOption(sortSelect, 'mtime', 'Modification time');
        sortSelect.value = this.sortField;
        sortSelect.onchange = () => {
            this.sortField = sortSelect.value;
            this.renderResultShaping(containerEl);
        };

        if (this.sortField) {
            const dirSelect = sortGroup.createEl('select', { cls: 'dropdown moc-shaping-select-dir' });
            if (this.sortField === 'name') {
                this.addSelectOption(dirSelect, 'asc', 'A → Z');
                this.addSelectOption(dirSelect, 'desc', 'Z → A');
            } else {
                this.addSelectOption(dirSelect, 'asc', 'Old → New');
                this.addSelectOption(dirSelect, 'desc', 'New → Old');
            }
            dirSelect.value = this.sortDirection;
            dirSelect.onchange = () => {
                this.sortDirection = dirSelect.value;
            };

            const clearSortBtn = sortRow.createEl('button', {
                cls: 'clickable-icon moc-shaping-trash-btn',
                attr: { 'aria-label': 'Clear sort by' },
            });
            setIcon(clearSortBtn, 'trash-2');
            clearSortBtn.onClickEvent((e) => {
                e.preventDefault();
                this.sortField = '';
                this.sortDirection = 'asc';
                this.renderResultShaping(containerEl);
            });
        }

        // 3. Limit, Offset, and Show count section
        const optionsRow = containerEl.createDiv({ cls: 'moc-shaping-options-row' });

        // Limit input group
        const limitGroup = optionsRow.createDiv({ cls: 'moc-shaping-pill-item' });
        const limitLabel = limitGroup.createSpan({ text: 'Limit', cls: 'moc-shaping-pill-label' });
        limitLabel.title = 'Maximum number of results to include';
        const limitInput = limitGroup.createEl('input', {
            type: 'number',
            placeholder: 'All',
            cls: 'moc-shaping-pill-input',
        });
        limitInput.min = '1';
        limitInput.value = this.limit;
        limitInput.oninput = () => {
            this.limit = limitInput.value;
        };

        // Offset input group
        const offsetGroup = optionsRow.createDiv({ cls: 'moc-shaping-pill-item' });
        const offsetLabel = offsetGroup.createSpan({ text: 'Offset', cls: 'moc-shaping-pill-label' });
        offsetLabel.title = 'Skip this many results from the beginning';
        const offsetInput = offsetGroup.createEl('input', {
            type: 'number',
            placeholder: '0',
            cls: 'moc-shaping-pill-input',
        });
        offsetInput.min = '0';
        offsetInput.value = this.offset;
        offsetInput.oninput = () => {
            this.offset = offsetInput.value;
        };

        // Show count toggle
        const countSetting = new Setting(optionsRow)
            .setClass('moc-shaping-count-toggle')
            .setName('Show count')
            .addToggle(toggle => toggle
                .setValue(this.showCount)
                .onChange(value => {
                    this.showCount = value;
                }));
        countSetting.descEl.remove();

        // 4. Separators row (Block & Note separators)
        const separatorsRow = containerEl.createDiv({ cls: 'moc-shaping-options-row' });

        // Block separator dropdown
        const blockSepGroup = separatorsRow.createDiv({ cls: 'moc-shaping-pill-item' });
        const blockSepLabel = blockSepGroup.createSpan({ text: 'Block separator', cls: 'moc-shaping-pill-label' });
        blockSepLabel.title = 'Separator between groups (block level)';
        const blockSepSelect = blockSepGroup.createEl('select', { cls: 'dropdown moc-shaping-pill-select' });
        this.addSelectOption(blockSepSelect, 'none', 'None');
        this.addSelectOption(blockSepSelect, 'divider', 'Divider (---)');
        this.addSelectOption(blockSepSelect, 'newline', 'Empty line');
        blockSepSelect.value = this.blockSeparator;
        blockSepSelect.onchange = () => {
            this.blockSeparator = blockSepSelect.value;
        };

        // Note separator dropdown
        const noteSepGroup = separatorsRow.createDiv({ cls: 'moc-shaping-pill-item' });
        const noteSepLabel = noteSepGroup.createSpan({ text: 'Note separator', cls: 'moc-shaping-pill-label' });
        noteSepLabel.title = 'Separator between individual items';
        const noteSepSelect = noteSepGroup.createEl('select', { cls: 'dropdown moc-shaping-pill-select' });
        this.addSelectOption(noteSepSelect, 'newline', 'Empty line');
        this.addSelectOption(noteSepSelect, 'divider', 'Divider (---)');
        this.addSelectOption(noteSepSelect, 'none', 'None');
        noteSepSelect.value = this.noteSeparator;
        noteSepSelect.onchange = () => {
            this.noteSeparator = noteSepSelect.value;
        };
    }

    renderFilterBuilder(containerEl: HTMLElement) {
        containerEl.empty();

        const toolbarEl = containerEl.createDiv({ cls: 'moc-filter-builder-toolbar' });
        toolbarEl.createSpan({
            text: this.isRawFilterMode ? 'Code filter' : 'Visual filter builder',
            cls: 'moc-filter-builder-title',
        });

        const toggleButton = toolbarEl.createEl('button', {
            text: this.isRawFilterMode ? 'Visual mode' : 'Code mode',
            cls: 'moc-filter-builder-toggle',
        });
        toggleButton.onClickEvent((event) => {
            event.preventDefault();
            if (!this.isRawFilterMode) {
                this.filterString = compileFilterTree(this.filterRoot) ?? this.filterString;
            }
            this.isRawFilterMode = !this.isRawFilterMode;
            this.renderFilterBuilder(containerEl);
        });

        if (this.isRawFilterMode) {
            new Setting(containerEl)
                .setName('Filter string')
                .setDesc('Advanced filter syntax. Autocomplete still works here.')
                .addText(text => {
                    text.setPlaceholder('Example: contains("moc")');
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
            return;
        }

        this.renderFilterGroup(containerEl, this.filterRoot, true, containerEl);

        const preview = compileFilterTree(this.filterRoot) ?? '';
        const previewEl = containerEl.createEl('code', {
            text: preview || 'Add filter values to generate the filter string',
            cls: 'moc-filter-builder-preview',
        });
        previewEl.toggleClass('is-empty', preview === '');
    }

    renderFilterGroup(containerEl: HTMLElement, group: FilterGroupNode, isRoot: boolean, rootContainerEl: HTMLElement) {
        const groupEl = containerEl.createDiv({ cls: isRoot ? 'moc-filter-group is-root' : 'moc-filter-group' });
        const headerEl = groupEl.createDiv({ cls: 'moc-filter-group-header' });

        const selectEl = headerEl.createEl('select', { cls: 'dropdown moc-filter-group-mode' });
        this.addSelectOption(selectEl, 'all', 'All the following are true');
        this.addSelectOption(selectEl, 'any', 'Any of the following are true');
        this.addSelectOption(selectEl, 'none', 'None of the following are true');
        selectEl.value = group.mode;
        selectEl.onchange = () => {
            group.mode = this.parseFilterGroupMode(selectEl.value);
            this.renderFilterBuilder(rootContainerEl);
        };

        if (!isRoot) {
            const deleteButton = headerEl.createEl('button', {
                text: 'Delete group',
                cls: 'moc-filter-delete-button',
            });
            deleteButton.onClickEvent((event) => {
                event.preventDefault();
                this.removeFilterNode(this.filterRoot, group.id);
                this.renderFilterBuilder(rootContainerEl);
            });
        }

        const childrenEl = groupEl.createDiv({ cls: 'moc-filter-group-children' });
        for (let index = 0; index < group.children.length; index++) {
            const child = group.children[index];
            if (!child) continue;

            if (child.nodeType === 'group') {
                this.renderFilterGroup(childrenEl, child, false, rootContainerEl);
            } else {
                this.renderFilterRule(childrenEl, child, group, rootContainerEl);
            }
        }

        const actionsEl = groupEl.createDiv({ cls: 'moc-filter-group-actions' });
        const addFilterButton = actionsEl.createEl('button', {
            text: '+ add filter',
            cls: 'moc-filter-action-button',
        });
        addFilterButton.onClickEvent((event) => {
            event.preventDefault();
            group.children.push(createDefaultFilterRule());
            this.renderFilterBuilder(rootContainerEl);
        });

        const addGroupButton = actionsEl.createEl('button', {
            text: '+ add filter group',
            cls: 'moc-filter-action-button',
        });
        addGroupButton.onClickEvent((event) => {
            event.preventDefault();
            group.children.push(createDefaultFilterGroup());
            this.renderFilterBuilder(rootContainerEl);
        });
    }

    renderFilterRule(containerEl: HTMLElement, rule: FilterRuleNode, parent: FilterGroupNode, rootContainerEl: HTMLElement) {
        if (!this.isTaskFilterAllowed() && (rule.kind === 'is_completed' || rule.kind === 'is_incomplete')) {
            rule.kind = 'contains';
        }

        const rowEl = containerEl.createDiv({ cls: 'moc-filter-rule-row' });
        rowEl.createSpan({ text: 'where', cls: 'moc-filter-rule-prefix' });

        const kindSelectEl = rowEl.createEl('select', { cls: 'dropdown moc-filter-rule-kind' });
        this.addSelectOption(kindSelectEl, 'contains', 'element contains');
        this.addSelectOption(kindSelectEl, 'matches', 'element matches regex');
        this.addSelectOption(kindSelectEl, 'has_tag', 'element has tag');
        this.addSelectOption(kindSelectEl, 'properties', 'file property');
        if (this.isTaskFilterAllowed()) {
            this.addSelectOption(kindSelectEl, 'is_completed', 'task is completed');
            this.addSelectOption(kindSelectEl, 'is_incomplete', 'task is incomplete');
        }
        kindSelectEl.value = rule.kind;
        kindSelectEl.onchange = () => {
            rule.kind = this.parseFilterRuleKind(kindSelectEl.value);
            if (rule.kind === 'is_completed' || rule.kind === 'is_incomplete') {
                rule.value = '';
            }
            this.renderFilterBuilder(rootContainerEl);
        };

        if (rule.kind === 'properties') {
            const keyInputEl = rowEl.createEl('input', {
                type: 'text',
                placeholder: 'Property',
                cls: 'moc-filter-rule-input',
            });
            keyInputEl.value = rule.propertyKey;
            keyInputEl.oninput = () => {
                rule.propertyKey = keyInputEl.value;
                this.updateFilterPreview(rootContainerEl);
            };
            new TypedPropertySuggest(this.app, keyInputEl, () => this.folder, option => {
                rule.propertyKey = option.key;
                rule.propertyType = option.type;
                rule.value = '';
                rule.operator = this.getPropertyOperators(option.type)[0] ?? '==';
                this.renderFilterBuilder(rootContainerEl);
            });

            const operatorSelectEl = rowEl.createEl('select', { cls: 'dropdown moc-filter-rule-operator' });
            for (const operator of this.getPropertyOperators(rule.propertyType)) {
                this.addSelectOption(operatorSelectEl, operator, operator);
            }
            if (!this.getPropertyOperators(rule.propertyType).includes(rule.operator)) {
                rule.operator = this.getPropertyOperators(rule.propertyType)[0] ?? '==';
            }
            operatorSelectEl.value = rule.operator;
            operatorSelectEl.onchange = () => {
                rule.operator = this.parseFilterPropertyOperator(operatorSelectEl.value);
                this.updateFilterPreview(rootContainerEl);
            };

            this.renderRuleValueInput(rowEl, rule, rootContainerEl, this.getPropertyValuePlaceholder(rule.propertyType));
        } else if (rule.kind !== 'is_completed' && rule.kind !== 'is_incomplete') {
            const placeholder = rule.kind === 'matches'
                ? 'Regex'
                : rule.kind === 'has_tag'
                    ? '#tag'
                    : 'Text';
            this.renderRuleValueInput(rowEl, rule, rootContainerEl, placeholder);
        }

        const codeEl = rowEl.createEl('code', {
            text: this.compileRulePreview(rule),
            cls: 'moc-filter-rule-code',
        });
        codeEl.toggleClass('is-empty', this.compileRulePreview(rule) === '');

        const deleteButton = rowEl.createEl('button', {
            text: 'Delete',
            cls: 'moc-filter-delete-button',
        });
        deleteButton.onClickEvent((event) => {
            event.preventDefault();
            parent.children = parent.children.filter(child => child.id !== rule.id);
            this.renderFilterBuilder(rootContainerEl);
        });
    }

    renderRuleValueInput(rowEl: HTMLElement, rule: FilterRuleNode, rootContainerEl: HTMLElement, placeholder: string) {
        if (rule.kind === 'properties' && rule.propertyType === 'checkbox') {
            const selectEl = rowEl.createEl('select', { cls: 'dropdown moc-filter-rule-input' });
            this.addSelectOption(selectEl, '', 'Value');
            this.addSelectOption(selectEl, 'true', 'True');
            this.addSelectOption(selectEl, 'false', 'False');
            selectEl.value = rule.value;
            selectEl.onchange = () => {
                rule.value = selectEl.value;
                this.updateFilterPreview(rootContainerEl);
            };
            return;
        }

        const inputEl = rowEl.createEl('input', {
            type: rule.kind === 'properties' ? this.getPropertyInputType(rule.propertyType) : 'text',
            placeholder,
            cls: 'moc-filter-rule-input',
        });
        if (rule.kind === 'properties' && rule.propertyType === 'number') {
            inputEl.step = 'any';
        }
        inputEl.value = rule.value;
        inputEl.oninput = () => {
            rule.value = inputEl.value;
            this.updateFilterPreview(rootContainerEl);
        };

        if (rule.kind === 'has_tag') {
            new TagSuggest(this.app, inputEl);
        } else if (rule.kind === 'contains' || rule.kind === 'matches' || (rule.kind === 'properties' && rule.propertyType === 'text')) {
            new DynamicParameterSuggest(this.app, inputEl);
        }
    }

    updateFilterPreview(containerEl: HTMLElement) {
        const previewEl = containerEl.querySelector('.moc-filter-builder-preview');
        if (previewEl instanceof HTMLElement) {
            const preview = compileFilterTree(this.filterRoot) ?? '';
            previewEl.setText(preview || 'Add filter values to generate the filter string');
            previewEl.toggleClass('is-empty', preview === '');
        }
    }

    removeFilterNode(group: FilterGroupNode, nodeId: string): boolean {
        const originalLength = group.children.length;
        group.children = group.children.filter(child => child.id !== nodeId);
        if (group.children.length !== originalLength) {
            return true;
        }

        for (const child of group.children) {
            if (child.nodeType === 'group' && this.removeFilterNode(child, nodeId)) {
                return true;
            }
        }

        return false;
    }

    normalizeTaskFilters(node: FilterBuilderNode) {
        if (node.nodeType === 'group') {
            for (const child of node.children) {
                this.normalizeTaskFilters(child);
            }
            return;
        }

        if (!this.isTaskFilterAllowed() && (node.kind === 'is_completed' || node.kind === 'is_incomplete')) {
            node.kind = 'contains';
        }
    }

    isTaskFilterAllowed(): boolean {
        return this.element === 'Task' || this.element === 'List';
    }

    compileRulePreview(rule: FilterRuleNode): string {
        const tempGroup: FilterGroupNode = {
            nodeType: 'group',
            id: 'preview',
            mode: 'all',
            children: [rule],
        };
        return compileFilterTree(tempGroup) ?? '';
    }

    addSelectOption(selectEl: HTMLSelectElement, value: string, label: string) {
        const optionEl = selectEl.createEl('option', { text: label });
        optionEl.value = value;
    }

    parseFilterGroupMode(value: string): FilterGroupMode {
        if (value === 'any' || value === 'none') {
            return value;
        }
        return 'all';
    }

    parseFilterRuleKind(value: string): FilterRuleKind {
        if (
            value === 'matches' ||
            value === 'has_tag' ||
            value === 'is_completed' ||
            value === 'is_incomplete' ||
            value === 'properties'
        ) {
            return value;
        }
        return 'contains';
    }

    parseFilterPropertyOperator(value: string): FilterPropertyOperator {
        if (value === '!=' || value === '>' || value === '>=' || value === '<' || value === '<=') {
            return value;
        }
        return '==';
    }

    getPropertyOperators(type: FilterPropertyValueType): FilterPropertyOperator[] {
        if (type === 'text' || type === 'checkbox') {
            return ['==', '!='];
        }
        return ['==', '!=', '>', '>=', '<', '<='];
    }

    getPropertyInputType(type: FilterPropertyValueType): 'text' | 'number' | 'date' | 'datetime-local' {
        if (type === 'number') return 'number';
        if (type === 'date') return 'date';
        if (type === 'datetime') return 'datetime-local';
        return 'text';
    }

    getPropertyValuePlaceholder(type: FilterPropertyValueType): string {
        if (type === 'number') return 'Number';
        if (type === 'date') return 'Date';
        if (type === 'datetime') return 'Date and time';
        return 'Value';
    }

    renderRuleChain(containerEl: HTMLElement) {
        containerEl.empty();

        const rules = this.plugin.settings.rules || [];
        
        // 1. Show selected rules (compact list)
        if (this.applyFnR.length > 0) {
            const selectedContainer = containerEl.createDiv({ cls: 'moc-rule-chain-compact' });
            for (let i = 0; i < this.applyFnR.length; i++) {
                const ruleName = this.applyFnR[i];
                const rule = rules.find(r => r.name === ruleName);
                if (!rule) continue;

                const row = selectedContainer.createDiv({ cls: 'moc-rule-chain-item' });

                const nameSpan = row.createSpan({ cls: 'moc-rule-chain-name' });
                nameSpan.createEl('strong', { text: `${i + 1}. ${rule.name}` });

                const buttons = row.createDiv({ cls: 'moc-rule-chain-buttons' });

                // Move Up button
                if (i > 0) {
                    const upBtn = buttons.createEl('button', { 
                        cls: 'clickable-icon moc-rule-chain-btn', 
                        attr: { 'aria-label': 'Move up' }
                    });
                    setIcon(upBtn, 'arrow-up');
                    upBtn.onClickEvent((e) => {
                        e.preventDefault();
                        const temp = this.applyFnR[i];
                        this.applyFnR[i] = this.applyFnR[i - 1]!;
                        this.applyFnR[i - 1] = temp!;
                        this.renderRuleChain(containerEl);
                    });
                }

                // Move Down button
                if (i < this.applyFnR.length - 1) {
                    const downBtn = buttons.createEl('button', { 
                        cls: 'clickable-icon moc-rule-chain-btn', 
                        attr: { 'aria-label': 'Move down' }
                    });
                    setIcon(downBtn, 'arrow-down');
                    downBtn.onClickEvent((e) => {
                        e.preventDefault();
                        const temp = this.applyFnR[i];
                        this.applyFnR[i] = this.applyFnR[i + 1]!;
                        this.applyFnR[i + 1] = temp!;
                        this.renderRuleChain(containerEl);
                    });
                }

                // Remove button
                const removeBtn = buttons.createEl('button', { 
                    cls: 'clickable-icon moc-rule-chain-btn moc-rule-chain-delete', 
                    attr: { 'aria-label': 'Remove rule' }
                });
                setIcon(removeBtn, 'trash-2');
                removeBtn.onClickEvent((e) => {
                    e.preventDefault();
                    this.applyFnR.splice(i, 1);
                    this.renderRuleChain(containerEl);
                });
            }
        }
    }

    insertMocBlock() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
            const editor = view.editor;
            const filterString = this.isRawFilterMode ? this.filterString : compileFilterTree(this.filterRoot);

            if (!this.isRawFilterMode) {
                const validationMessage = getFilterValidationMessage(this.filterRoot);
                if (validationMessage) {
                    new Notice(validationMessage);
                    return;
                }
            }

            if (!filterString || filterString.trim() === '') {
                new Notice('Filter is required');
                return;
            }

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
