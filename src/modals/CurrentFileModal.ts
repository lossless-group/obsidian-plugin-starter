// src/modals/CurrentFileModal.ts

import { App, Editor, Modal, Notice, Setting } from 'obsidian';
import currentFileService from '../services/currentFileService';
import { textProcessingService } from '../services/textProcessingService';
import { selectionService } from '../services/selectionService';
import { processSiteUuidForFile } from '../services/siteUuidService';
import { HeaderInfoSection } from './sections/HeaderInfoSection';

export class CurrentFileModal extends Modal {
    private editor: Editor;

    constructor(app: App, editor: Editor) {
        super(app);
        this.editor = editor;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Current File Operations' });

        // UUID Operations (at the top)
        await this.createUuidSection(contentEl);

        // Publish State Operations
        this.createPublishStateSection(contentEl);

        // Header Info Operations
        const headerInfoSection = new HeaderInfoSection(this.app, this.editor);
        await headerInfoSection.render(contentEl);

        // Current File Service Operations
        this.createFileOperationsSection(contentEl);
        
        // Text Processing Operations
        this.createTextProcessingSection(contentEl);
        
        // Selection Operations
        this.createSelectionOperationsSection(contentEl);
    }

    private async createUuidSection(contentEl: HTMLElement) {
        const section = contentEl.createEl('div', { cls: 'modal-section uuid-section' });
        section.createEl('h3', { text: 'UUID Operations' });

        // Check if current file has site_uuid
        const hasUuid = await this.checkForExistingSiteUuid();

        // Add UUID to frontmatter button
        new Setting(section)
            .setName('Add Site UUID')
            .setDesc('Add a unique site_uuid property to the frontmatter of this file')
            .addButton(button => {
                const buttonEl = button
                    .setButtonText('Add UUID to Frontmatter')
                    .onClick(async () => {
                        try {
                            const activeFile = this.app.workspace.getActiveFile();
                            if (!activeFile) {
                                new Notice('No active file found');
                                return;
                            }

                            // Check if it's a markdown file
                            if (activeFile.extension !== 'md') {
                                new Notice('Site UUID can only be added to Markdown files');
                                return;
                            }

                            new Notice('Adding site UUID...', 2000);
                            const result = await processSiteUuidForFile(activeFile);
                            
                            if (result.success) {
                                const message = result.hadExistingUuid 
                                    ? `Updated site UUID: ${result.uuid}`
                                    : `Added site UUID: ${result.uuid}`;
                                new Notice(message, 5000);
                                
                                // Refresh the editor content to show the updated frontmatter
                                const updatedContent = await activeFile.vault.read(activeFile);
                                this.editor.setValue(updatedContent);
                                
                                // Update button styling after adding UUID
                                this.updateUuidButtonStyling(buttonEl.buttonEl, true);
                            } else {
                                new Notice(`Failed to add site UUID: ${result.message}`, 5000);
                            }
                        } catch (error) {
                            const errorMsg = error instanceof Error ? error.message : String(error);
                            new Notice('Error adding site UUID: ' + errorMsg, 5000);
                        }
                    });
                
                // Apply initial styling based on UUID presence
                this.updateUuidButtonStyling(buttonEl.buttonEl, hasUuid);
                
                return buttonEl;
            });
    }

