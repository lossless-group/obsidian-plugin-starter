/**
 * UUID Generator Utility
 * 
 * Provides UUID v4 generation functionality for the Obsidian plugin.
 * This is adapted from the tidyverse observers system to work in the browser environment.
 */

/**
 * Generate a UUID v4 for use in frontmatter
 * 
 * This function generates a UUID v4 using the crypto API available in modern browsers.
 * Falls back to a pseudo-random implementation if crypto API is not available.
 * 
 * @returns A new UUID v4 string
 */
export function generateUUID(): string {
  // Try to use the crypto API if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate if a string is a valid UUID v4
 * 
 * @param uuid The string to validate
 * @returns true if the string is a valid UUID v4, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
