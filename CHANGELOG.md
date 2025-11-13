# Changelog

All notable changes to the Obsidian MCP Setup for Amp will be documented in this file.

## [4.0.0] - 2025-11-13

### 🚀 MAJOR RELEASE - 59 New Tools Added!

**The Obsidian MCP now has 121 comprehensive tools** (previously 61)

This is the largest update ever, adding powerful automation capabilities across 12 new/enhanced categories.

#### 🎨 Canvas Integration (6 NEW tools)
- `create_canvas` - Create new canvas JSON files
- `add_card_to_canvas` - Add text/note/media cards to canvas
- `add_connection_to_canvas` - Connect cards with lines/arrows
- `create_canvas_group` - Group cards together
- `read_canvas` - Parse and read canvas structure
- `update_canvas_card` - Modify existing canvas cards

**Impact:** Programmatically create and manipulate Obsidian Canvas boards for visual documentation and planning.

#### 📊 Dataview Query Execution (3 NEW tools)
- `execute_dataview_query` - Run Dataview DQL queries and return results
- `create_dataview_codeblock` - Insert dataview query blocks into notes
- `validate_dataview_query` - Check if query syntax is valid

**Impact:** Execute database-like queries on your vault, generate dynamic content.

#### 🌐 Graph Analysis (5 NEW tools)
- `generate_graph_data` - Build graph structure from vault links (nodes/edges)
- `find_note_clusters` - Identify groups of related notes
- `calculate_note_centrality` - Find most connected/important notes
- `get_shortest_path` - Find link path between two notes
- `find_isolated_notes` - Notes with few/no connections

**Impact:** Programmatically analyze your knowledge network structure.

#### 🔗 Advanced URI Generation (4 NEW tools)
- `generate_obsidian_uri` - Create obsidian:// URIs for deep linking
- `create_workspace_uri` - Generate URI to open workspace
- `create_append_uri` - Generate URI to append text to note
- `create_search_uri` - Generate URI to search vault

**Impact:** Create clickable links that open Obsidian to specific locations - great for external integrations.

#### 📎 Attachments & Media Management (5 NEW tools)
- `list_attachments` - List all media files in vault
- `attach_file` - Copy external file into vault attachments folder
- `delete_attachment` - Remove attachment files
- `find_orphaned_attachments` - Find unused media files
- `get_attachment_references` - Find which notes use an attachment

**Impact:** Better management of media-rich vaults.

#### 🔍 Advanced Search & Replace (4 NEW tools)
- `regex_search_and_replace` - Find and replace with regex across vault
- `search_in_frontmatter` - Search YAML frontmatter specifically
- `search_by_link_type` - Find specific link patterns (wiki vs markdown)
- `multi_file_replace` - Batch find/replace across multiple notes

**Impact:** Vault-wide refactoring and maintenance capabilities.

#### 🏷️ Enhanced Metadata/Frontmatter (6 NEW tools)
- `update_frontmatter_field` - Edit specific YAML field without rewriting note
- `batch_update_metadata` - Update property across multiple notes
- `validate_frontmatter_schema` - Check frontmatter against schema
- `list_all_properties` - Get all unique property keys in vault
- `rename_property_globally` - Rename property across all notes
- `get_property_values` - List all values for a property

**Impact:** Treat your vault like a structured database with advanced metadata operations.

#### 📚 Structured Content Templates (5 NEW tools)
- `create_from_template_with_prompts` - Template with variable substitution
- `create_book_note` - Structured book/literature note
- `create_person_note` - Person/contact note structure
- `create_meeting_note` - Meeting notes with agenda/action items
- `create_project_note` - Project planning note structure

**Impact:** Quick creation of common note types with pre-formatted structures.

#### ✅ Enhanced Task Management (5 NEW tools)
- `get_tasks_by_criteria` - Filter tasks by status, date, priority, tags
- `move_task_between_notes` - Relocate task to different note
- `add_task_metadata` - Add due date, priority, tags to task
- `create_task_report` - Generate task summary/report
- `find_blocked_tasks` - Tasks waiting on dependencies

