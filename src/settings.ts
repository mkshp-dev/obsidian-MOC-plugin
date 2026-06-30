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
			.setHeading();

		containerEl.createEl('p', {text: 'Define reusable find and replace rules that can be applied to MOC blocks via `applyFnR`.'});

		// 1. Render existing rules list
		const rules = this.plugin.settings.rules || [];
		if (rules.length === 0) {
			containerEl.createEl('p', {text: 'No rules defined yet.', cls: 'moc-no-rules'});
		} else {
			const listContainer = containerEl.createDiv({cls: 'moc-rules-list'});
			for (let i = 0; i < rules.length; i++) {
				const rule = rules[i];
				if (!rule) continue;

				const ruleRow = listContainer.createDiv({cls: 'moc-rule-row'});

				const infoDiv = ruleRow.createDiv({cls: 'moc-rule-info'});
				infoDiv.createEl('strong', {text: rule.name});
				infoDiv.createEl('span', {text: ` (Find: "${rule.find}" ➔ Replace: "${rule.replace}")` });

				const actionDiv = ruleRow.createDiv({cls: 'moc-rule-actions'});
				const deleteBtn = actionDiv.createEl('button', {text: 'Delete', cls: 'mod-warning'});
				deleteBtn.onClickEvent(async (e) => {
					e.preventDefault();
					this.plugin.settings.rules.splice(i, 1);
					await this.plugin.saveSettings();
					(this as unknown as { display(): void }).display(); // Refresh settings tab
				});
			}
		}

		// 2. Form to add a new rule
		new Setting(containerEl)
			.setName('Add new rule')
			.setHeading();

		let newName = '';
		let newFind = '';
		let newReplace = '';

		new Setting(containerEl)
			.setName('Rule name')
			.setDesc('A unique name to reference in code blocks (for example, clean-headers)')
			.addText(text => text
				.setPlaceholder('Clean-headers')
				.onChange(value => {
					newName = value.trim();
				}));

		new Setting(containerEl)
			.setName('Find pattern')
			.setDesc('Text or regex pattern (for example, /^#\\s+/gm)')
			.addText(text => text
				.setPlaceholder('Pattern to search for')
				.onChange(value => {
					newFind = value;
				}));

		new Setting(containerEl)
			.setName('Replace with')
			.setDesc('Text to replace the pattern with')
			.addText(text => text
				.setPlaceholder('Replacement text (can be empty)')
				.onChange(value => {
					newReplace = value;
				}));

		new Setting(containerEl)
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
					(this as unknown as { display(): void }).display(); // Re-render setting tab
				}));
	}
}

