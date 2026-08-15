import {App, Notice, PluginSettingTab, Setting, SettingDefinition} from "obsidian";
import MOCPlugin from "./main";
import { FolderSuggest } from "./ui/moc-wizard-suggests";

export interface FindReplaceRule {
	name: string;
	find: string;
	replace: string;
}

export interface MOCPluginSettings {
	rules: FindReplaceRule[];
	templateFolder: string;
}

export const DEFAULT_SETTINGS: MOCPluginSettings = {
	rules: [],
	templateFolder: "",
}

export class MOCSettingTab extends PluginSettingTab {
	plugin: MOCPlugin;

	constructor(app: App, plugin: MOCPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		containerEl.addClass('moc-settings-container');

		// ===== Templates Section =====
		new Setting(containerEl)
			.setName('Templates')
			.setHeading();
		
		const templateFolderLabel = containerEl.createDiv({ cls: 'moc-settings-label' });
		const labelSpan = templateFolderLabel.createSpan({ text: 'Template folder' });
		labelSpan.title = 'Vault folder containing your template files (for example: templates)';
		
		const templateFolderContainer = containerEl.createDiv({ cls: 'moc-template-folder-control' });
		
		const templateFolderInput = templateFolderContainer.createEl('input', {
			type: 'text',
			placeholder: 'Example: templates',
			cls: 'moc-settings-input'
		});
		templateFolderInput.value = this.plugin.settings.templateFolder || '';
		templateFolderInput.readOnly = true;
		
		const editBtn = templateFolderContainer.createEl('button', { 
			cls: 'moc-control-btn moc-control-edit-btn',
			text: 'Edit'
		});
		editBtn.title = 'Edit template folder';
		
		const saveBtn = templateFolderContainer.createEl('button', { 
			cls: 'moc-control-btn moc-control-save-btn moc-hidden',
			text: 'Save'
		});
		saveBtn.title = 'Save template folder';
		
		editBtn.onclick = () => {
			templateFolderInput.readOnly = false;
			templateFolderInput.focus();
			editBtn.addClass('moc-hidden');
			saveBtn.removeClass('moc-hidden');
		};
		
		saveBtn.onclick = async () => {
			this.plugin.settings.templateFolder = templateFolderInput.value.trim();
			await this.plugin.saveSettings();
			templateFolderInput.readOnly = true;
			editBtn.removeClass('moc-hidden');
			saveBtn.addClass('moc-hidden');
		};
		
		new FolderSuggest(this.app, templateFolderInput, { allowVaultRoot: false, allowDynamic: false });

		// ===== Find and Replace Section =====
		new Setting(containerEl)
			.setName('Find and replace')
			.setHeading();

		// Existing rules list (compact)
		const rules = this.plugin.settings.rules || [];
		const rulesListContainer = containerEl.createDiv({ cls: 'moc-rules-list-compact' });
		
		if (rules.length === 0) {
			const emptyState = rulesListContainer.createDiv({ cls: 'moc-settings-empty-state' });
			emptyState.createSpan({ text: 'No rules defined yet' });
		} else {
			for (let i = 0; i < rules.length; i++) {
				const rule = rules[i];
				if (!rule) continue;

				const ruleItem = rulesListContainer.createDiv({ cls: 'moc-rule-item-compact' });
				
				// Rule header with toggle
				const ruleHeader = ruleItem.createDiv({ cls: 'moc-rule-item-header' });
				
				const toggleBtn = ruleHeader.createEl('button', { cls: 'moc-rule-toggle-btn' });
				toggleBtn.textContent = '▶';
				toggleBtn.title = 'Expand details';
				
				ruleHeader.createSpan({ cls: 'moc-rule-item-name', text: rule.name });
				
				const isRegex = rule.find.startsWith('/') && rule.find.length > 2;
				if (isRegex) {
					ruleHeader.createSpan({ cls: 'moc-rule-type-badge', text: 'Regex' });
				}
				
				const editBtn = ruleHeader.createEl('button', {
					cls: 'moc-rule-item-edit-btn',
					attr: { 'aria-label': 'Edit rule' }
				});
				editBtn.textContent = '✏️';
				editBtn.title = 'Edit this rule';
				editBtn.onclick = (e) => {
					e.preventDefault();
					e.stopPropagation();
					// Set edit mode with the rule's index
					editingRuleIndex = i;
					// Populate the form with rule data
					newName = rule.name;
					newFind = rule.find;
					newReplace = rule.replace;
					nameInput.value = rule.name;
					findInput.value = rule.find;
					replaceInput.value = rule.replace;
					// Update submit button text
					submitBtn.textContent = 'Update rule';
					// Show the form
					formContainer.removeClass('moc-collapsed');
					addRuleBtn.classList.add('moc-active');
					nameInput.focus();
				};
				
				const deleteBtn = ruleHeader.createEl('button', {
					cls: 'moc-rule-item-delete-btn',
					attr: { 'aria-label': 'Delete rule' }
				});
				deleteBtn.textContent = '🗑️';
				deleteBtn.title = 'Delete this rule';
				deleteBtn.onclick = async (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.plugin.settings.rules.splice(i, 1);
					await this.plugin.saveSettings();
					(this as unknown as { display(): void }).display();
				};
				
				// Rule details (hidden by default)
				const ruleDetails = ruleItem.createDiv({ cls: 'moc-rule-item-details moc-collapsed' });
				
				const findRow = ruleDetails.createDiv({ cls: 'moc-rule-detail-row' });
				findRow.createSpan({ cls: 'moc-rule-detail-label', text: 'Find:' });
				findRow.createEl('code', { cls: 'moc-rule-detail-code', text: rule.find || '(empty)' });
				
				const replaceRow = ruleDetails.createDiv({ cls: 'moc-rule-detail-row' });
				replaceRow.createSpan({ cls: 'moc-rule-detail-label', text: 'Replace:' });
				replaceRow.createEl('code', { cls: 'moc-rule-detail-code', text: rule.replace !== '' ? rule.replace : '(nothing)' });
				
				// Toggle details on click
				toggleBtn.onclick = () => {
					const isCollapsed = ruleDetails.hasClass('moc-collapsed');
					if (isCollapsed) {
						ruleDetails.removeClass('moc-collapsed');
						toggleBtn.textContent = '▼';
						toggleBtn.title = 'Collapse details';
					} else {
						ruleDetails.addClass('moc-collapsed');
						toggleBtn.textContent = '▶';
						toggleBtn.title = 'Expand details';
					}
				};
			}
		}

		// Add rule button (right-aligned in a wrapper)
		const addRuleButtonWrapper = containerEl.createDiv({ cls: 'moc-add-rule-button-wrapper' });
		const addRuleBtn = addRuleButtonWrapper.createEl('button', { 
			cls: 'moc-add-rule-btn',
			text: '+ add rule'
		});

		// Add rule form (hidden by default)
		const formContainer = containerEl.createDiv({ cls: 'moc-add-rule-form-container moc-collapsed' });

		let newName = '';
		let newFind = '';
		let newReplace = '';
		let editingRuleIndex = -1; // Track which rule is being edited (-1 = new rule)

		// Rule name input
		const nameLabel = formContainer.createDiv({ cls: 'moc-settings-label' });
		const nameSpan = nameLabel.createSpan({ text: 'Rule name' });
		nameSpan.title = 'A unique name to reference in code blocks (for example, clean-headers)';
		
		const nameInput = formContainer.createEl('input', {
			type: 'text',
			placeholder: 'Clean-headers',
			cls: 'moc-settings-input'
		});
		nameInput.oninput = () => {
			newName = nameInput.value.trim();
		};

		// Find pattern input
		const findLabel = formContainer.createDiv({ cls: 'moc-settings-label' });
		const findSpan = findLabel.createSpan({ text: 'Find pattern' });
		findSpan.title = 'Literal text or regex pattern (e.g. /^#+\\s+/gm or #todo)';
		
		const findInput = formContainer.createEl('input', {
			type: 'text',
			placeholder: 'Pattern to search for',
			cls: 'moc-settings-input'
		});
		findInput.oninput = () => {
			newFind = findInput.value;
		};

		// Replace with input
		const replaceLabel = formContainer.createDiv({ cls: 'moc-settings-label' });
		const replaceSpan = replaceLabel.createSpan({ text: 'Replace with' });
		replaceSpan.title = 'Text to replace the pattern with (leave blank to remove matches)';
		
		const replaceInput = formContainer.createEl('input', {
			type: 'text',
			placeholder: 'Replacement text',
			cls: 'moc-settings-input'
		});
		replaceInput.oninput = () => {
			newReplace = replaceInput.value;
		};

		// Action buttons for form
		const formButtonsDiv = formContainer.createDiv({ cls: 'moc-form-buttons' });
		
		const submitBtn = formButtonsDiv.createEl('button', { 
			cls: 'moc-form-submit-btn',
			text: 'Add rule'
		});
		submitBtn.onclick = async () => {
			if (!newName) {
				new Notice('Rule name cannot be empty');
				return;
			}
			const rulesList = this.plugin.settings.rules || [];
			
			// Check for duplicate names (excluding the rule being edited)
			const isDuplicate = rulesList.some((r, idx) => r.name === newName && idx !== editingRuleIndex);
			if (isDuplicate) {
				new Notice('A rule with this name already exists');
				return;
			}

			if (editingRuleIndex >= 0) {
				// Edit mode: replace the existing rule
				rulesList[editingRuleIndex] = {
					name: newName,
					find: newFind,
					replace: newReplace
				};
				await this.plugin.saveSettings();
				new Notice(`Rule "${newName}" updated`);
			} else {
				// New rule mode: add the rule
				rulesList.push({
					name: newName,
					find: newFind,
					replace: newReplace
				});
				await this.plugin.saveSettings();
				new Notice(`Rule "${newName}" added`);
			}

			this.plugin.settings.rules = rulesList;
			editingRuleIndex = -1; // Reset edit mode
			(this as unknown as { display(): void }).display();
		};

		const cancelBtn = formButtonsDiv.createEl('button', { 
			cls: 'moc-form-cancel-btn',
			text: 'Cancel'
		});
		cancelBtn.onclick = () => {
			formContainer.addClass('moc-collapsed');
			addRuleBtn.classList.remove('moc-active');
			newName = '';
			newFind = '';
			newReplace = '';
			editingRuleIndex = -1; // Reset edit mode
			submitBtn.textContent = 'Add rule'; // Reset button text
			nameInput.value = '';
			findInput.value = '';
			replaceInput.value = '';
		};

		// Toggle form on button click
		addRuleBtn.onclick = () => {
			const isCollapsed = formContainer.hasClass('moc-collapsed');
			if (isCollapsed) {
				formContainer.removeClass('moc-collapsed');
				addRuleBtn.classList.add('moc-active');
				nameInput.focus();
			} else {
				formContainer.addClass('moc-collapsed');
				addRuleBtn.classList.remove('moc-active');
				editingRuleIndex = -1; // Reset edit mode when closing
				submitBtn.textContent = 'Add rule'; // Reset button text
			}
		};
	}

	getSettingDefinitions(): SettingDefinition[] {
		return [];
	}
}

