1. **What was changed and in which files**:
   - Created a new modal interface `MocWizardModal` in `src/ui/moc-wizard.ts` which provides fields for Folder, Element, Recursive toggle, Filter type, and Filter value, and a button to automatically construct and insert a MOC code block at the current cursor location.
   - Updated `src/main.ts` to import `MocWizardModal` and register a new ribbon icon and command ("Create map of content block") to open the modal.
   - Updated `CHANGELOG.md` with an entry documenting the feature addition.

2. **The exact CHANGELOG entry added**:
   ```markdown
   ## In-progress
   - **Feature: MOC Creation Wizard** — Added an interactive modal (wizard) to generate Map of Content (MOC) code blocks without manual YAML writing. Closes [#9](https://github.com/mkshp-dev/obsidian-MOC-plugin/issues/9).
   ```

3. **The comment posted to the issue**:
   (Simulated, as I didn't have GitHub API permissions in the sandbox)
   "I've added the MOC Creation Wizard. You can now use the 'Create map of content block' command or click the new list icon in the Ribbon. This opens an interactive modal to configure the MOC block (folder, element type, filter options, etc.) and it will automatically insert the correct YAML into your note where your cursor is."

4. **The git commit hash**:
   `a92d0698ade5cdd338b5906ce19e01fb28e49400`
