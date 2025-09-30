// src/services/selectionService.ts

/**
 * Service for processing selected text
 */

export interface SelectionResult {
    processedText: string;
    changed: boolean;
    stats: {
        linesProcessed: number;
        charactersChanged: number;
    };
}

/**
 * Transforms selected text to uppercase
 * @param text The selected text to transform
 * @returns The transformed text result
 */
export function toUpperCase(text: string): SelectionResult {
    const processedText = text.toUpperCase();
    const linesProcessed = text.split('\n').length;
    const charactersChanged = text.split('').filter((char, index) => 
        char !== processedText[index]
    ).length;
    
    return {
        processedText,
        changed: processedText !== text,
        stats: { linesProcessed, charactersChanged }
    };
}

/**
 * Transforms selected text to lowercase
 * @param text The selected text to transform
 * @returns The transformed text result
 */
export function toLowerCase(text: string): SelectionResult {
    const processedText = text.toLowerCase();
    const linesProcessed = text.split('\n').length;
    const charactersChanged = text.split('').filter((char, index) => 
        char !== processedText[index]
    ).length;
    
    return {
        processedText,
        changed: processedText !== text,
        stats: { linesProcessed, charactersChanged }
    };
}

/**
 * Transforms selected text to title case
 * @param text The selected text to transform
 * @returns The transformed text result
 */
export function toTitleCase(text: string): SelectionResult {
    const processedText = text.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
    const linesProcessed = text.split('\n').length;
    const charactersChanged = text.split('').filter((char, index) => 
        char !== processedText[index]
    ).length;
    
    return {
        processedText,
        changed: processedText !== text,
        stats: { linesProcessed, charactersChanged }
    };
}

/**
 * Wraps each line in the selection with specified characters
 * @param text The selected text to wrap
 * @param prefix The prefix to add to each line
 * @param suffix The suffix to add to each line
 * @returns The wrapped text result
 */
export function wrapLines(text: string, prefix: string = '> ', suffix: string = ''): SelectionResult {
    const lines = text.split('\n');
    const processedLines = lines.map(line => `${prefix}${line}${suffix}`);
    const processedText = processedLines.join('\n');
    
    return {
        processedText,
        changed: processedText !== text,
        stats: { 
            linesProcessed: lines.length, 
            charactersChanged: processedText.length - text.length 
        }
    };
}

/**
 * Removes empty lines from the selection
 * @param text The selected text to process
 * @returns The processed text result
 */
export function removeEmptyLines(text: string): SelectionResult {
    const lines = text.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim() !== '');
    const processedText = nonEmptyLines.join('\n');
    
    return {
        processedText,
        changed: processedText !== text,
        stats: { 
            linesProcessed: lines.length - nonEmptyLines.length, 
            charactersChanged: text.length - processedText.length 
        }
    };
}

/**
 * Sorts lines in the selection
 * @param text The selected text to sort
 * @param reverse Whether to sort in reverse order
 * @returns The sorted text result
 */
export function sortLines(text: string, reverse: boolean = false): SelectionResult {
    const lines = text.split('\n');
    const sortedLines = [...lines].sort();
    if (reverse) {
        sortedLines.reverse();
    }
    const processedText = sortedLines.join('\n');
    
    return {
        processedText,
        changed: processedText !== text,
        stats: { 
            linesProcessed: lines.length, 
            charactersChanged: 0 // Same characters, just reordered
        }
    };
}

/**
 * Adds line numbers to the selection
 * @param text The selected text to number
 * @param startNumber The starting number (default: 1)
 * @returns The numbered text result
 */
export function addLineNumbers(text: string, startNumber: number = 1): SelectionResult {
    const lines = text.split('\n');
    const numberedLines = lines.map((line, index) => 
        `${startNumber + index}. ${line}`
    );
    const processedText = numberedLines.join('\n');
    
    return {
        processedText,
        changed: true, // Always changes since we're adding numbers
        stats: { 
            linesProcessed: lines.length, 
            charactersChanged: processedText.length - text.length 
        }
    };
}

/**
 * Trims whitespace from each line in the selection
 * @param text The selected text to trim
 * @returns The trimmed text result
 */
export function trimLines(text: string): SelectionResult {
    const lines = text.split('\n');
    const trimmedLines = lines.map(line => line.trim());
    const processedText = trimmedLines.join('\n');
    
    return {
        processedText,
        changed: processedText !== text,
        stats: { 
            linesProcessed: lines.length, 
            charactersChanged: text.length - processedText.length 
        }
    };
}

/**
 * Processes the current selection in the active editor to apply a transformation
 * @param transformFunction The function to apply to the selection
 * @returns A promise that resolves when the operation is complete
 */
export async function processSelection(
    transformFunction: (text: string) => SelectionResult
): Promise<SelectionResult | null> {
    // This function would be called from a command or UI component
    // that has access to the Obsidian editor instance
    const editor = (window as any).activeEditor?.editor;
    
    if (!editor) {
        console.warn('No active editor found');
        return null;
    }
    
    const selection = editor.getSelection();
    if (!selection) {
        console.warn('No text selected');
        return null;
    }
    
    // Process the selected text
    const result = transformFunction(selection);
    
    // Replace the selection with the processed text
    editor.replaceSelection(result.processedText);
    
    return result;
}

// Export as a service object
export const selectionService = {
    toUpperCase,
    toLowerCase,
    toTitleCase,
    wrapLines,
    removeEmptyLines,
    sortLines,
    addLineNumbers,
    trimLines,
    processSelection
};

export default selectionService;
