import { MocWizardModal } from "./ui/moc-wizard";
import { Plugin, parseYaml } from 'obsidian';
import { DEFAULT_SETTINGS, MOCPluginSettings, MOCSettingTab } from "./settings";
import { processMocBlock, MocConfig } from "./moc";

export default class MOCPlugin extends Plugin {
	settings: MOCPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('list', 'Create map of content block', () => {
			new MocWizardModal(this.app, this).open();
		});

		this.addCommand({
			id: 'create-moc-block',
			name: 'Create map of content block',
			callback: () => {
				new MocWizardModal(this.app, this).open();
			}
		});


		this.registerMarkdownCodeBlockProcessor("moc", async (source, el, ctx) => {
			try {
				const config = parseYaml(source) as MocConfig;
				await processMocBlock(config, el, ctx, this.app, ctx.sourcePath, this.settings);
			} catch (e) {
				const errorMessage = e instanceof Error ? e.message : String(e);
				el.createEl("div", { text: "Error parsing YAML in moc block:\n" + errorMessage, cls: 'moc-error' });
			}
		});

		this.addSettingTab(new MOCSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MOCPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