**Impact:** Advanced task data management beyond basic TODO lists.

#### 📐 Advanced Markdown Formatting (6 NEW tools)
- `convert_to_callout` - Wrap text in callout blocks
- `create_markdown_table` - Generate tables programmatically
- `add_table_of_contents` - Generate TOC from headings
- `create_mermaid_diagram` - Generate Mermaid diagrams from data
- `create_math_block` - Add LaTeX math blocks
- `standardize_formatting` - Fix inconsistent markdown formatting

**Impact:** Automate tedious formatting tasks.

#### 🔧 Vault Maintenance (5 NEW tools)
- `find_duplicate_notes` - Detect similar/duplicate content
- `find_empty_notes` - List notes with no content
- `find_large_notes` - Notes exceeding size threshold
- `analyze_vault_health` - Overall vault statistics/issues
- `cleanup_broken_references` - Remove/fix broken links

**Impact:** Keep your vault healthy, organized, and optimized.

#### 🔄 Cross-Note Analysis (5 NEW tools)
- `compare_notes` - Diff two notes
- `find_similar_notes` - Content similarity analysis
- `track_note_changes` - Compare note versions over time
- `merge_notes_enhanced` - Smart merge with options
- `split_note_by_headings` - Break large note into smaller ones

**Impact:** Compare, refactor, and reorganize notes intelligently.

### 🛠️ Improvements

- **Workspace-Relative Vaults:** Vaults now created in current workspace by default (no hardcoded paths)
- **Better Path Handling:** Uses `process.cwd()` for workspace-aware behavior
- **Enhanced Testing:** All 121 tools tested and verified

### 📚 Documentation

- Complete README overhaul with all 121 tools documented
- Updated AGENTS.md with comprehensive tool reference
- New examples for Canvas, Dataview, Graph Analysis, and more

### 🔧 Breaking Changes

- None! All existing tools remain unchanged and backward compatible

---

## [3.1.0] - 2025-11-05

### 📤 Export System Release - 7 New Export Formats

**Professional export functionality for sharing and publishing your vault**

#### ✨ New Export Tools (7)

**Single Note Exports (3)**
1. `export_note_pdf` - Beautiful PDF with professional styling and syntax highlighting
2. `export_note_markdown` - Standalone markdown export with optional wiki-link resolution
3. `export_note_plaintext` - Clean plain text export (strips all markdown formatting)

**Vault-Wide Exports (4)**
4. `export_vault_pdf` - **Stunning vault-wide PDF featuring:**
   - Professional cover page with vault name and date
   - Clickable table of contents with navigation
   - Page numbers (X / Y format) in footer
   - Each note on separate page with metadata
   - Beautiful typography and styling
   - Syntax-highlighted code blocks (dark theme)
   - Print-ready A4 format

5. `export_vault_json` - Complete vault as structured JSON database
6. `export_vault_csv` - Spreadsheet index with metadata (Excel/Sheets compatible)
7. `export_vault_markdown_bundle` - Portable vault copy preserving folder structure

#### 🎨 Export Features

**PDF Exports:**
- Professional styling with custom CSS
- Code blocks with syntax highlighting
- Proper margins and spacing (2.5cm)
- Header and footer support
- Page break controls
- Metadata display (tags, type, dates)
- Clickable links and anchors
- Print-ready output

**Data Exports:**
- JSON with complete vault structure
- CSV with sortable columns
- Timestamps and word counts
- Tag and type categorization
- Optional full content inclusion

**Bundle Export:**
- Preserves directory structure
- Copies all markdown files
- Portable and shareable
- Ready for re-import

#### 📦 Dependencies Added
- `marked` ^16.4.1 - Markdown to HTML conversion
- `puppeteer` ^24.29.0 - Headless Chrome for PDF generation
- `json2csv` ^6.0.0 - CSV formatting and parsing

#### 📊 Statistics
- **Total tools:** 61 (up from 54)
- **New export tools:** 7
- **Export formats supported:** PDF, HTML, JSON, CSV, Markdown, Plain Text
- **Lines added:** ~470

