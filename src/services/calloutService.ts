// src/services/calloutService.ts

import { App, MarkdownView } from 'obsidian';

/**
 * Service for processing callout syntax in selected text
 */

export interface CalloutResult {
    processedText: string;
    changed: boolean;
    stats: {
        linesProcessed: number;
        linesChanged: number;
    };
}

/**
 * Strips callout syntax ("> ") from the beginning of each line
 * @param text The selected text to process
 * @returns The processed text result
 */
export function stripCalloutSyntax(text: string): CalloutResult {
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let linesChanged = 0;
    
    for (const line of lines) {
        // Check if line starts with "> " (callout syntax)
        if (line.startsWith('> ')) {
            // Remove the "> " prefix
            processedLines.push(line.substring(2));
            linesChanged++;
        } else if (line === '>') {
            // Handle lines that are just ">" (empty callout lines)
            processedLines.push('');
            linesChanged++;
        } else {
            // Keep line as-is if it doesn't have callout syntax
            processedLines.push(line);
        }
    }
    
    const processedText = processedLines.join('\n');
    
    return {
        processedText,
        changed: linesChanged > 0,
        stats: {
            linesProcessed: lines.length,
            linesChanged
        }
    };
}

/**
 * Adds callout syntax ("> ") to the beginning of each line
 * @param text The selected text to process
 * @returns The processed text result
 */
export function addCalloutSyntax(text: string): CalloutResult {
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let linesChanged = 0;
    
    for (const line of lines) {
        // Check if line already has callout syntax
        if (line.startsWith('> ') || line === '>') {
            // Keep line as-is if it already has callout syntax
            processedLines.push(line);
        } else if (line.trim() === '') {
            // Handle empty lines - convert to empty callout line
            processedLines.push('>');
            linesChanged++;
        } else {
            // Add "> " prefix to non-empty lines
            processedLines.push('> ' + line);
            linesChanged++;
        }
    }
    
    const processedText = processedLines.join('\n');
    
    return {
        processedText,
        changed: linesChanged > 0,
        stats: {
            linesProcessed: lines.length,
            linesChanged
        }
    };
}

/**
 * Toggles callout syntax - strips if present, adds if not present
 * @param text The selected text to process
 * @returns The processed text result
 */
export function toggleCalloutSyntax(text: string): CalloutResult {
    const lines = text.split('\n');
    
    // Check if majority of lines have callout syntax
    let calloutLines = 0;
    for (const line of lines) {
        if (line.startsWith('> ') || line === '>') {
            calloutLines++;
        }
    }
    
    // If more than half the lines have callout syntax, strip it; otherwise add it
    const shouldStrip = calloutLines > lines.length / 2;
    
    return shouldStrip ? stripCalloutSyntax(text) : addCalloutSyntax(text);
}

/**
 * Processes selected text with callout operations
 * @param app The Obsidian app instance
 * @param transformFunction The transformation function to apply
 * @returns Promise that resolves to the transformation result or null if no selection
 */
export async function processCalloutSelection(
    app: App,
    transformFunction: (text: string) => CalloutResult
): Promise<CalloutResult | null> {
    const activeView = app.workspace.getActiveViewOfType(MarkdownView);
    
    if (!activeView || !activeView.editor) {
        return null;
    }
    
    const editor = activeView.editor;
    const selection = editor.getSelection();
    
    if (!selection) {
        return null;
    }
    
    const result = transformFunction(selection);
    
    if (result.changed) {
        editor.replaceSelection(result.processedText);
    }
    
    return result;
}

// Export the service object with all functions
export const calloutService = {
    stripCalloutSyntax,
    addCalloutSyntax,
    toggleCalloutSyntax,
    processCalloutSelection
};

export default calloutService;