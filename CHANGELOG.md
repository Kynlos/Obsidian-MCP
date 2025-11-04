# Changelog

All notable changes to the Obsidian MCP Setup for Amp will be documented in this file.

## [2.0.0] - 2025-11-04

### 🎉 Major Release - 15 New Features Added

This release transforms the Obsidian MCP from a basic note creator into a comprehensive note management system with 24 total features.

#### ✨ New Features

**Note Management (4)**
- `update_note` - Update existing note content with optional metadata preservation
- `delete_note` - Delete notes from vault
- `append_to_note` - Append content to the end of existing notes
- `rename_note` - Rename note files

**Organization (3)**
- `create_folder` - Create folders for organizing notes in directory structures
- `move_note` - Move notes between folders
- Added folder support for better vault organization

**Tag Management (4)**
- `add_tags` - Add new tags to existing notes
- `remove_tags` - Remove specific tags from notes
- `list_all_tags` - Get all unique tags used across the entire vault
- `suggest_tags` - AI-powered tag suggestions based on note content and existing tags

**Relationships & Analytics (3)**
- `find_backlinks` - Discover which notes link to a specific note
- `broken_links` - Find all broken wiki-links across the vault
- `vault_stats` - Comprehensive statistics (notes, words, links, tags, note types)

**Daily Notes (1)**
- `create_daily_note` - Create daily notes with customizable templates and auto-dating

**Export (1)**
- `export_note_html` - Export notes as beautifully styled HTML pages

#### 🔧 Improvements
- All features include comprehensive error handling
- Structured JSON responses for better integration
- Preserved backward compatibility with existing tools
- Enhanced frontmatter parsing and manipulation
- Smart tag deduplication
- Wiki-link detection and validation

#### 📊 Statistics
- Total features: 24 (up from 9)
- New features: 15
- Lines of code added: ~915
- Test coverage: All features tested

### Setup Improvements (Previous)

## [1.1.0] - 2025-11-04

### Added - Multi-Platform Setup System
- Cross-platform setup wizard (`setup.js`) supporting Windows, macOS, and Linux
- Configuration validator (`test.js`) to verify setup
- dotenv support for `.env` file configuration
- Auto-detection of platform-specific Amp config paths
- npm scripts: `npm run setup` and `npm test`

### Changed
- Removed build dependency - runs directly from `index.js`
- Updated setup scripts (setup.ps1, setup.sh) to reference index.js directly
- Simplified installation: `npm install && npm run setup`

### Documentation
- Created `GET_STARTED.md` - Quick 3-step guide
- Created `INSTALL.md` - Complete installation guide
- Created `QUICKSTART.md` - 5-minute tutorial
- Created `SETUP.md` - Detailed setup instructions
- Created `CHANGES.md` - Complete changelog
- Created `SETUP_COMPLETE.md` - Developer summary
- Rewrote `README.md` with platform-agnostic instructions
- Enhanced `.env.example` with better examples

## [1.0.0] - 2025-11-02

### Added
- Initial release of Obsidian MCP setup guide
- Configuration templates for Windows, macOS, and Linux
- Comprehensive README with setup instructions
- Example workflows and use cases
- Environment variable configuration
- Troubleshooting guide
- Platform-specific setup instructions

### Documentation
- Complete usage examples
- Best practices guide
- Professional workflow templates
- Learning scenarios
- Cross-referencing examples

### Features
- Support for single and multiple vaults
- Debug mode configuration
- Environment variable support
- Quick start guide