    private async checkForExistingSiteUuid(): Promise<boolean> {
        try {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || activeFile.extension !== 'md') {
                return false;
            }

            const content = await activeFile.vault.read(activeFile);
            const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
            const match = content.match(frontmatterRegex);
            
            if (!match) return false;
            
            const frontmatterContent = match[1];
            if (!frontmatterContent) return false;
            
            const siteUuidMatch = frontmatterContent.match(/^site_uuid:\s*(.+)$/m);
            
            if (!siteUuidMatch || !siteUuidMatch[1]) return false;
            
            const uuidValue = siteUuidMatch[1].trim();
            // Check if UUID exists and is not empty (accounting for quotes)
            return !!(uuidValue && uuidValue !== '""' && uuidValue !== "''" && uuidValue !== 'null');
        } catch (error) {
            console.error('Error checking for existing site_uuid:', error);
            return false;
        }
    }

    private updateUuidButtonStyling(buttonEl: HTMLButtonElement, hasUuid: boolean) {
        if (hasUuid) {
            // Remove purple styling if UUID exists
            buttonEl.style.backgroundColor = '';
            buttonEl.style.color = '';
            buttonEl.style.borderColor = '';
        } else {
            // Apply purple styling if no UUID
            buttonEl.style.backgroundColor = 'var(--interactive-accent)';
            buttonEl.style.color = 'var(--text-on-accent)';
            buttonEl.style.borderColor = 'var(--interactive-accent-hover)';
        }
    }

    private createPublishStateSection(contentEl: HTMLElement) {
        const section = contentEl.createEl('div', { cls: 'modal-section publish-section' });
        section.createEl('h3', { text: 'Change publish state?' });

        // Create a container for the buttons with flexbox styling
        const buttonContainer = section.createEl('div', {
            cls: 'publish-button-container'
        });
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '10px';

        // True button
        const trueButton = buttonContainer.createEl('button', {
            text: 'true',
            cls: 'mod-cta publish-button'
        });
        trueButton.style.flex = '1';
        trueButton.addEventListener('click', () => this.setPublishState(true));

        // False button
        const falseButton = buttonContainer.createEl('button', {
            text: 'false',
            cls: 'mod-cta publish-button'
        });
        falseButton.style.flex = '1';
        falseButton.addEventListener('click', () => this.setPublishState(false));
    }

    private async setPublishState(publishValue: boolean) {
        try {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) {
                new Notice('No active file found');
                return;
            }

            // Check if it's a markdown file
            if (activeFile.extension !== 'md') {
                new Notice('Publish state can only be set for Markdown files');
                return;
            }

            new Notice(`Setting publish to ${publishValue}...`, 2000);
            
            // Read current content and extract frontmatter
            const content = await activeFile.vault.read(activeFile);
            const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
            const match = content.match(frontmatterRegex);
            
            let frontmatter: Record<string, any> = {};
            
            if (match && match[1]) {
                // Parse existing frontmatter using our utility
                const { extractFrontmatter } = await import('../utils/yamlFrontmatter');
                frontmatter = extractFrontmatter(content) || {};
            }
            
            // Update the publish property
            frontmatter.publish = publishValue;
            
            // Format and update the file
            const { formatFrontmatter, updateFileFrontmatter } = await import('../utils/yamlFrontmatter');
            const formattedFrontmatter = formatFrontmatter(frontmatter);
            await updateFileFrontmatter(activeFile, formattedFrontmatter);
            
            new Notice(`Publish state set to ${publishValue}`, 3000);
            
            // Refresh the editor content to show the updated frontmatter
            const updatedContent = await activeFile.vault.read(activeFile);
            this.editor.setValue(updatedContent);
            
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            new Notice('Error setting publish state: ' + errorMsg, 5000);
        }
    }

    private createFileOperationsSection(contentEl: HTMLElement) {
        const section = contentEl.createEl('div', { cls: 'modal-section' });
        section.createEl('h3', { text: 'File Operations' });

        // List Headers Button
        new Setting(section)
            .setName('List Headers')
            .setDesc('Extract all headers from the current file')
            .addButton(button => 
                button
                    .setButtonText('List Headers')
                    .onClick(() => {
                        const content = this.editor.getValue();
                        const headers = currentFileService.listHeaders(content);
                        if (headers.length > 0) {
                            new Notice(`Found ${headers.length} headers:\n${headers.join('\n')}`);
                        } else {
                            new Notice('No headers found in file');
                        }
                    })
            );

        // Add Text Section
        let addTextInput = '';
        let addTextPosition = 0;
        new Setting(section)
            .setName('Add Text')
            .setDesc('Add text at a specific position')
            .addText(text => 
                text
                    .setPlaceholder('Text to add')
                    .onChange((value) => { addTextInput = value; })
            )
            .addText(text => 
                text
                    .setPlaceholder('Position (0 for start)')
                    .onChange((value) => { 
                        const num = parseInt(value);
                        addTextPosition = isNaN(num) ? 0 : num;
                    })
            )
            .addButton(button => 
                button
                    .setButtonText('Add Text')
                    .onClick(() => {
                        if (!addTextInput) {
                            new Notice('Please enter text to add');
                            return;
                        }
                        const content = this.editor.getValue();
                        const newContent = currentFileService.addText(content, addTextInput, addTextPosition);
                        this.editor.setValue(newContent);
                        new Notice('Text added successfully');
                    })
            );

        // Delete Text Section
        let deleteStart = 0;
        let deleteEnd = 0;
        new Setting(section)
            .setName('Delete Text Range')
            .setDesc('Delete text between two positions')
            .addText(text => 
                text
                    .setPlaceholder('Start position')
                    .onChange((value) => { 
                        const num = parseInt(value);
                        deleteStart = isNaN(num) ? 0 : num;
                    })
            )
            .addText(text => 
                text
                    .setPlaceholder('End position')
                    .onChange((value) => { 
                        const num = parseInt(value);
                        deleteEnd = isNaN(num) ? 0 : num;
                    })
            )
            .addButton(button => 
                button
                    .setButtonText('Delete Text')
                    .onClick(() => {
                        if (deleteEnd <= deleteStart) {
                            new Notice('End position must be greater than start position');
                            return;
                        }
                        const content = this.editor.getValue();
                        const newContent = currentFileService.deleteText(content, deleteStart, deleteEnd);
                        this.editor.setValue(newContent);
                        new Notice('Text deleted successfully');
                    })
            );

        // Extract YAML Button
        new Setting(section)
            .setName('Extract YAML Frontmatter')
            .setDesc('Extract YAML frontmatter from the current file')
            .addButton(button => 
                button
                    .setButtonText('Extract YAML')
                    .onClick(() => {
                        const content = this.editor.getValue();
                        const yaml = currentFileService.extractYamlFrontmatter(content);
                        if (yaml) {
                            new Notice(`YAML Frontmatter:\n${yaml}`);
                        } else {
                            new Notice('No YAML frontmatter found');
                        }
                    })
            );

        // Change YAML Value Section
        let yamlKey = '';
        let yamlValue = '';
        new Setting(section)
            .setName('Change YAML Value')
            .setDesc('Update a key-value pair in YAML frontmatter')
            .addText(text => 
                text
                    .setPlaceholder('YAML key')
                    .onChange((value) => { yamlKey = value; })
            )
            .addText(text => 
                text
                    .setPlaceholder('New value')
                    .onChange((value) => { yamlValue = value; })
            )
            .addButton(button => 
                button
                    .setButtonText('Update YAML')
                    .onClick(() => {
                        if (!yamlKey || !yamlValue) {
                            new Notice('Please enter both key and value');
                            return;
                        }
                        const content = this.editor.getValue();
                        const yaml = currentFileService.extractYamlFrontmatter(content);
                        if (yaml) {
                            const updatedYaml = currentFileService.changeYamlValue(yaml, yamlKey, yamlValue);
                            const newContent = content.replace(/^---\n[\s\S]+?\n---/, `---\n${updatedYaml}\n---`);
                            this.editor.setValue(newContent);
                            new Notice('YAML updated successfully');
                        } else {
                            new Notice('No YAML frontmatter found');
                        }
                    })
            );
    }

    private createTextProcessingSection(contentEl: HTMLElement) {
        const section = contentEl.createEl('div', { cls: 'modal-section' });
        section.createEl('h3', { text: 'Text Processing Operations' });

        // Find Matches Section
        let searchPattern = '';
        new Setting(section)
            .setName('Find Matches')
            .setDesc('Find all matches of a regex pattern')
            .addText(text => 
                text
                    .setPlaceholder('Regex pattern (e.g., \\d+)')
                    .onChange((value) => { searchPattern = value; })
            )
            .addButton(button => 
                button
                    .setButtonText('Find Matches')
                    .onClick(() => {
                        if (!searchPattern) {
                            new Notice('Please enter a search pattern');
                            return;
                        }
                        try {
                            const content = this.editor.getValue();
                            const regex = new RegExp(searchPattern, 'g');
                            const matches = textProcessingService.findMatches(content, regex);
                            new Notice(`Found ${matches.length} matches`);
                        } catch (error) {
                            new Notice('Invalid regex pattern');
                        }
                    })
            );

        // Replace All Section
        let replacePattern = '';
        let replaceWith = '';
        new Setting(section)
            .setName('Replace All')
            .setDesc('Replace all instances of a pattern')
            .addText(text => 
                text
                    .setPlaceholder('Pattern to replace')
                    .onChange((value) => { replacePattern = value; })
            )
            .addText(text => 
                text
                    .setPlaceholder('Replace with')
                    .onChange((value) => { replaceWith = value; })
            )
            .addButton(button => 
                button
                    .setButtonText('Replace All')
                    .onClick(() => {
                        if (!replacePattern) {
                            new Notice('Please enter a pattern to replace');
                            return;
                        }
                        try {
                            const content = this.editor.getValue();
                            const regex = new RegExp(replacePattern, 'g');
                            const result = textProcessingService.replaceAll(content, regex, replaceWith);
                            if (result.changed) {
                                this.editor.setValue(result.content);
                                new Notice(`Replaced ${result.stats.itemsProcessed} instances`);
                            } else {
                                new Notice('No matches found to replace');
                            }
                        } catch (error) {
                            new Notice('Invalid regex pattern');
                        }
                    })
            );

        // Remove Duplicate Lines Button
        new Setting(section)
            .setName('Remove Duplicate Lines')
            .setDesc('Remove duplicate lines from the file')
            .addButton(button => 
                button
                    .setButtonText('Remove Duplicates')
                    .onClick(() => {
                        const content = this.editor.getValue();
                        const result = textProcessingService.removeDuplicateLines(content);
                        if (result.changed) {
                            this.editor.setValue(result.content);
                            new Notice(`Removed ${result.stats.itemsProcessed} duplicate lines`);
                        } else {
                            new Notice('No duplicate lines found');
                        }
                    })
            );

        // Normalize Whitespace Button
        new Setting(section)
            .setName('Normalize Whitespace')
            .setDesc('Clean up and normalize whitespace in the file')
            .addButton(button => 
                button
                    .setButtonText('Normalize Whitespace')
                    .onClick(() => {
                        const content = this.editor.getValue();
                        const result = textProcessingService.normalizeWhitespace(content);
                        if (result.changed) {
                            this.editor.setValue(result.content);
                            new Notice('Whitespace normalized successfully');
                        } else {
                            new Notice('No whitespace changes needed');
                        }
                    })
            );
    }

    private createSelectionOperationsSection(contentEl: HTMLElement) {
        const section = contentEl.createEl('div', { cls: 'modal-section' });
        section.createEl('h3', { text: 'Selection Operations' });

        // Text Case Transformations
        new Setting(section)
            .setName('Text Case')
            .setDesc('Transform selected text case')
            .addButton(button => 
                button
                    .setButtonText('UPPERCASE')
                    .onClick(() => {
                        const selection = this.editor.getSelection();
                        if (!selection) {
                            new Notice('Please select some text first');
                            return;
                        }
                        const result = selectionService.toUpperCase(selection);
                        this.editor.replaceSelection(result.processedText);
                        new Notice('Text converted to uppercase');
                    })
            )
            .addButton(button => 
                button
                    .setButtonText('lowercase')
                    .onClick(() => {
                        const selection = this.editor.getSelection();
                        if (!selection) {
                            new Notice('Please select some text first');
                            return;
                        }
                        const result = selectionService.toLowerCase(selection);
                        this.editor.replaceSelection(result.processedText);
                        new Notice('Text converted to lowercase');
                    })
            )
            .addButton(button => 
                button
                    .setButtonText('Title Case')
                    .onClick(() => {
                        const selection = this.editor.getSelection();
                        if (!selection) {
                            new Notice('Please select some text first');
                            return;
                        }
                        const result = selectionService.toTitleCase(selection);
                        this.editor.replaceSelection(result.processedText);
                        new Notice('Text converted to title case');
                    })
            );

        // Wrap Lines Section
        let wrapPrefix = '> ';
        let wrapSuffix = '';
        new Setting(section)
            .setName('Wrap Lines')
            .setDesc('Wrap each line in selection with prefix/suffix')
            .addText(text => 
                text
                    .setPlaceholder('Prefix (default: "> ")')
                    .onChange((value) => { wrapPrefix = value || '> '; })
            )
            .addText(text => 
                text
                    .setPlaceholder('Suffix (optional)')
                    .onChange((value) => { wrapSuffix = value; })
            )
            .addButton(button => 
                button
                    .setButtonText('Wrap Lines')
                    .onClick(() => {
                        const selection = this.editor.getSelection();
                        if (!selection) {
                            new Notice('Please select some text first');
                            return;
                        }
                        const result = selectionService.wrapLines(selection, wrapPrefix, wrapSuffix);
                        this.editor.replaceSelection(result.processedText);
                        new Notice(`Wrapped ${result.stats.linesProcessed} lines`);
                    })
            );

        // Line Operations
        new Setting(section)
            .setName('Line Operations')
            .setDesc('Various line-based operations')
            .addButton(button => 
                button
                    .setButtonText('Remove Empty Lines')
                    .onClick(() => {
                        const selection = this.editor.getSelection();
                        if (!selection) {
                            new Notice('Please select some text first');
                            return;
                        }
                        const result = selectionService.removeEmptyLines(selection);
                        this.editor.replaceSelection(result.processedText);
                        new Notice(`Removed ${result.stats.linesProcessed} empty lines`);
                    })
            )
            .addButton(button => 
                button
                    .setButtonText('Sort Lines')
                    .onClick(() => {
                        const selection = this.editor.getSelection();
                        if (!selection) {
                            new Notice('Please select some text first');
                            return;
                        }
                        const result = selectionService.sortLines(selection);
                        this.editor.replaceSelection(result.processedText);
                        new Notice(`Sorted ${result.stats.linesProcessed} lines`);
                    })
            )
            .addButton(button => 
                button
                    .setButtonText('Trim Lines')
                    .onClick(() => {
                        const selection = this.editor.getSelection();
                        if (!selection) {
                            new Notice('Please select some text first');
                            return;
                        }
                        const result = selectionService.trimLines(selection);
                        this.editor.replaceSelection(result.processedText);
                        new Notice('Lines trimmed successfully');
                    })
            );

        // Add Line Numbers Section
        let startNumber = 1;
        new Setting(section)
            .setName('Add Line Numbers')
            .setDesc('Add line numbers to selected text')
            .addText(text => 
                text
                    .setPlaceholder('Starting number (default: 1)')
                    .onChange((value) => { 
                        const num = parseInt(value);
                        startNumber = isNaN(num) ? 1 : num;
                    })
            )
            .addButton(button => 
                button
                    .setButtonText('Add Numbers')
                    .onClick(() => {
                        const selection = this.editor.getSelection();
                        if (!selection) {
                            new Notice('Please select some text first');
                            return;
                        }
                        const result = selectionService.addLineNumbers(selection, startNumber);
                        this.editor.replaceSelection(result.processedText);
                        new Notice(`Added numbers to ${result.stats.linesProcessed} lines`);
                    })
            );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
