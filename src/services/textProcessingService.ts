// src/services/textProcessingService.ts

/**
 * Service for generic text processing operations
 */

export interface ProcessingResult {
    content: string;
    changed: boolean;
    stats: {
        itemsProcessed: number;
    };
}

export class TextProcessingService {
    /**
     * Finds all matches of a pattern in the content
     * @param content The content to search in
     * @param pattern The regex pattern to search for
     * @returns Array of matches with their positions
     */
    public findMatches(content: string, pattern: RegExp): Array<{
        match: string;
        index: number;
        lineNumber: number;
    }> {
        const matches: Array<{match: string; index: number; lineNumber: number}> = [];
        const lines = content.split('\n');
        let currentPosition = 0;
        
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            const line = lines[lineNumber] || '';
            let match;
            const linePattern = new RegExp(pattern.source, pattern.flags);
            
            while ((match = linePattern.exec(line)) !== null) {
                matches.push({
                    match: match[0],
                    index: currentPosition + match.index,
                    lineNumber: lineNumber + 1
                });
            }
            
            currentPosition += line.length + 1; // +1 for newline
        }
        
        return matches;
    }

    /**
     * Replaces all instances of a pattern with new text
     * @param content The content to process
     * @param pattern The pattern to replace
     * @param replacement The replacement text
     * @returns Processing result with updated content and stats
     */
    public replaceAll(content: string, pattern: RegExp, replacement: string): ProcessingResult {
        const originalContent = content;
        const updatedContent = content.replace(pattern, replacement);
        const matches = originalContent.match(pattern);
        const itemsProcessed = matches ? matches.length : 0;
        
        return {
            content: updatedContent,
            changed: updatedContent !== originalContent,
            stats: { itemsProcessed }
        };
    }

    /**
     * Transforms text using a custom function
     * @param content The content to transform
     * @param transformer Function to transform each match
     * @param pattern Pattern to match for transformation
     * @returns Processing result with transformed content
     */
    public transformText(
        content: string, 
        pattern: RegExp, 
        transformer: (match: string) => string
    ): ProcessingResult {
        let itemsProcessed = 0;
        const updatedContent = content.replace(pattern, (match) => {
            itemsProcessed++;
            return transformer(match);
        });
        
        return {
            content: updatedContent,
            changed: updatedContent !== content,
            stats: { itemsProcessed }
        };
    }

    /**
     * Extracts all instances of a pattern from content
     * @param content The content to extract from
     * @param pattern The pattern to extract
     * @returns Array of extracted matches
     */
    public extractAll(content: string, pattern: RegExp): string[] {
        const matches = content.match(pattern);
        return matches || [];
    }

    /**
     * Counts occurrences of a pattern in content
     * @param content The content to analyze
     * @param pattern The pattern to count
     * @returns Number of occurrences
     */
    public countOccurrences(content: string, pattern: RegExp): number {
        const matches = content.match(pattern);
        return matches ? matches.length : 0;
    }

    /**
     * Removes duplicate lines from content
     * @param content The content to deduplicate
     * @returns Processing result with deduplicated content
     */
    public removeDuplicateLines(content: string): ProcessingResult {
        const lines = content.split('\n');
        const uniqueLines = [...new Set(lines)];
        const itemsProcessed = lines.length - uniqueLines.length;
        
        return {
            content: uniqueLines.join('\n'),
            changed: itemsProcessed > 0,
            stats: { itemsProcessed }
        };
    }

    /**
     * Formats content by normalizing whitespace
     * @param content The content to format
     * @returns Processing result with normalized content
     */
    public normalizeWhitespace(content: string): ProcessingResult {
        const originalContent = content;
        // Remove extra whitespace and normalize line endings
        const normalized = content
            .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
            .trim();
        
        return {
            content: normalized,
            changed: normalized !== originalContent,
            stats: { itemsProcessed: originalContent.length - normalized.length }
        };
    }
}

// Export a singleton instance
export const textProcessingService = new TextProcessingService();

export default textProcessingService;
