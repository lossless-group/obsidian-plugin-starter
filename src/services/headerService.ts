/**
 * Header Service
 * 
 * Provides functionality to generate and update header properties in frontmatter.
 * Handles title, lede, slug, and semantic version generation and updates.
 */

import { TFile, App } from 'obsidian';
import { extractFrontmatter, formatFrontmatter, updateFileFrontmatter } from '../utils/yamlFrontmatter';
import { logger } from '../utils/logger';

export interface HeaderUpdateResult {
  success: boolean;
  message: string;
  property: string;
  value?: string;
  hadExisting?: boolean;
}

export interface TocEntry {
  level: number;
  text: string;
  anchor: string;
  line: number;
}

export interface TocGenerationResult {
  success: boolean;
  message: string;
  toc?: string;
  entriesCount?: number;
}

/**
 * Generates a title based on filename
 * 
 * @param fileName The file name (without extension)
 * @returns Generated title string
 */
export function generateTitle(fileName: string): string {
  logger.info(`[generateTitle] Generating title for file: ${fileName}`);
  
  // Generate title from formatted filename
  const title = fileName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
  
  logger.info(`[generateTitle] Generated title from filename: ${title}`);
  return title;
}

/**
 * Generates a lede (summary) based on file content
 * 
 * @param app The Obsidian App instance
 * @param file The Obsidian file to generate lede from
 * @param content The markdown content of the file
 * @returns Generated lede string
 */
export function generateLede(app: App, file: TFile, content: string): string {
  logger.info(`[generateLede] Generating lede from content`);
  
  // Use Obsidian API to get content start position after frontmatter
  const fileCache = app.metadataCache.getFileCache(file);
  let contentStart = 0;
  
  // Try to get contentStart from frontmatter metadata
  if (fileCache?.frontmatterPosition) {
    // The contentStart is the end of the frontmatter section
    contentStart = fileCache.frontmatterPosition.end.offset;
  }
  
  // Fallback: if API doesn't provide contentStart, manually find end of frontmatter
  if (contentStart === 0) {
    const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/);
    if (frontmatterMatch) {
      contentStart = frontmatterMatch[0].length;
    }
  }
  
  // Get content after frontmatter
  const bodyContent = content.substring(contentStart).trim();
  
  // Take first 150 characters of the body content
  let lede = bodyContent
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();
  
  if (lede.length > 150) {
    lede = lede.substring(0, 147) + '...';
  }
  
  if (lede.length === 0) {
    lede = 'Brief description of the content';
  }
  
  logger.info(`[generateLede] Generated lede: ${lede}`);
  return lede;
}

/**
 * Generates a URL-friendly slug based on title or filename
 * 
 * @param title The title to convert to slug
 * @param fileName Fallback filename if no title
 * @returns Generated slug string
 */
export function generateSlug(title: string, fileName: string): string {
  logger.info(`[generateSlug] Generating slug from title: ${title}`);
  
  const source = title || fileName;
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  logger.info(`[generateSlug] Generated slug: ${slug}`);
  return slug;
}

/**
 * Generates a semantic version, incrementing patch version if one exists
 * 
 * @param currentVersion Current semantic version if any
 * @returns Generated semantic version string
 */
export function generateSemanticVersion(currentVersion?: string): string {
  logger.info(`[generateSemanticVersion] Current version: ${currentVersion}`);
  
  if (!currentVersion) {
    logger.info(`[generateSemanticVersion] No current version, starting with 0.0.0.0`);
    return '0.0.0.1';
  }
  
  // Parse 4-part semantic version (epic.major.minor.patch)
  const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (versionMatch && versionMatch[1] && versionMatch[2] && versionMatch[3] && versionMatch[4]) {
    const epic = parseInt(versionMatch[1]);
    const major = parseInt(versionMatch[2]);
    const minor = parseInt(versionMatch[3]);
    const patch = parseInt(versionMatch[4]) + 1;
    const newVersion = `${epic}.${major}.${minor}.${patch}`;
    logger.info(`[generateSemanticVersion] Incremented patch: ${newVersion}`);
    return newVersion;
  }
  
  // If not valid semver, start fresh
  logger.info(`[generateSemanticVersion] Invalid current version, starting with 0.1.0`);
  return '0.1.0';
}

