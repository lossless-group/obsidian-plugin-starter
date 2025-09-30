// src/services/currentFileService.ts

/**
 * Service for generic file operations
 */

/**
 * Lists all headers in the file
 * @param content The file content to analyze
 * @returns An array of headers
 */
export function listHeaders(content: string): string[] {
    const headerRegex = /^#{1,6}\s+.+$/gm; // Match markdown headers
    const headers = content.match(headerRegex);
    return headers ? headers : [];
}

/**
 * Adds text at a specified position
 * @param content The original content
 * @param text The text to add
 * @param position The position to insert the text
 * @returns The content with the text added
 */
export function addText(content: string, text: string, position: number): string {
    return content.slice(0, position) + text + content.slice(position);
}

/**
 * Deletes text within a specified range
 * @param content The original content
 * @param start The start position of the text to delete
 * @param end The end position of the text to delete
 * @returns The content with the text removed
 */
export function deleteText(content: string, start: number, end: number): string {
    return content.slice(0, start) + content.slice(end);
}

/**
 * Extracts YAML frontmatter
 * @param content The content to extract YAML from
 * @returns The extracted YAML as a string
 */
export function extractYamlFrontmatter(content: string): string {
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    return match && match[1] ? match[1] : '';
}

/**
 * Changes the value of a key-value pair within the YAML frontmatter
 * @param yamlContent The YAML content as a string
 * @param key The key whose value needs to be changed
 * @param newValue The new value to set
 * @returns The updated YAML content
 */
export function changeYamlValue(yamlContent: string, key: string, newValue: string): string {
    const lines = yamlContent.split('\n');
    const updatedLines = lines.map(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const currentKey = line.substring(0, colonIndex);
            if (currentKey.trim() === key) {
                return `${currentKey}: ${newValue}`;
            }
        }
        return line;
    });
    return updatedLines.join('\n');
}

// Export as a singleton
const currentFileService = {
    listHeaders, 
    addText, 
    deleteText, 
    extractYamlFrontmatter, 
    changeYamlValue
};

export default currentFileService;

