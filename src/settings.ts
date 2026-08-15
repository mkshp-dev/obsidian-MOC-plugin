import {App, Notice, PluginSettingTab, Setting} from "obsidian";
import MOCPlugin from "./main";

export interface FindReplaceRule {
	name: string;
	find: string;
	replace: string;
}

export interface MOCPluginSettings {
	rules: FindReplaceRule[];
}

export const DEFAULT_SETTINGS: MOCPluginSettings = {
	rules: []
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

		new Setting(containerEl)
			.setName('Find and replace rules')
			.setHeading()
			.setDesc('Define reusable find and replace rules that can be applied to blocks via find and replace settings.');

		// 1. Render existing rules list
		const rules = this.plugin.settings.rules || [];
		if (rules.length === 0) {
			const emptyBox = containerEl.createDiv({cls: 'moc-settings-empty-state'});
			emptyBox.createSpan({cls: 'moc-settings-empty-icon', text: '🔍'});
			emptyBox.createEl('p', {text: 'No rules created yet. Use the form below to add your first find and replace rule.'});
		} else {
			const listContainer = containerEl.createDiv({cls: 'moc-rules-cards-container'});
			for (let i = 0; i < rules.length; i++) {
				const rule = rules[i];
				if (!rule) continue;

				const ruleCard = listContainer.createDiv({cls: 'moc-rule-card'});

				const header = ruleCard.createDiv({cls: 'moc-rule-card-header'});
				const titleGroup = header.createDiv({cls: 'moc-rule-card-title-group'});
				titleGroup.createSpan({cls: 'moc-rule-card-badge', text: `${i + 1}`});
				titleGroup.createEl('strong', {cls: 'moc-rule-card-name', text: rule.name});

				const isRegex = rule.find.startsWith('/') && rule.find.length > 2;
				if (isRegex) {
					titleGroup.createSpan({cls: 'moc-rule-card-type-badge', text: 'Regex'});
				}

				const actionDiv = header.createDiv({cls: 'moc-rule-card-actions'});
				const deleteBtn = actionDiv.createEl('button', {text: 'Delete', cls: 'mod-warning moc-rule-delete-btn'});
				deleteBtn.onClickEvent(async (e) => {
					e.preventDefault();
					this.plugin.settings.rules.splice(i, 1);
					await this.plugin.saveSettings();
					(this as unknown as { display(): void }).display();
				});

				const details = ruleCard.createDiv({cls: 'moc-rule-card-details'});
				
				const findRow = details.createDiv({cls: 'moc-rule-detail-row'});
				findRow.createSpan({cls: 'moc-rule-detail-label', text: 'Find:'});
				findRow.createEl('code', {cls: 'moc-rule-detail-code', text: rule.find || '(empty)'});

				const replaceRow = details.createDiv({cls: 'moc-rule-detail-row'});
				replaceRow.createSpan({cls: 'moc-rule-detail-label', text: 'Replace:'});
				replaceRow.createEl('code', {cls: 'moc-rule-detail-code', text: rule.replace !== '' ? rule.replace : '(nothing)'});
			}
		}

		// 2. Form to add a new rule
		new Setting(containerEl)
			.setName('Add new rule')
			.setHeading();

		let newName = '';
		let newFind = '';
		let newReplace = '';

		const formContainer = containerEl.createDiv({cls: 'moc-add-rule-form-container'});

		new Setting(formContainer)
			.setName('Rule name')
			.setDesc('A unique name to reference in code blocks (for example, clean-headers)')
			.addText(text => text
				.setPlaceholder('Clean-headers')
				.onChange(value => {
					newName = value.trim();
				}));

		new Setting(formContainer)
			.setName('Find pattern')
			.setDesc('Literal text or regex pattern (e.g. /^#+\\s+/gm or #todo)')
			.addText(text => text
				.setPlaceholder('Pattern to search for')
				.onChange(value => {
					newFind = value;
				}));

		new Setting(formContainer)
			.setName('Replace with')
			.setDesc('Text to replace the pattern with (leave blank to remove matches)')
			.addText(text => text
				.setPlaceholder('Replacement text')
				.onChange(value => {
					newReplace = value;
				}));

		new Setting(formContainer)
			.addButton(btn => btn
				.setButtonText('Add rule')
				.setCta()
				.onClick(async () => {
					if (!newName) {
						new Notice('Rule name cannot be empty');
						return;
					}
					const rulesList = this.plugin.settings.rules || [];
					if (rulesList.some(r => r.name === newName)) {
						new Notice('A rule with this name already exists');
						return;
					}

					rulesList.push({
						name: newName,
						find: newFind,
						replace: newReplace
					});
					this.plugin.settings.rules = rulesList;

					await this.plugin.saveSettings();
					new Notice(`Rule "${newName}" added`);
					(this as unknown as { display(): void }).display();
				}));
	}

	getSettingDefinitions() {
		return [
			{
				name: 'Find and replace rules',
				description: 'Define reusable find and replace rules that can be applied to blocks via find and replace settings.',
			},
			{
				name: 'Rule name',
				description: 'A unique name to reference in code blocks (for example, clean-headers)',
			},
			{
				name: 'Find pattern',
				description: 'Literal text or regex pattern (e.g. /^#+\\s+/gm or #todo)',
			},
			{
				name: 'Replace with',
				description: 'Text to replace the pattern with (leave blank to remove matches)',
			},
		];
	}
}

