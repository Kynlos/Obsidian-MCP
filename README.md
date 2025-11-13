# Obsidian MCP Server

> **Connect your Obsidian vault to Amp and supercharge your note-taking with AI**

Use [Amp](https://ampcode.com/) (Sourcegraph's AI coding assistant) to automatically create, update, and manage notes in your [Obsidian](https://obsidian.md/) vault. Perfect for documentation, learning logs, code snippets, and building a knowledge base as you code.

**🚀 Now with 121 comprehensive tools** for complete Obsidian automation!

---

## ✨ Features

### 🎯 What's New in v4.0

- **🎨 Canvas Integration** - Create and manipulate Obsidian Canvas boards programmatically
- **📊 Dataview Queries** - Execute database-like queries on your vault
- **🌐 Graph Analysis** - Analyze knowledge networks, find clusters, calculate centrality
- **🔗 Advanced URI Generation** - Create deep links to Obsidian (obsidian:// URIs)
- **📎 Enhanced Attachments** - Better media file management
- **🔍 Advanced Search & Replace** - Regex search, frontmatter search, vault-wide refactoring
- **🏷️ Enhanced Metadata** - Advanced frontmatter manipulation and batch updates
- **📚 Structured Templates** - Pre-formatted note types (books, people, meetings, projects)
- **✅ Enhanced Task Management** - Filter by criteria, add metadata, generate reports
- **📐 Advanced Formatting** - Callouts, tables, TOC, Mermaid diagrams, LaTeX math
- **🔧 Vault Maintenance** - Health analysis, find duplicates, cleanup automation
- **🔄 Cross-Note Analysis** - Compare, merge, split notes intelligently

### Core Capabilities

- 🤖 **AI-Powered Note Creation** - Let Amp create structured notes for you
- 📝 **Code Snippet Library** - Automatically save code with syntax highlighting
- 🧠 **Knowledge Graphs** - Build interconnected notes with automatic linking
- 📊 **Thread Summaries** - Save your Amp conversations for future reference
- 🔍 **Vault Search** - Search notes by content, tags, metadata, regex
- 🏷️ **Smart Tagging** - Automatic categorization and organization
- 🔗 **Cross-Referencing** - Link related notes automatically
- 📈 **Analytics** - Vault statistics, health reports, insights
- 💾 **Export Everything** - PDF, HTML, JSON, CSV, Markdown bundles

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Amp](https://ampcode.com/) installed
- [Obsidian](https://obsidian.md/) installed (recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kynlos/Obsidian-MCP.git
   cd Obsidian-MCP
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the setup wizard:**
   ```bash
   npm run setup
   ```
   
   The setup wizard will:
   - Prompt you for your Obsidian vault path
   - Create a `.env` configuration file
   - Configure Amp automatically for your platform (Windows/macOS/Linux)

4. **Restart Amp**

5. **Test it:**
   ```bash
   npm test
   ```
   
   Or in Amp:
   ```
   You: "Create a note in Obsidian called 'Test' with content 'Hello from Amp!'"
   ```

---

## ⚙️ Configuration

### Workspace-Relative Vaults (New!)

By default, vaults are created in your **current workspace directory** - no hardcoded paths needed!

```env
# Optional: Override defaults
VAULTS_BASE_PATH=/path/to/your/vaults/folder
OBSIDIAN_VAULT_PATH=/path/to/your/default/vault
```

### Automatic Setup (Recommended)

Run the setup wizard to configure everything automatically:
```bash
npm run setup
```

### Manual Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure Amp by editing the config file:
   - **Windows:** `%APPDATA%\Amp\mcp-config.json`
   - **macOS/Linux:** `~/.config/amp/mcp-config.json`

   Add this configuration:
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "node",
         "args": ["/absolute/path/to/Obsidian-MCP/index.js"]
       }
     }
   }
   ```

3. Restart Amp

---

## 🛠️ Available Tools

The Obsidian MCP provides **121 powerful tools** organized into 14 categories:

### 🎨 Canvas Integration (6 tools)
Create and manipulate Obsidian Canvas files (JSON-based visual boards).

| Tool | Description |
|------|-------------|
| `create_canvas` | Create new canvas JSON files |
| `add_card_to_canvas` | Add text/note/media cards to canvas |
| `add_connection_to_canvas` | Connect cards with lines/arrows |
| `create_canvas_group` | Group cards together |
| `read_canvas` | Parse and read canvas structure |
| `update_canvas_card` | Modify existing canvas cards |

### 📊 Dataview Query Execution (3 tools)
Execute database-like queries on your vault (simplified implementation).

| Tool | Description |
|------|-------------|
| `execute_dataview_query` | Run Dataview DQL queries and return results |
| `create_dataview_codeblock` | Insert dataview query blocks into notes |
| `validate_dataview_query` | Check if query syntax is valid |

### 🌐 Graph Analysis (5 tools)
Analyze your knowledge network programmatically.

| Tool | Description |
|------|-------------|
| `generate_graph_data` | Build graph structure from vault links (nodes/edges) |
| `find_note_clusters` | Identify groups of related notes |
| `calculate_note_centrality` | Find most connected/important notes |
| `get_shortest_path` | Find link path between two notes |
| `find_isolated_notes` | Notes with few/no connections |

### 🔗 Advanced URI Generation (4 tools)
Create obsidian:// deep links for automation and external integrations.

| Tool | Description |
|------|-------------|
| `generate_obsidian_uri` | Create obsidian:// URIs for deep linking |
| `create_workspace_uri` | Generate URI to open workspace |
| `create_append_uri` | Generate URI to append text to note |
| `create_search_uri` | Generate URI to search vault |

### 📎 Attachments & Media Management (5 tools)
Manage media files and attachments in your vault.

| Tool | Description |
|------|-------------|
| `list_attachments` | List all media files in vault |
| `attach_file` | Copy external file into vault attachments folder |
| `delete_attachment` | Remove attachment files |
| `find_orphaned_attachments` | Find unused media files |
| `get_attachment_references` | Find which notes use an attachment |

### 🔍 Advanced Search & Replace (4 tools)
Powerful search and refactoring tools.

| Tool | Description |
|------|-------------|
| `regex_search_and_replace` | Find and replace with regex across vault |
| `search_in_frontmatter` | Search YAML frontmatter specifically |
| `search_by_link_type` | Find specific link patterns (wiki vs markdown) |
| `multi_file_replace` | Batch find/replace across multiple notes |

### 🏷️ Enhanced Metadata/Frontmatter (6 tools)
Advanced YAML frontmatter manipulation.

| Tool | Description |
|------|-------------|
| `update_frontmatter_field` | Edit specific YAML field without rewriting note |
| `batch_update_metadata` | Update property across multiple notes |
| `validate_frontmatter_schema` | Check frontmatter against schema |
| `list_all_properties` | Get all unique property keys in vault |
| `rename_property_globally` | Rename property across all notes |
| `get_property_values` | List all values for a property |

### 📚 Structured Content Templates (5 tools)
Create common note types with pre-formatted structures.

| Tool | Description |
|------|-------------|
| `create_from_template_with_prompts` | Template with variable substitution |
| `create_book_note` | Structured book/literature note |
| `create_person_note` | Person/contact note structure |
| `create_meeting_note` | Meeting notes with agenda/action items |
| `create_project_note` | Project planning note structure |

### ✅ Enhanced Task Management (5 tools)
Advanced task data management beyond basic TODO lists.

| Tool | Description |
|------|-------------|
| `get_tasks_by_criteria` | Filter tasks by status, date, priority, tags |
| `move_task_between_notes` | Relocate task to different note |
| `add_task_metadata` | Add due date, priority, tags to task |
| `create_task_report` | Generate task summary/report |
| `find_blocked_tasks` | Tasks waiting on dependencies |

### 📐 Advanced Markdown Formatting (6 tools)
Automate tedious formatting tasks.

| Tool | Description |
|------|-------------|
| `convert_to_callout` | Wrap text in callout blocks |
| `create_markdown_table` | Generate tables programmatically |
| `add_table_of_contents` | Generate TOC from headings |
| `create_mermaid_diagram` | Generate Mermaid diagrams from data |
| `create_math_block` | Add LaTeX math blocks |
| `standardize_formatting` | Fix inconsistent markdown formatting |

### 🔧 Vault Maintenance (5 tools)
Keep your vault healthy and organized.

| Tool | Description |
|------|-------------|
| `find_duplicate_notes` | Detect similar/duplicate content |
| `find_empty_notes` | List notes with no content |
| `find_large_notes` | Notes exceeding size threshold |
| `analyze_vault_health` | Overall vault statistics/issues |
| `cleanup_broken_references` | Remove/fix broken links |

### 🔄 Cross-Note Analysis (5 tools)
Compare, refactor, and reorganize notes.

| Tool | Description |
|------|-------------|
| `compare_notes` | Diff two notes |
| `find_similar_notes` | Content similarity analysis |
| `track_note_changes` | Compare note versions over time |
| `merge_notes_enhanced` | Smart merge with options |
| `split_note_by_headings` | Break large note into smaller ones |

### 📝 Core Note Creation (4 tools)
| Tool | Description |
|------|-------------|
| `save_code_snippet` | Save code with syntax highlighting and metadata |
| `save_thread_summary` | Save AI conversation summaries with key insights |
| `save_knowledge_note` | Create general knowledge notes with tags |
| `create_daily_note` | Create daily notes with optional custom templates |

### ✏️ Core Note Management (5 tools)
| Tool | Description |
|------|-------------|
| `read_note` | Read the full content of a note |
| `update_note` | Update note content (preserves metadata by default) |
| `delete_note` | Delete a note from the vault |
| `append_to_note` | Append content to the end of an existing note |
| `rename_note` | Rename a note file |

---

**[See complete tool documentation in AGENTS.md](AGENTS.md)**

---

## 💡 Usage Examples

### Create a Canvas Board

```
You: "Create a canvas called 'Project Planning' and add cards for Frontend, Backend, and Database"
```

### Execute Dataview Query

```
You: "Show me all notes tagged with 'python' created this month"
```

### Generate Obsidian URIs

```
You: "Create a link I can use to open my Daily Note from outside Obsidian"
```

### Analyze Vault Structure

```
You: "Show me the most connected notes in my vault and find any isolated notes"
```

### Create Structured Notes

```
You: "Create a book note for 'The Pragmatic Programmer' by Andy Hunt and Dave Thomas"
```

### Advanced Formatting

```
You: "Create a Mermaid flowchart showing the authentication process and add it to my Security note"
```

**[See 50+ more examples →](EXAMPLES.md)**

---

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run setup` | Run interactive setup wizard |
| `npm test` | Test configuration |
| `npm start` | Start the MCP server (for debugging) |