/**
 * Updates a specific header property in a file's frontmatter
 * 
 * @param file The Obsidian file to update
 * @param property The property name to update
 * @param value The new value for the property
 * @returns Promise<HeaderUpdateResult> Result of the operation
 */
export async function updateHeaderProperty(file: TFile, property: string, value: string): Promise<HeaderUpdateResult> {
  try {
    logger.info(`[updateHeaderProperty] Updating ${property} in ${file.path}`);
    
    // Read current content and frontmatter
    const content = await file.vault.read(file);
    const frontmatter = extractFrontmatter(content) || {};
    
    const hadExisting = frontmatter[property] !== undefined;
    
    // Update the property
    if (value.trim() === '') {
      delete frontmatter[property];
    } else {
      frontmatter[property] = value;
    }
    
    // Write back to file
    const formattedFrontmatter = formatFrontmatter(frontmatter);
    await updateFileFrontmatter(file, formattedFrontmatter);
    
    logger.info(`[updateHeaderProperty] Successfully updated ${property}: ${value}`);
    
    const result: HeaderUpdateResult = {
      success: true,
      message: hadExisting ? `Updated ${property}` : `Added ${property}`,
      property,
      hadExisting
    };
    
    if (value.trim() !== '') {
      result.value = value;
    }
    
    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[updateHeaderProperty] Error updating ${property} in ${file.path}: ${errorMessage}`);
    
    return {
      success: false,
      message: `Error updating ${property}: ${errorMessage}`,
      property
    };
  }
}

/**
 * Generates and updates the title property for a file
 * 
 * @param file The Obsidian file to process
 * @returns Promise<HeaderUpdateResult> Result of the operation
 */
export async function generateAndUpdateTitle(file: TFile): Promise<HeaderUpdateResult> {
  try {
    const fileName = file.basename;
    const generatedTitle = generateTitle(fileName);
    
    return await updateHeaderProperty(file, 'title', generatedTitle);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error generating title: ${errorMessage}`,
      property: 'title'
    };
  }
}

/**
 * Generates and updates the lede property for a file
 * 
 * @param app The Obsidian App instance
 * @param file The Obsidian file to process
 * @returns Promise<HeaderUpdateResult> Result of the operation
 */
export async function generateAndUpdateLede(app: App, file: TFile): Promise<HeaderUpdateResult> {
  try {
    const content = await file.vault.read(file);
    const generatedLede = generateLede(app, file, content);
    
    return await updateHeaderProperty(file, 'lede', generatedLede);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error generating lede: ${errorMessage}`,
      property: 'lede'
    };
  }
}

/**
 * Generates and updates the slug property for a file
 * 
 * @param file The Obsidian file to process
 * @returns Promise<HeaderUpdateResult> Result of the operation
 */
export async function generateAndUpdateSlug(file: TFile): Promise<HeaderUpdateResult> {
  try {
    const content = await file.vault.read(file);
    const frontmatter = extractFrontmatter(content) || {};
    const title = frontmatter.title || file.basename;
    const generatedSlug = generateSlug(title, file.basename);
    
    return await updateHeaderProperty(file, 'slug', generatedSlug);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error generating slug: ${errorMessage}`,
      property: 'slug'
    };
  }
}

/**
 * Generates and updates the semantic version property for a file
 * 
 * @param file The Obsidian file to process
 * @returns Promise<HeaderUpdateResult> Result of the operation
 */
