import { App, Editor } from 'obsidian';
import { extractFrontmatter } from '../utils/yamlFrontmatter';
import { logger } from '../utils/logger';

export interface BacklinkUrlResult {
    success: boolean;
    message: string;
    updatedLine?: string;
}

/**
 * Service for processing backlinks and appending URLs from referenced files
 */
export class BacklinkUrlService {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Process the backlink before cursor on current line and append URL
     */
    async processBacklinkAtCursor(editor: Editor): Promise<BacklinkUrlResult> {
        try {
            logger.info('[BacklinkUrlService] Processing backlink at cursor');
            
            const cursor = editor.getCursor();
            const currentLine = editor.getLine(cursor.line);
            const cursorPos = cursor.ch;

            // Find backlinks before cursor position
            const wikilinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
            let match;
            let targetMatch = null;

            // Find the last backlink before cursor position
            while ((match = wikilinkRegex.exec(currentLine)) !== null) {
                if (match.index < cursorPos) {
                    targetMatch = match;
                } else {
                    break;
                }
            }

            if (!targetMatch) {
                return {
                    success: false,
                    message: 'No backlink found before cursor on current line'
                };
            }

            const [fullMatch, filePath, displayText] = targetMatch;
            
            if (!filePath) {
                return {
                    success: false,
                    message: 'Invalid backlink format'
                };
            }
            
            const linkText = displayText || filePath.split('/').pop() || filePath;

            logger.info(`[BacklinkUrlService] Found backlink: ${fullMatch}, path: ${filePath}, display: ${linkText}`);

            // Find the referenced file
            const file = this.app.metadataCache.getFirstLinkpathDest(filePath, '');
            if (!file) {
                return {
                    success: false,
                    message: `Referenced file not found: ${filePath}`
                };
            }

            // Read the file and extract frontmatter
            const fileContent = await this.app.vault.read(file);
            const frontmatter = extractFrontmatter(fileContent);

            if (!frontmatter || !frontmatter.url) {
                return {
                    success: false,
                    message: `No 'url' property found in ${file.name}`
                };
            }

            const url = frontmatter.url;
            
            // Check if URL is already appended (avoid duplicates)
            const expectedAppend = ` [${linkText}](${url})`;
            const matchEnd = targetMatch.index + fullMatch.length;
            const afterMatch = currentLine.substring(matchEnd);
            
            if (afterMatch.startsWith(expectedAppend)) {
                return {
                    success: false,
                    message: 'URL already appended to this backlink'
                };
            }

            // Create the updated line
            const beforeMatch = currentLine.substring(0, matchEnd);
            const updatedLine = beforeMatch + expectedAppend + afterMatch;

            // Update the line in the editor
            editor.setLine(cursor.line, updatedLine);

            // Move cursor to end of inserted content
            const newCursorPos = matchEnd + expectedAppend.length;
            editor.setCursor(cursor.line, newCursorPos);

            logger.info(`[BacklinkUrlService] Successfully appended URL: ${url}`);

            return {
                success: true,
                message: `Added URL for ${linkText}: ${url}`,
                updatedLine
            };

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error('[BacklinkUrlService] Error processing backlink:', error);
            return {
                success: false,
                message: `Error: ${errorMsg}`
            };
        }
    }

    /**
     * Check if there's a backlink before cursor on current line
     */
    hasBacklinkBeforeCursor(editor: Editor): boolean {
        try {
            const cursor = editor.getCursor();
            const currentLine = editor.getLine(cursor.line);
            const cursorPos = cursor.ch;

            const wikilinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
            let match;

            while ((match = wikilinkRegex.exec(currentLine)) !== null) {
                if (match.index < cursorPos) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            logger.error('[BacklinkUrlService] Error checking backlink:', error);
            return false;
        }
    }
}


