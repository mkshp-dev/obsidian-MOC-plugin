import {App, PluginSettingTab, Setting} from "obsidian";
import MOCPlugin from "./main";

export type MOCPluginSettings = Record<string, unknown>;

export const DEFAULT_SETTINGS: MOCPluginSettings = {}

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
			.setName('Configuration')
			.setHeading();

		containerEl.createEl('p', {text: 'No settings are currently required for the MOC plugin. Just use the `moc` code block.'});
	}
}
