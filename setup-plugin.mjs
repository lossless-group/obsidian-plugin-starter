#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple YAML parser for our specific needs
function parseSimpleYAML(content) {
    const lines = content.split('\n');
    const result = {};
    let currentSection = null;
    let currentArray = null;
    let arrayKey = null;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        // Handle sections
        if (trimmed.endsWith(':') && !trimmed.includes('"')) {
            currentSection = trimmed.slice(0, -1);
            result[currentSection] = {};
            currentArray = null;
            continue;
        }
        
        // Handle key-value pairs
        if (trimmed.includes(':') && currentSection) {
            const colonIndex = trimmed.indexOf(':');
            const key = trimmed.slice(0, colonIndex).trim();
            const value = trimmed.slice(colonIndex + 1).trim();
            
            if (value.startsWith('"') && value.endsWith('"')) {
                // String value
                result[currentSection][key] = value.slice(1, -1);
            } else if (value === 'true' || value === 'false') {
                // Boolean value
                result[currentSection][key] = value === 'true';
            } else if (!isNaN(value) && value !== '') {
                // Number value
                result[currentSection][key] = parseFloat(value);
            } else if (value === '' || value === '[]') {
                // Array start
                result[currentSection][key] = [];
                currentArray = result[currentSection][key];
                arrayKey = key;
            } else {
                // String without quotes
                result[currentSection][key] = value;
            }
        }
        
        // Handle array items
        if (trimmed.startsWith('-') && currentArray) {
            const item = trimmed.slice(1).trim();
            if (item.startsWith('"') && item.endsWith('"')) {
                currentArray.push(item.slice(1, -1));
            } else {
                currentArray.push(item);
            }
        }
    }
    
    return result;
}

// Read and parse config file
function loadConfig() {
    try {
        const configPath = path.join(__dirname, 'plugin-config.yaml');
        const configContent = fs.readFileSync(configPath, 'utf8');
        return parseSimpleYAML(configContent);
    } catch (error) {
        console.error('Error reading plugin-config.yaml:', error.message);
        process.exit(1);
    }
}

// Replace placeholders in a string
function replacePlaceholders(content, config) {
    return content
        .replace(/\{\{PLUGIN_ID\}\}/g, config.plugin.id)
        .replace(/\{\{PLUGIN_NAME\}\}/g, config.plugin.name)
        .replace(/\{\{PLUGIN_CLASS_NAME\}\}/g, config.plugin.class_name)
        .replace(/\{\{PLUGIN_VERSION\}\}/g, config.plugin.version)
        .replace(/\{\{PLUGIN_DESCRIPTION\}\}/g, config.plugin.description)
        .replace(/\{\{PLUGIN_AUTHOR\}\}/g, config.plugin.author)
        .replace(/\{\{PLUGIN_AUTHOR_URL\}\}/g, config.plugin.author_url)
        .replace(/\{\{PLUGIN_FUNDING_URL\}\}/g, config.plugin.funding_url)
        .replace(/\{\{MIN_APP_VERSION\}\}/g, config.plugin.min_app_version);
}

// Process a single file
function processFile(filePath, config) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = replacePlaceholders(content, config);
        
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✓ Updated: ${path.relative(__dirname, filePath)}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Get all files to process
function getFilesToProcess() {
    const filesToProcess = [];
    
    // TypeScript/JavaScript files
    const srcDirs = ['src', '.'];
    const extensions = ['.ts', '.js', '.mjs'];
    
    for (const dir of srcDirs) {
        if (!fs.existsSync(dir)) continue;
        
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            if (file.isFile() && extensions.some(ext => file.name.endsWith(ext))) {
                filesToProcess.push(path.join(dir, file.name));
            } else if (file.isDirectory() && dir === 'src') {
                // Process subdirectories in src
                const subDir = path.join(dir, file.name);
                const subFiles = fs.readdirSync(subDir);
                for (const subFile of subFiles) {
                    if (extensions.some(ext => subFile.endsWith(ext))) {
                        filesToProcess.push(path.join(subDir, subFile));
                    }
                }
            }
        }
    }
    
    // Configuration files
    const configFiles = ['package.json', 'manifest.json', 'styles.css'];
    for (const file of configFiles) {
        if (fs.existsSync(file)) {
            filesToProcess.push(file);
        }
    }
    
    return filesToProcess;
}

// Update package.json with config values
function updatePackageJson(config) {
    try {
        const packagePath = path.join(__dirname, 'package.json');
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        const packageJson = JSON.parse(packageContent);
        
        // Update package.json fields
        packageJson.name = config.plugin.id;
        packageJson.version = config.plugin.version;
        packageJson.description = config.plugin.description;
        packageJson.author = config.plugin.author;
        packageJson.keywords = config.plugin.keywords || packageJson.keywords;
        
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, '\t'), 'utf8');
        console.log('✓ Updated: package.json');
    } catch (error) {
        console.error('✗ Error updating package.json:', error.message);
    }
}

// Update manifest.json with config values
function updateManifest(config) {
    try {
        const manifestPath = path.join(__dirname, 'manifest.json');
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);
        
        // Update manifest fields
        manifest.id = config.plugin.id;
        manifest.name = config.plugin.name;
        manifest.version = config.plugin.version;
        manifest.minAppVersion = config.plugin.min_app_version;
        manifest.description = config.plugin.description;
        manifest.author = config.plugin.author;
        manifest.authorUrl = config.plugin.author_url;
        manifest.fundingUrl = config.plugin.funding_url;
        manifest.isDesktopOnly = config.plugin.is_desktop_only;
        
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t'), 'utf8');
        console.log('✓ Updated: manifest.json');
    } catch (error) {
        console.error('✗ Error updating manifest.json:', error.message);
    }
}

// Main setup function
function setupPlugin() {
    console.log('🚀 Setting up Obsidian plugin from template...\n');
    
    const config = loadConfig();
    console.log(`Plugin ID: ${config.plugin.id}`);
    console.log(`Plugin Name: ${config.plugin.name}`);
    console.log(`Class Name: ${config.plugin.class_name}`);
    console.log(`Version: ${config.plugin.version}\n`);
    
    // Process all files
    const filesToProcess = getFilesToProcess();
    let updatedCount = 0;
    
    console.log('Processing template files...');
    for (const file of filesToProcess) {
        if (processFile(file, config)) {
            updatedCount++;
        }
    }
    
    // Update special files
    updatePackageJson(config);
    updateManifest(config);
    
    console.log(`\n✅ Setup complete! Updated ${updatedCount} files.`);
    console.log('\n🔧 Next steps:');
    console.log('1. Run: pnpm install');
    console.log('2. Run: pnpm build');
    console.log('3. Test your plugin in Obsidian');
    console.log('\n📝 To make changes, edit plugin-config.yaml and run this script again.');
}

// Run the setup
setupPlugin();
