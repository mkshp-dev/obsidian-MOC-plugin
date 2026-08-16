import {App, Notice, PluginSettingTab, SettingDefinition, setIcon} from "obsidian";
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

	private createSection(containerEl: HTMLElement, icon: string, title: string, description: string): HTMLElement {
		const section = containerEl.createDiv({ cls: 'moc-settings-section' });
		const header = section.createDiv({ cls: 'moc-settings-section-header' });

		const iconEl = header.createDiv({ cls: 'moc-settings-section-icon' });
		setIcon(iconEl, icon);

		const titleGroup = header.createDiv({ cls: 'moc-settings-section-title-group' });
		titleGroup.createDiv({ cls: 'moc-settings-section-title', text: title });
		titleGroup.createDiv({ cls: 'moc-settings-section-desc', text: description });

		return section.createDiv({ cls: 'moc-settings-section-body' });
	}

	private createIconButton(parent: HTMLElement, icon: string, label: string, modifier?: string): HTMLButtonElement {
		const btn = parent.createEl('button', {
			cls: modifier ? `clickable-icon moc-icon-btn ${modifier}` : 'clickable-icon moc-icon-btn',
			attr: { 'aria-label': label }
		});
		setIcon(btn, icon);
		return btn;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		containerEl.addClass('moc-settings-container');

		// ===== Templates Section =====
		const templatesBody = this.createSection(
			containerEl,
			'folder',
			'Templates',
			'Choose the vault folder that holds your template files.'
		);

		const templateFolderLabel = templatesBody.createDiv({ cls: 'moc-settings-label' });
		const labelSpan = templateFolderLabel.createSpan({ text: 'Template folder' });
		labelSpan.title = 'Vault folder containing your template files (for example: templates)';

		const templateFolderContainer = templatesBody.createDiv({ cls: 'moc-template-folder-control' });

		const templateFolderInput = templateFolderContainer.createEl('input', {
			type: 'text',
			placeholder: 'Example: templates',
			cls: 'moc-settings-input'
		});
		templateFolderInput.value = this.plugin.settings.templateFolder || '';
		templateFolderInput.readOnly = true;

		const controlActions = templateFolderContainer.createDiv({ cls: 'moc-control-actions' });

		const editBtn = this.createIconButton(controlActions, 'pencil', 'Edit template folder');

		const saveBtn = this.createIconButton(controlActions, 'check', 'Save template folder', 'moc-icon-btn-accent');
		saveBtn.disabled = true;

		editBtn.onclick = () => {
			templateFolderInput.readOnly = false;
			templateFolderInput.focus();
			editBtn.disabled = true;
			saveBtn.disabled = false;
		};

		saveBtn.onclick = async () => {
			this.plugin.settings.templateFolder = templateFolderInput.value.trim();
			await this.plugin.saveSettings();
			templateFolderInput.readOnly = true;
			editBtn.disabled = false;
			saveBtn.disabled = true;
		};

		new FolderSuggest(this.app, templateFolderInput, { allowVaultRoot: false, allowDynamic: false });

		// ===== Find and Replace Section =====
		const rulesBody = this.createSection(
			containerEl,
			'search',
			'Find and replace',
			'Define reusable text or regex rules to apply in code blocks.'
		);

		// Existing rules list (compact)
		const rules = this.plugin.settings.rules || [];
		const rulesListContainer = rulesBody.createDiv({ cls: 'moc-rules-list-compact' });

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

				const toggleBtn = ruleHeader.createEl('button', {
					cls: 'clickable-icon moc-rule-toggle-btn',
					attr: { 'aria-label': 'Expand details' }
				});
				setIcon(toggleBtn, 'chevron-right');

				ruleHeader.createSpan({ cls: 'moc-rule-item-name', text: rule.name });

				const isRegex = rule.find.startsWith('/') && rule.find.length > 2;
				if (isRegex) {
					ruleHeader.createSpan({ cls: 'moc-rule-type-badge', text: 'Regex' });
				}

				const ruleActions = ruleHeader.createDiv({ cls: 'moc-rule-item-actions' });

				const editRuleBtn = this.createIconButton(ruleActions, 'pencil', 'Edit this rule');
				editRuleBtn.onclick = (e) => {
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
					formTitle.textContent = 'Edit rule';
					// Show the form
					formContainer.removeClass('moc-collapsed');
					addRuleBtn.classList.add('moc-active');
					nameInput.focus();
				};

				const deleteRuleBtn = this.createIconButton(ruleActions, 'trash-2', 'Delete this rule', 'moc-icon-btn-danger');
				deleteRuleBtn.onclick = async (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.plugin.settings.rules.splice(i, 1);
					await this.plugin.saveSettings();
					(this as unknown as { display(): void }).display();
				};

				// Rule details (hidden by default)
				const ruleDetails = ruleItem.createDiv({ cls: 'moc-rule-item-details moc-collapsed' });

				const findRow = ruleDetails.createDiv({ cls: 'moc-rule-detail-row' });
				findRow.createSpan({ cls: 'moc-rule-detail-label', text: 'Find' });
				findRow.createEl('code', { cls: 'moc-rule-detail-code', text: rule.find || '(empty)' });

				const replaceRow = ruleDetails.createDiv({ cls: 'moc-rule-detail-row' });
				replaceRow.createSpan({ cls: 'moc-rule-detail-label', text: 'Replace' });
				replaceRow.createEl('code', { cls: 'moc-rule-detail-code', text: rule.replace !== '' ? rule.replace : '(nothing)' });

				// Toggle details on click
				const toggleDetails = () => {
					const isCollapsed = ruleDetails.hasClass('moc-collapsed');
					if (isCollapsed) {
						ruleDetails.removeClass('moc-collapsed');
						toggleBtn.addClass('moc-rule-toggle-btn-expanded');
						toggleBtn.setAttribute('aria-label', 'Collapse details');
					} else {
						ruleDetails.addClass('moc-collapsed');
						toggleBtn.removeClass('moc-rule-toggle-btn-expanded');
						toggleBtn.setAttribute('aria-label', 'Expand details');
					}
				};
				toggleBtn.onclick = toggleDetails;
				ruleHeader.onclick = (e) => {
					if (e.target === toggleBtn || e.target === editRuleBtn || e.target === deleteRuleBtn) return;
					toggleDetails();
				};
			}
		}

		// Add rule button
		const addRuleBtn = rulesBody.createEl('button', {
			cls: 'moc-add-rule-btn'
		});
		const addRuleIcon = addRuleBtn.createSpan({ cls: 'moc-add-rule-icon' });
		setIcon(addRuleIcon, 'plus');
		addRuleBtn.createSpan({ text: 'Add rule' });

		// Add rule form (hidden by default)
		const formContainer = rulesBody.createDiv({ cls: 'moc-add-rule-form-container moc-collapsed' });

		const formTitle = formContainer.createDiv({ cls: 'moc-form-title', text: 'New rule' });

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
			formTitle.textContent = 'New rule';
			nameInput.value = '';
			findInput.value = '';
			replaceInput.value = '';
		};

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
				formTitle.textContent = 'New rule';
			}
		};
	}

	getSettingDefinitions(): SettingDefinition[] {
		return [];
	}
}
