# 🚀 Obsidian Plugin Starter Kit

![Obsidian Plugin Starter Kit by The Lossless Group](https://i.imgur.com/nfqH3Pi.png)

A comprehensive starter template for building powerful Obsidian plugins with modern tooling, extensive examples, and production-ready features. This kit provides a solid foundation with real-world functionality that you can build upon or use as-is.

### Recent Release
0.0.8 - 2025-09-26
- Implemented Table of Contents Generator
- Implemented Callout Processing, Stripping and Adding callout syntax on selection.

## ✨ Features

### 🎯 Core Functionality

#### UUID Management
- **Add Site UUID**: Automatically generates and adds unique identifiers to file frontmatter
- **Smart Detection**: Validates existing UUIDs and only adds when needed
- **Frontmatter Integration**: Seamlessly works with YAML frontmatter

#### Callout Processing
Transform markdown callout syntax with ease:
- **Strip Callout Syntax**: Remove `> ` from selected text to convert callouts back to regular text
- **Add Callout Syntax**: Convert regular text into callout blocks
- **Toggle Callout Syntax**: Intelligently switch between callout and regular text based on current state

**Example:**
```markdown
> ## Enterprise-Wide Integrations
> 
> By connecting these capabilities across organizations...
```
Becomes:
```markdown
## Enterprise-Wide Integrations

By connecting these capabilities across organizations...
```

#### Backlink URL Processing
- **Smart URL Appending**: Automatically append URLs from referenced files to backlinks
- **Frontmatter Integration**: Extracts URLs from referenced file frontmatter
- **Duplicate Prevention**: Avoids adding duplicate URLs to existing backlinks

#### Table of Contents Generation
Generate professional GitHub Flavored Markdown-style table of contents:
- **GitHub-Style Anchors**: Creates proper anchor links compatible with GitHub markdown
- **Smart Indentation**: Uses three-space indentation for proper hierarchy (h1-h6)
- **Automatic Insertion**: Inserts TOC at cursor position or replaces existing TOC
- **Header Detection**: Automatically finds and processes all markdown headers in the document

**Example Output:**
```markdown
- [Prerequisites](#prerequisites)
   - [Node.js Installation](#nodejs-installation)
      - [Version Requirements](#version-requirements)
         - [Additional Notes](#additional-notes)
```

### 🎛️ Interactive Modals

#### Current File Modal
A comprehensive interface for file operations:
- **UUID Operations**: Add/update site UUIDs with visual feedback
- **Publish State Management**: Toggle publish status in frontmatter
- **Header Info Generation**: Auto-generate titles, descriptions, slugs, and semantic versions
- **File Operations**: List headers, add/delete text, modify YAML frontmatter
- **Text Processing**: Find/replace, transform text, extract content, normalize whitespace
- **Selection Tools**: Case conversion, line wrapping, sorting, numbering, trimming

#### Batch Directory Modal
Process multiple files at once:
- **Directory Selection**: Choose target directories for batch operations
- **Batch File Operations**: Apply operations across multiple markdown files
- **Batch Text Processing**: Transform content across entire directories
- **Batch Analysis**: Analyze patterns and content across file collections

### 🛠️ Services Architecture

#### Text Processing Service
- **Pattern Matching**: Find and replace with regex support
- **Content Transformation**: Apply custom transformations to text
- **Statistics Tracking**: Monitor processing results and changes
- **Batch Operations**: Process multiple items efficiently

#### Selection Service
- **Case Conversion**: Upper, lower, and title case transformations
- **Line Operations**: Wrap, trim, sort, and number lines
- **Content Manipulation**: Remove empty lines and normalize formatting
- **Smart Processing**: Tracks changes and provides detailed statistics

#### Header Service
- **Auto-Generation**: Create titles, descriptions, and slugs from content
- **Semantic Versioning**: Manage version numbers in frontmatter
- **Frontmatter Updates**: Safely modify YAML frontmatter properties
- **Content Analysis**: Extract meaningful metadata from file content

#### Current File Service
- **File Analysis**: List headers and extract structure
- **Content Editing**: Add, delete, and modify text at specific positions
- **YAML Processing**: Extract and modify frontmatter safely
- **Position Management**: Precise text manipulation with position tracking

## 🎮 Available Commands

Access these commands through the Command Palette (Ctrl/Cmd + P):

| Command | Description |
|---------|-------------|
| **Open Current File Modal** | Launch the comprehensive file operations interface |
| **Open Batch Directory Modal** | Access batch processing tools for multiple files |
| **Add Site UUID** | Generate and add unique identifier to current file |
| **Generate Table of Contents** | Create GitHub-style TOC with anchor links and proper indentation |
| **Strip Callout Syntax from Selection** | Remove callout formatting from selected text |
| **Add Callout Syntax to Selection** | Convert selected text to callout format |
| **Toggle Callout Syntax for Selection** | Smart toggle between callout and regular text |

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- pnpm package manager
- Obsidian (latest version)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd obsidian-plugin-starter
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Build the plugin:**
   ```bash
   pnpm build
   ```

4. **Development mode:**
   ```bash
   pnpm dev
   ```

### Setup Script (Optional)

For quick setup, configure `plugin-config.yaml` and run:

```bash
chmod +x setup-plugin.mjs
node setup-plugin.mjs
```

### Testing Your Plugin

Create a symbolic link to test your plugin during development:

```bash
ln -s /path/to/your/obsidian-plugin-starter /path/to/your/vault/.obsidian/plugins/your-plugin-name
```

## 🏗️ Architecture

### Modern Tech Stack

```json
{
  "devDependencies": {
    "@types/node": "^24.0.12",
    "@typescript-eslint/eslint-plugin": "8.36.0",
    "@typescript-eslint/parser": "8.36.0",
    "builtin-modules": "5.0.0",
    "esbuild": "0.25.6",
    "eslint": "^9.30.1",
    "obsidian": "latest",
    "tslib": "2.8.1",
    "typescript": "5.8.3"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.15.0",
    "fastify": "^5.4.0",
    "zod": "^4.0.0"
  }
}
```

### Project Structure

```
src/
├── modals/                 # Interactive UI components
│   ├── CurrentFileModal.ts    # Comprehensive file operations
│   ├── BatchDirectoryModal.ts # Batch processing interface
│   └── sections/              # Reusable modal sections
├── services/               # Core business logic
│   ├── calloutService.ts      # Callout syntax processing
│   ├── textProcessingService.ts # Text transformation utilities
│   ├── selectionService.ts    # Selection manipulation tools
│   ├── headerService.ts       # Header and metadata generation
│   ├── currentFileService.ts  # File operation utilities
│   ├── siteUuidService.ts     # UUID management
│   └── backlinkUrlService.ts  # Backlink URL processing
└── utils/                  # Helper utilities
    ├── yamlFrontmatter.ts     # YAML processing
    ├── uuidGenerator.ts       # UUID utilities
    └── logger.ts              # Logging system
```

## 🎯 Use Cases

### Content Creators
- **Callout Management**: Easily convert between callout and regular text formats
- **UUID Tracking**: Maintain unique identifiers for content management systems
- **Batch Processing**: Update multiple files simultaneously

### Developers
- **Plugin Foundation**: Use as a starting point for custom Obsidian plugins
- **Service Architecture**: Leverage the modular service design pattern
- **Modern Tooling**: Benefit from TypeScript, ESLint, and modern build tools

### Knowledge Workers
- **File Organization**: Batch operations for organizing large vaults
- **Content Transformation**: Powerful text processing capabilities
- **Metadata Management**: Automated frontmatter generation and updates

## 🤝 Contributing

We welcome contributions! This starter kit is designed to be:

- **Extensible**: Easy to add new services and commands
- **Maintainable**: Clear separation of concerns and modular architecture
- **Well-Documented**: Comprehensive code comments and examples

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built on the official Obsidian Plugin API
- Inspired by the Obsidian developer community
- Created by [The Lossless Group](https://github.com/lossless-group)

---

**Ready to build something amazing?** This starter kit provides everything you need to create powerful Obsidian plugins with modern development practices and real-world functionality.