#### 🎯 Use Cases
- Share documentation as professional PDFs
- Archive entire vault with cover and TOC
- Export for analysis in Excel/Google Sheets
- Create portable vault backups
- Generate publication-ready documents
- Extract plain text for processing
- Migrate to other systems

## [3.0.0] - 2025-11-05

### 🚀 MASSIVE RELEASE - 30 Additional Features!

This release expands the Obsidian MCP into a **complete knowledge management powerhouse** with **54 total features** - up from 24 in v2.0.0.

#### ✨ New Features (30)

**🔍 Search & Discovery (5)**
- `search_by_date` - Find notes by creation/modification date range (YYYY-MM-DD)
- `find_orphaned_notes` - Discover notes with no incoming or outgoing links
- `find_untagged_notes` - Find notes that have no tags
- `search_regex` - Advanced regex pattern matching with case sensitivity options
- `search_by_word_count` - Filter notes by word count range (min/max)

**✅ Task Management (5)**
- `extract_all_todos` - Extract all TODO items from across the entire vault
- `mark_task_complete` - Mark specific tasks as complete by text matching
- `task_statistics` - Get completion rates, pending tasks, and analytics
- `create_task_note` - Create dedicated task list notes with auto-formatting
- `tasks_by_tag` - Filter and view tasks from notes with specific tags

**📋 Templates (3)**
- `create_template` - Save reusable note templates with placeholder support
- `apply_template` - Create notes from templates with variable substitution ({{title}}, {{date}}, etc.)
- `list_templates` - View all available templates in .templates folder

**🔗 Link Intelligence (5)**
- `suggest_links` - AI-powered internal link recommendations based on content similarity
- `create_moc` - Auto-generate Map of Content notes from tagged notes
- `link_graph` - Get network graph data (nodes and links) for visualization
- `most_connected_notes` - Find hub notes with most incoming/outgoing links
- `extract_links` - Get all internal wiki-links and external URLs from a note

**📊 Content Analysis (4)**
- `word_frequency` - Most frequently used words across vault (configurable limit and min length)
- `extract_code_blocks` - Extract all code blocks with language detection
- `vault_timeline` - Activity timeline with daily/weekly/monthly granularity
- `note_complexity` - Readability analysis (sentences, words, long words, complexity score)

**💾 Backup & Safety (2)**
- `backup_vault` - Create timestamped backup of entire vault with folder structure
- `list_backups` - View all available backups with creation dates and sizes

**🔄 Import/Export (3)**
- `import_markdown_folder` - Bulk import markdown files from external folders
- `export_to_pdf` - PDF export placeholder (use export_note_html + browser)
- `export_vault_archive` - ZIP archive placeholder (use backup_vault)

**📝 Advanced Note Operations (3)**
- `merge_notes` - Combine multiple notes into one (with optional delete originals)
- `duplicate_note` - Create exact copies of notes
- `archive_note` - Move notes to Archive folder for organization

#### 🔧 Technical Improvements
- All 30 features include comprehensive error handling
- Structured JSON responses for programmatic integration
- Backward compatible with all existing tools
- Smart algorithms for link detection and similarity matching
- Template variable substitution system ({{var}} syntax)
- Recursive directory operations for backups and imports
- Frontmatter preservation across all editing operations
- Stop-word filtering for better word frequency analysis
- Multi-format date/time handling

#### 📊 Statistics
- **Total features:** 54 (up from 24 in v2.0.0)
- **New features:** 30
- **Lines of code added:** ~1,300
- **Categories:** 12 distinct feature categories
- **Test coverage:** All features tested and verified

#### 🎯 Use Cases Enabled
- Complete task tracking and TODO management across vault
- Template-based note workflows for consistency
- Advanced search with regex and date filtering
- Link graph analysis for knowledge visualization
- Content analysis and vault insights
- Automated backup and restore capabilities
- Bulk operations for efficiency
- AI-powered organization suggestions

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