---

## 🧪 Testing

Verify your setup is working correctly:

```bash
npm test
```

This will check:
- `.env` file exists and is valid  
- Obsidian vault path is accessible
- Amp configuration is correct
- All dependencies are installed
- Node.js version is compatible

---

## 📊 Version History

- **v4.0.0** (2025-11-13) - **MAJOR UPDATE**: Added 59 new tools (Canvas, Dataview, Graph Analysis, URIs, and much more!)
- **v3.1.0** - Export features (PDF, HTML, JSON, CSV)
- **v3.0.0** - Template system and advanced search
- **v2.0.0** - Task management and analytics
- **v1.0.0** - Initial release

**[See full changelog →](CHANGELOG.md)**

---

## 🎯 Platform Support

This MCP works on:
- ✅ **Windows** (10, 11)
- ✅ **macOS** (10.15+)
- ✅ **Linux** (Ubuntu, Debian, Fedora, etc.)

Automatic configuration paths:
- **Windows:** `%APPDATA%\Amp\mcp-config.json`
- **macOS/Linux:** `~/.config/amp/mcp-config.json`

---

## 📚 Documentation

- **[AGENTS.md](AGENTS.md)** - Complete tool reference for AI agents
- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[EXAMPLES.md](EXAMPLES.md)** - Real-world usage examples
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Repository:** https://github.com/Kynlos/Obsidian-MCP
- **Amp:** https://ampcode.com/
- **Obsidian:** https://obsidian.md/
- **MCP Specification:** https://modelcontextprotocol.io/

---

## 🙏 Acknowledgments

- **Kynlo** for creating the original Obsidian MCP Server
- **Sourcegraph** for [Amp](https://ampcode.com/)
- **Obsidian** team for the amazing note-taking app

---

**Made with ❤️ for the Amp and Obsidian communities**

⭐ Star this repo if you find it useful!
