/**
 * Site UUID Service
 * 
 * Provides functionality to add and manage site_uuid properties in frontmatter.
 * This is adapted from the tidyverse observers addSiteUUID handler.
 */

import { TFile } from 'obsidian';
import { generateUUID, isValidUUID } from '../utils/uuidGenerator';
import { extractFrontmatter, formatFrontmatter, updateFileFrontmatter } from '../utils/yamlFrontmatter';
import { logger } from '../utils/logger';

export interface SiteUuidResult {
  success: boolean;
  message: string;
  uuid?: string;
  hadExistingUuid?: boolean;
}

/**
 * Evaluates if a site_uuid should be added to the frontmatter
 * 
 * @param frontmatter The frontmatter object to check
 * @param filePath The file path (for logging)
 * @returns An object with expectSiteUUID boolean and details
 */
export function evaluateSiteUUID(frontmatter: Record<string, any>, filePath: string): { expectSiteUUID: boolean; reason: string } {
  logger.info(`[evaluateSiteUUID] Checking file: ${filePath}`);
  
  // Check if site_uuid exists and is valid
  if (!frontmatter.site_uuid) {
    logger.info(`[evaluateSiteUUID] site_uuid is missing`);
    return { expectSiteUUID: true, reason: 'site_uuid property is missing' };
  }
  
  if (typeof frontmatter.site_uuid !== 'string') {
    logger.info(`[evaluateSiteUUID] site_uuid is not a string: ${typeof frontmatter.site_uuid}`);
    return { expectSiteUUID: true, reason: 'site_uuid is not a string' };
  }
  
  if (!isValidUUID(frontmatter.site_uuid)) {
    logger.info(`[evaluateSiteUUID] site_uuid is not a valid UUID: ${frontmatter.site_uuid}`);
    return { expectSiteUUID: true, reason: 'site_uuid is not a valid UUID format' };
  }
  
  logger.info(`[evaluateSiteUUID] site_uuid is valid: ${frontmatter.site_uuid}`);
  return { expectSiteUUID: false, reason: 'site_uuid is already valid' };
}

/**
 * Adds a site_uuid to the frontmatter if needed
 * 
 * @param frontmatter The frontmatter object to update
 * @param filePath The file path (for logging)
 * @returns An object with changes and metadata
 */
export function addSiteUUID(frontmatter: Record<string, any>, filePath: string): { changes: Record<string, any>; hadExisting: boolean } {
  logger.info(`[addSiteUUID] Processing file: ${filePath}`);
  
  const evaluation = evaluateSiteUUID(frontmatter, filePath);
  
  if (!evaluation.expectSiteUUID) {
    logger.info(`[addSiteUUID] No changes needed: ${evaluation.reason}`);
    return { changes: {}, hadExisting: true };
  }
  
  const newUUID = generateUUID();
  logger.info(`[addSiteUUID] Generated new UUID: ${newUUID}`);
  
  return { 
    changes: { site_uuid: newUUID },
    hadExisting: !!frontmatter.site_uuid
  };
}

/**
 * Processes a file to add site_uuid if needed
 * 
 * @param file The Obsidian file to process
 * @returns Promise<SiteUuidResult> Result of the operation
 */
export async function processSiteUuidForFile(file: TFile): Promise<SiteUuidResult> {
  try {
    logger.info(`[processSiteUuidForFile] Processing: ${file.path}`);
    
    // Read the file content
    const content = await file.vault.read(file);
    
    // Extract existing frontmatter
    const frontmatter = extractFrontmatter(content) || {};
    
    // Check if we need to add/update site_uuid
    const result = addSiteUUID(frontmatter, file.path);
    
    if (Object.keys(result.changes).length === 0) {
      return {
        success: true,
        message: 'File already has a valid site_uuid',
        uuid: frontmatter.site_uuid,
        hadExistingUuid: true
      };
    }
    
    // Apply changes to frontmatter
    const updatedFrontmatter = { ...frontmatter, ...result.changes };
    
    // Format and update the file
    const formattedFrontmatter = formatFrontmatter(updatedFrontmatter);
    await updateFileFrontmatter(file, formattedFrontmatter);
    
    const newUuid = result.changes.site_uuid;
    logger.info(`[processSiteUuidForFile] Successfully added UUID: ${newUuid}`);
    
    return {
      success: true,
      message: result.hadExisting ? 'Updated invalid site_uuid' : 'Added new site_uuid',
      uuid: newUuid,
      hadExistingUuid: result.hadExisting
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[processSiteUuidForFile] Error processing ${file.path}: ${errorMessage}`);
    
    return {
      success: false,
      message: `Error: ${errorMessage}`
    };
  }
}

/**
 * Processes multiple files to add site_uuid where needed
 * 
 * @param files Array of Obsidian files to process
 * @returns Promise<SiteUuidResult[]> Results for each file
 */
export async function processSiteUuidForFiles(files: TFile[]): Promise<SiteUuidResult[]> {
  const results: SiteUuidResult[] = [];
  
  for (const file of files) {
    const result = await processSiteUuidForFile(file);
    results.push(result);
  }
  
  return results;
}
