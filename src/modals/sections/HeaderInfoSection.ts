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
        const section = parentElement.createEl('div', { cls: 'modal-section header-info-section' });
        section.createEl('h3', { text: 'Header Info' });
        this.container = section;

        // Get current frontmatter values
        const frontmatter = await this.getCurrentFrontmatter();
        
        // Create table container
        const tableContainer = section.createEl('div', { cls: 'header-info-table' });
        this.setupTableStyles(tableContainer);

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

    private setupTableStyles(tableContainer: HTMLElement): void {
        tableContainer.style.display = 'flex';
        tableContainer.style.flexDirection = 'column';
        tableContainer.style.gap = '8px';
        tableContainer.style.marginTop = '10px';
    }

    private createTableHeader(tableContainer: HTMLElement): void {
        const headerRow = tableContainer.createEl('div', { cls: 'header-row' });
        headerRow.style.display = 'grid';
        headerRow.style.gridTemplateColumns = '30px 80px 1fr';
        headerRow.style.gap = '8px';
        headerRow.style.alignItems = 'center';
        headerRow.style.fontWeight = 'bold';
        headerRow.style.fontSize = '12px';
        headerRow.style.borderBottom = '1px solid var(--background-modifier-border)';
        headerRow.style.paddingBottom = '5px';
        headerRow.style.marginBottom = '5px';
        
        headerRow.createEl('div', { text: '' }); // Empty header for checkbox column
        headerRow.createEl('div', { text: 'Generate' });
        headerRow.createEl('div', { text: 'Current Value' });
    }

    private createPropertyRow(tableContainer: HTMLElement, prop: HeaderProperty, frontmatter: Record<string, any>): void {
        const row = tableContainer.createEl('div', { cls: 'header-info-row' });
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '30px 80px 1fr';
        row.style.gap = '8px';
        row.style.alignItems = 'center';
        row.style.padding = '5px 0';
        
        // Checkbox column
        this.createCheckboxColumn(row, prop);
        
        // Generate button column
        this.createGenerateButtonColumn(row, prop);
        
        // Text input column
        this.createTextInputColumn(row, prop, frontmatter);
    }

    private createCheckboxColumn(row: HTMLElement, prop: HeaderProperty): void {
        const checkboxContainer = row.createEl('div');
        checkboxContainer.style.display = 'flex';
        checkboxContainer.style.justifyContent = 'center';
        const checkbox = checkboxContainer.createEl('input', {
            type: 'checkbox',
            cls: `header-checkbox-${prop.key}`
        });
        checkbox.style.transform = 'scale(0.9)';
        checkbox.style.margin = '0';
    }

    private createGenerateButtonColumn(row: HTMLElement, prop: HeaderProperty): void {
        const buttonContainer = row.createEl('div');
        const generateButton = buttonContainer.createEl('button', {
            text: 'Generate',
            cls: 'mod-cta header-generate-btn'
        });
        generateButton.style.fontSize = '11px';
        generateButton.style.padding = '2px 6px';
        generateButton.style.minHeight = '24px';
        generateButton.addEventListener('click', () => this.generateHeaderProperty(prop.key));
    }

    private createTextInputColumn(row: HTMLElement, prop: HeaderProperty, frontmatter: Record<string, any>): void {
        const inputContainer = row.createEl('div');
        const textInput = inputContainer.createEl('input', {
            type: 'text',
            cls: `header-input-${prop.key}`,
            placeholder: `Enter ${prop.label.toLowerCase()}...`
        }) as HTMLInputElement;
        
        // Style the input
        textInput.style.width = '100%';
        textInput.style.padding = '4px 8px';
        textInput.style.border = '1px solid var(--background-modifier-border)';
        textInput.style.borderRadius = '3px';
        textInput.style.backgroundColor = 'var(--background-primary)';
        textInput.style.color = 'var(--text-normal)';
        
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