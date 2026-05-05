import { App, Editor, Notice } from 'obsidian';
import { extractFrontmatter, formatFrontmatter, updateFileFrontmatter } from '../../utils/yamlFrontmatter';
import {
    generateTitle,
    generateLede,
    generateSlug,
    generateSemanticVersion,
    updateHeaderProperty
} from '../../services/headerService';
import { logger } from '../../utils/logger';

interface HeaderProperty {
    key: string;
    label: string;
}

export class HeaderInfoSection {
    private app: App;
    private editor: Editor;
    private container: HTMLElement | null = null;

    constructor(app: App, editor: Editor) {
        this.app = app;
        this.editor = editor;
    }

    async render(parentElement: HTMLElement): Promise<void> {
        const section = parentElement.createDiv({ cls: 'current-file-modal__section' });
        section.createEl('h3', {
            text: 'Header Info',
            cls: 'current-file-modal__section-title',
        });
        this.container = section;

        // Get current frontmatter values
        const frontmatter = await this.getCurrentFrontmatter();

        // Create table container
        const tableContainer = section.createDiv({ cls: 'current-file-modal__header-info-table' });

        // Define the properties we want to manage
        const headerProperties: HeaderProperty[] = [
            { key: 'title', label: 'Title' },
            { key: 'lede', label: 'Lede' },
            { key: 'slug', label: 'Slug' },
            { key: 'at_semantic_version', label: 'Semantic Version' }
        ];

        // Create header row
        this.createTableHeader(tableContainer);

        // Create rows for each property
        headerProperties.forEach(prop => {
            this.createPropertyRow(tableContainer, prop, frontmatter);
        });
    }

    private createTableHeader(tableContainer: HTMLElement): void {
        const headerRow = tableContainer.createDiv({
            cls: 'current-file-modal__header-info-grid current-file-modal__header-info-thead',
        });
        headerRow.createEl('div'); // Empty cell above checkbox column
        headerRow.createEl('div', { text: 'Generate' });
        headerRow.createEl('div', { text: 'Current Value' });
    }

    private createPropertyRow(tableContainer: HTMLElement, prop: HeaderProperty, frontmatter: Record<string, any>): void {
        const row = tableContainer.createDiv({
            cls: 'current-file-modal__header-info-grid current-file-modal__header-info-row',
        });

        // Checkbox column
        this.createCheckboxColumn(row, prop);

        // Generate button column
        this.createGenerateButtonColumn(row, prop);

        // Text input column
        this.createTextInputColumn(row, prop, frontmatter);
    }

    private createCheckboxColumn(row: HTMLElement, prop: HeaderProperty): void {
        const cell = row.createDiv({ cls: 'current-file-modal__header-checkbox-cell' });
        cell.createEl('input', {
            type: 'checkbox',
            cls: `header-checkbox-${prop.key}`,
        });
    }

    private createGenerateButtonColumn(row: HTMLElement, prop: HeaderProperty): void {
        const cell = row.createDiv();
        const generateButton = cell.createEl('button', {
            text: 'Generate',
            cls: 'mod-cta current-file-modal__header-generate-btn',
        });
        generateButton.addEventListener('click', () => this.generateHeaderProperty(prop.key));
    }

    private createTextInputColumn(row: HTMLElement, prop: HeaderProperty, frontmatter: Record<string, any>): void {
        const cell = row.createDiv();
        const textInput = cell.createEl('input', {
            type: 'text',
            cls: `current-file-modal__header-info-input header-input-${prop.key}`,
            placeholder: `Enter ${prop.label.toLowerCase()}...`,
        }) as HTMLInputElement;

        // Set current value if it exists
        const currentValue = frontmatter[prop.key];
        if (currentValue !== undefined && currentValue !== null) {
            textInput.value = String(currentValue);
        }

        // Add change listener to update frontmatter when user types
        textInput.addEventListener('change', () => this.updateHeaderProperty(prop.key, textInput.value));
    }

    private async getCurrentFrontmatter(): Promise<Record<string, any>> {
        try {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || activeFile.extension !== 'md') {
                return {};
            }

            const content = await activeFile.vault.read(activeFile);
            return extractFrontmatter(content) || {};
        } catch (error) {
            logger.error('[HeaderInfoSection] Error getting frontmatter:', error);
            return {};
        }
    }

    private async generateHeaderProperty(propertyKey: string): Promise<void> {
        try {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || activeFile.extension !== 'md') {
                new Notice('No active markdown file', 3000);
                return;
            }

            const content = await activeFile.vault.read(activeFile);
            let generatedValue: string;

            // Generate the appropriate value based on property key
            switch (propertyKey) {
                case 'title':
                    generatedValue = generateTitle(activeFile.basename);
                    break;
                case 'lede':
                    generatedValue = generateLede(this.app, activeFile, content);
                    break;
                case 'slug':
                    generatedValue = generateSlug(activeFile.basename, activeFile.basename);
                    break;
                case 'at_semantic_version':
                    const frontmatter = extractFrontmatter(content) || {};
                    generatedValue = generateSemanticVersion(frontmatter.at_semantic_version);
                    break;
                default:
                    new Notice(`Unknown property: ${propertyKey}`, 3000);
                    return;
            }

            // Update the property using the headerService
            const result = await updateHeaderProperty(activeFile, propertyKey, generatedValue);

            if (result.success) {
                new Notice(result.message, 3000);

                // Update the input field with the new value
                const input = this.container?.querySelector(`.header-input-${propertyKey}`) as HTMLInputElement;
                if (input && result.value) {
                    input.value = result.value;
                }

                // Refresh editor
                await this.refreshEditor();
            } else {
                new Notice(`Error: ${result.message}`, 5000);
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error(`[HeaderInfoSection] Error generating ${propertyKey}:`, error);
            new Notice(`Error generating ${propertyKey}: ${errorMsg}`, 5000);
        }
    }

    private async updateHeaderProperty(propertyKey: string, value: string): Promise<void> {
        try {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || activeFile.extension !== 'md') {
                return;
            }

            // Get current frontmatter
            const content = await activeFile.vault.read(activeFile);
            const frontmatter = extractFrontmatter(content) || {};

            // Update the property
            if (value.trim() === '') {
                delete frontmatter[propertyKey];
            } else {
                frontmatter[propertyKey] = value;
            }

            // Write back to file
            const formattedFrontmatter = formatFrontmatter(frontmatter);
            await updateFileFrontmatter(activeFile, formattedFrontmatter);

            // Refresh editor
            await this.refreshEditor();

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error(`[HeaderInfoSection] Error updating ${propertyKey}:`, error);
            new Notice('Error updating header property: ' + errorMsg, 5000);
        }
    }

    private async refreshEditor(): Promise<void> {
        try {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                const updatedContent = await activeFile.vault.read(activeFile);
                this.editor.setValue(updatedContent);
            }
        } catch (error) {
            logger.error('[HeaderInfoSection] Error refreshing editor:', error);
        }
    }

    /**
     * Cleanup method to remove event listeners if needed
     */
    destroy(): void {
        // Any cleanup logic can go here
        this.container = null;
    }
}
