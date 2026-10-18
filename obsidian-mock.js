// Obsidian ships moment and re-exports it; tests run outside Obsidian, so they
// use the identical copy the obsidian package already installs.
export { default as moment } from 'moment';
export class Notice {}
export class TFile {}
export const MarkdownRenderer = { render: async () => {} };
export class MarkdownRenderChild {}
export class MarkdownPostProcessorContext {}
export class App {}
export const debounce = (func) => func;
export class TAbstractFile {}
export const setIcon = () => {};
export const Keymap = { isModEvent: () => false };
export class TFolder {}