export async function generateAndUpdateSemanticVersion(file: TFile): Promise<HeaderUpdateResult> {
  try {
    const content = await file.vault.read(file);
    const frontmatter = extractFrontmatter(content) || {};
    const currentVersion = frontmatter.at_semantic_version;
    const generatedVersion = generateSemanticVersion(currentVersion);
    
    return await updateHeaderProperty(file, 'at_semantic_version', generatedVersion);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error generating semantic version: ${errorMessage}`,
      property: 'at_semantic_version'
    };
  }
}

/**
 * Generates a GitHub-style anchor link from header text
 * 
 * @param headerText The header text to convert to anchor
 * @returns GitHub-style anchor string
 */
export function generateGitHubAnchor(headerText: string): string {
  return headerText
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extracts headers from markdown content
 * 
 * @param content The markdown content to parse
 * @returns Array of TocEntry objects
 */
export function extractHeaders(content: string): TocEntry[] {
  logger.info('[extractHeaders] Extracting headers from content');
  
  const headers: TocEntry[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    if (!currentLine) continue;
    
    const line = currentLine.trim();
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headerMatch && headerMatch.length >= 3 && headerMatch[1] && headerMatch[2]) {
      const level = headerMatch[1].length;
      const text = headerMatch[2].trim();
      const anchor = generateGitHubAnchor(text);
      
      headers.push({
        level,
        text,
        anchor,
        line: i + 1
      });
    }
  }
  
  logger.info(`[extractHeaders] Found ${headers.length} headers`);
  return headers;
}

/**
 * Generates a Table of Contents in GitHub Flavored Markdown style
 * 
 * @param headers Array of TocEntry objects
 * @returns Formatted TOC string
 */
export function generateTocMarkdown(headers: TocEntry[]): string {
  logger.info('[generateTocMarkdown] Generating TOC markdown');
  
  if (headers.length === 0) {
    return '';
  }
  
  const tocLines: string[] = [];
  
  for (const header of headers) {
    // Calculate indentation: (level - 1) * 3 spaces for GitHub style
    const indent = '   '.repeat(Math.max(0, header.level - 1));
    const tocLine = `${indent}- [${header.text}](#${header.anchor})`;
    tocLines.push(tocLine);
  }
  
  const toc = tocLines.join('\n');
  logger.info(`[generateTocMarkdown] Generated TOC with ${tocLines.length} entries`);
  
  return toc;
}

/**
 * Generates a complete Table of Contents from markdown content
 * 
 * @param content The markdown content to generate TOC from
 * @returns TocGenerationResult with the generated TOC
 */
export function generateTableOfContents(content: string): TocGenerationResult {
  try {
    logger.info('[generateTableOfContents] Starting TOC generation');
    
    // Extract headers from content
    const headers = extractHeaders(content);
    
    if (headers.length === 0) {
      return {
        success: false,
        message: 'No headers found in the content',
        entriesCount: 0
      };
    }
    
    // Generate TOC markdown
    const toc = generateTocMarkdown(headers);
    
    return {
      success: true,
      message: `Generated TOC with ${headers.length} entries`,
      toc,
      entriesCount: headers.length
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[generateTableOfContents] Error generating TOC: ${errorMessage}`);
    
    return {
      success: false,
      message: `Error generating TOC: ${errorMessage}`
    };
  }
}

/**
 * Inserts or updates a Table of Contents in the content at the cursor position
 * 
 * @param content The current file content
 * @param cursorPosition The position where to insert the TOC
 * @returns Object with updated content and operation result
 */
export function insertTableOfContents(content: string, cursorPosition: number): { content: string; result: TocGenerationResult } {
  try {
    logger.info('[insertTableOfContents] Inserting TOC at cursor position');
    
    // Generate TOC
    const tocResult = generateTableOfContents(content);
    
    if (!tocResult.success || !tocResult.toc) {
      return { content, result: tocResult };
    }
    
    // Create TOC section with title
    const tocSection = `## Table of Contents\n\n${tocResult.toc}\n\n`;
    
    // Insert TOC at cursor position
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    const updatedContent = beforeCursor + tocSection + afterCursor;
    
    return {
      content: updatedContent,
      result: {
        ...tocResult,
        message: `Inserted TOC with ${tocResult.entriesCount || 0} entries at cursor position`
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[insertTableOfContents] Error inserting TOC: ${errorMessage}`);
    
    return {
      content,
      result: {
        success: false,
        message: `Error inserting TOC: ${errorMessage}`
      }
    };
  }
}
