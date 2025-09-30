import { Notice, Plugin, Editor, MarkdownView } from 'obsidian';
// Import your services here
import { processSiteUuidForFile } from './src/services/siteUuidService';
import { BacklinkUrlService } from './src/services/backlinkUrlService';
import { calloutService } from './src/services/calloutService';
import { insertTableOfContents } from './src/services/headerService';
// Import your modals here  
import { BatchDirectoryModal } from './src/modals/BatchDirectoryModal';
import { CurrentFileModal } from './src/modals/CurrentFileModal';
// Import your utilities here
// import { yourUtility } from './src/utils/yourUtility';

export default class StarterPlugin extends Plugin {
    async onload(): Promise<void> {
        // Load CSS
        this.loadStyles();
        
        // Add ribbon icon for Insert URL from Backlink
        const ribbonIconEl = this.addRibbonIcon(
            'link',
            'Insert URL from Backlink',
            async () => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView && activeView.editor) {
                    const backlinkService = new BacklinkUrlService(this.app);
                    const result = await backlinkService.processBacklinkAtCursor(activeView.editor);
                    
                    if (result.success) {
                        new Notice(result.message, 4000);
                    } else {
                        new Notice(result.message, 5000);
                    }
                } else {
                    new Notice('Please open a markdown file first');
                }
            }
        );
        ribbonIconEl.addClass('insert-backlink-url-ribbon-icon');
        
        // Register commands
        this.registerCommands();
        
        // Register command to open Batch Directory Modal
        this.addCommand({
            id: 'open-batch-directory-modal',
            name: 'Open Batch Directory Modal',
            callback: () => {
                new BatchDirectoryModal(this.app).open();
            }
        });

        // Register command to open Current File Modal
        this.addCommand({
            id: 'open-current-file-modal',
            name: 'Open Current File Modal',
            editorCallback: (editor: Editor) => {
                new CurrentFileModal(this.app, editor).open();
            }
        });
        
        // Add additional command groups as needed
        // this.registerAdditionalCommands();
    }
    
    private loadStyles() {
        // Obsidian automatically loads styles.css from the plugin directory
        // This method can be used to add additional dynamic styles if needed
        
        // Example of adding dynamic styles:
        // this.addStyle(`
        //     .my-plugin-class {
        //         color: var(--text-accent);
        //     }
        // `);
        
        console.log('Plugin styles loaded - styles.css is automatically loaded by Obsidian');
    }

    private registerCommands(): void {
        // Example command with modal
        this.addCommand({
            id: 'open-modal-command',
            name: 'Open Modal Command',
            editorCallback: (_editor: Editor) => {
                // Example: Open a modal
                // new YourModal(this.app, editor).open();
                new Notice('Modal command triggered - implement your modal here');
            }
        });

        // Example command with text processing
        this.addCommand({
            id: 'process-content-command',
            name: 'Process Content Command', 
            editorCallback: async (_editor: Editor) => {
                try {
                    // const content = editor.getValue();
                    
                    // Example: Process the content with your service
                    // const result = yourService.processContent(content);
                    // if (result.changed) {
                    //     editor.setValue(result.content);
                    //     new Notice(`Processed successfully`);
                    // } else {
                    //     new Notice('No changes needed');
                    // }
                    
                    new Notice('Content processing command - implement your logic here');
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error processing content: ' + errorMsg);
                }
            }
        });

        // Example command for cursor operations
        this.addCommand({
            id: 'insert-at-cursor-command',
            name: 'Insert at Cursor Command',
            editorCallback: (editor: Editor) => {
                try {
                    const cursor = editor.getCursor();
                    const textToInsert = 'Example text'; // Replace with your logic
                    
                    // Insert text at cursor
                    editor.replaceRange(textToInsert, cursor);
                    
                    new Notice('Text inserted at cursor');
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error inserting text: ' + errorMsg);
                }
            }
        });

        // Add site_uuid command
        this.addCommand({
            id: 'add-site-uuid',
            name: 'Add Site UUID',
            callback: async () => {
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
                    } else {
                        new Notice(`Failed to add site UUID: ${result.message}`, 5000);
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error adding site UUID: ' + errorMsg, 5000);
                }
            }
        });

        // Strip Callout Syntax from Selection
        this.addCommand({
            id: 'strip-callout-syntax',
            name: 'Strip Callout Syntax from Selection',
            editorCallback: (editor: Editor) => {
                try {
                    const selection = editor.getSelection();
                    if (!selection) {
                        new Notice('Please select some text first');
                        return;
                    }
                    
                    const result = calloutService.stripCalloutSyntax(selection);
                    
                    if (result.changed) {
                        editor.replaceSelection(result.processedText);
                        new Notice(`Stripped callout syntax from ${result.stats.linesChanged} of ${result.stats.linesProcessed} lines`);
                    } else {
                        new Notice('No callout syntax found in selection');
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error stripping callout syntax: ' + errorMsg);
                }
            }
        });

        // Add Callout Syntax to Selection
        this.addCommand({
            id: 'add-callout-syntax',
            name: 'Add Callout Syntax to Selection',
            editorCallback: (editor: Editor) => {
                try {
                    const selection = editor.getSelection();
                    if (!selection) {
                        new Notice('Please select some text first');
                        return;
                    }
                    
                    const result = calloutService.addCalloutSyntax(selection);
                    
                    if (result.changed) {
                        editor.replaceSelection(result.processedText);
                        new Notice(`Added callout syntax to ${result.stats.linesChanged} of ${result.stats.linesProcessed} lines`);
                    } else {
                        new Notice('Selection already has callout syntax');
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error adding callout syntax: ' + errorMsg);
                }
            }
        });

        // Toggle Callout Syntax for Selection
        this.addCommand({
            id: 'toggle-callout-syntax',
            name: 'Toggle Callout Syntax for Selection',
            editorCallback: (editor: Editor) => {
                try {
                    const selection = editor.getSelection();
                    if (!selection) {
                        new Notice('Please select some text first');
                        return;
                    }
                    
                    const result = calloutService.toggleCalloutSyntax(selection);
                    
                    if (result.changed) {
                        editor.replaceSelection(result.processedText);
                        const action = result.stats.linesChanged > 0 ? 'Toggled' : 'Processed';
                        new Notice(`${action} callout syntax for ${result.stats.linesChanged} of ${result.stats.linesProcessed} lines`);
                    } else {
                        new Notice('No changes needed');
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error toggling callout syntax: ' + errorMsg);
                }
            }
        });

        // Generate Table of Contents
        this.addCommand({
            id: 'generate-table-of-contents',
            name: 'Generate Table of Contents',
            editorCallback: (editor: Editor) => {
                try {
                    const content = editor.getValue();
                    const cursorPosition = editor.getCursor().ch + editor.getCursor().line * (editor.getLine(editor.getCursor().line).length + 1);
                    
                    const { content: updatedContent, result } = insertTableOfContents(content, cursorPosition);
                    
                    if (result.success) {
                        editor.setValue(updatedContent);
                        new Notice(result.message);
                    } else {
                        new Notice(result.message);
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    new Notice('Error generating table of contents: ' + errorMsg);
                }
            }
        });
    }

    // Additional command groups can be registered here as needed
    // private registerSelectionCommands(): void {
    //     this.addCommand({
    //         id: 'process-selection-command',
    //         name: 'Process Selection Command',
    //         editorCallback: (editor: Editor) => {
    //             const selection = editor.getSelection();
    //             if (!selection) {
    //                 new Notice('Please select some text first');
    //                 return;
    //             }
    //             
    //             // Example: Process the selection
    //             // const processed = yourService.processSelection(selection);
    //             // editor.replaceSelection(processed);
    //             
    //             editor.replaceSelection(selection.toUpperCase()); // Example transformation
    //             new Notice('Selection processed successfully');
    //         }
    //     });
    // }
}