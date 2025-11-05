# Obsidian MCP Server

> **Connect your Obsidian vault to Amp and supercharge your note-taking with AI**

Use [Amp](https://ampcode.com/) (Sourcegraph's AI coding assistant) to automatically create, update, and manage notes in your [Obsidian](https://obsidian.md/) vault. Perfect for documentation, learning logs, code snippets, and building a knowledge base as you code.

---

## ✨ Features

### Core Features
- 🤖 **AI-Powered Note Creation** - Let Amp create structured notes for you
- 📝 **Code Snippet Library** - Automatically save code with syntax highlighting
- 🧠 **Knowledge Graphs** - Build interconnected notes with automatic linking
- 📊 **Thread Summaries** - Save your Amp conversations for future reference
- 🔍 **Vault Search** - Search notes by content or tags
- 🏷️ **Smart Tagging** - Automatic categorization and organization
- 🔗 **Cross-Referencing** - Link related notes automatically

### Note Management
- ✏️ **Update Notes** - Modify existing note content with metadata preservation
- 🗑️ **Delete Notes** - Remove notes from your vault
- ➕ **Append Content** - Add content to the end of existing notes
- 📋 **Read Notes** - View full note content with formatting

### Organization
- 📁 **Create Folders** - Organize notes in directory structures
- 🔀 **Move Notes** - Relocate notes between folders
- 🏷️ **Rename Notes** - Change note filenames
- 🏛️ **Multiple Vaults** - Create and switch between different vaults

### Tag Management
- ➕ **Add Tags** - Add tags to existing notes
- ➖ **Remove Tags** - Remove specific tags from notes
- 📊 **List All Tags** - View all unique tags across your vault
- 🤖 **Suggest Tags** - AI-powered tag suggestions based on content

### Relationships & Links
- 🔗 **Find Backlinks** - See which notes link to a specific note
- 🔍 **Broken Links** - Find all broken wiki-links in your vault

### Daily Notes
- 📅 **Daily Notes** - Create daily notes with customizable templates
- ⏰ **Auto-Dating** - Automatic date-based file naming

### Analytics
- 📊 **Vault Statistics** - Get insights: note count, words, links, tags, note types
- 📈 **Track Growth** - Monitor your knowledge base expansion

### Export
- 🌐 **HTML Export** - Convert notes to beautifully styled HTML pages

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

2. Edit `.env` and set your vault path:
   ```env
   OBSIDIAN_VAULT_PATH=/path/to/your/ObsidianVault
   ```

3. Configure Amp by editing the config file:
   - **Windows:** `%APPDATA%\Amp\mcp-config.json`
   - **macOS/Linux:** `~/.config/amp/mcp-config.json`

   Add this configuration:
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "node",
         "args": ["/absolute/path/to/Obsidian-MCP/index.js"],
         "env": {
           "OBSIDIAN_VAULT_PATH": "/path/to/your/vault"
         }
       }
     }
   }
   ```

4. Restart Amp

### Configuration Options

| Variable | Required | Description |
|----------|----------|-------------|
| `OBSIDIAN_VAULT_PATH` | Yes | Absolute path to your Obsidian vault |
| `OBSIDIAN_DEBUG` | No | Enable debug logging (`true`/`false`) |

---

## 🛠️ Available Tools

The Obsidian MCP provides **61 powerful tools** for complete note management:

### 📝 Note Creation (4)
| Tool | Description |
|------|-------------|
| `save_code_snippet` | Save code snippets with syntax highlighting and metadata |
| `save_thread_summary` | Save AI conversation summaries with key insights |
| `save_knowledge_note` | Create general knowledge notes with tags |
| `create_daily_note` | Create daily notes with optional custom templates |

### ✏️ Note Management (5)
| Tool | Description |
|------|-------------|
| `read_note` | Read the full content of a note |
| `update_note` | Update note content (preserves metadata by default) |
| `delete_note` | Delete a note from the vault |
| `append_to_note` | Append content to the end of an existing note |
| `rename_note` | Rename a note file |

### 📁 Organization (4)
| Tool | Description |
|------|-------------|
| `list_notes` | List all notes (with optional tag filtering) |
| `search_notes` | Search notes by content or tags |
| `create_folder` | Create folders for organizing notes |
| `move_note` | Move notes between folders |

### 🏷️ Tag Management (4)
| Tool | Description |
|------|-------------|
| `add_tags` | Add tags to existing notes |
| `remove_tags` | Remove specific tags from notes |
| `list_all_tags` | Get all unique tags used across the vault |
| `suggest_tags` | Get AI-powered tag suggestions based on content |

### 🏛️ Vault Management (3)
| Tool | Description |
|------|-------------|
| `create_vault` | Create a new vault for organizing notes |
| `list_vaults` | List all available vaults |
| `switch_vault` | Switch to a different vault |

### 🔍 Search & Discovery (5)
| Tool | Description |
|------|-------------|
| `search_by_date` | Find notes by creation/modification date range |
| `find_orphaned_notes` | Discover notes with no incoming or outgoing links |
| `find_untagged_notes` | Find notes that have no tags |
| `search_regex` | Advanced regex pattern matching across notes |
| `search_by_word_count` | Filter notes by word count range |

### ✅ Task Management (5)
| Tool | Description |
|------|-------------|
| `extract_all_todos` | Get all TODO items from across the vault |
| `mark_task_complete` | Mark a specific task as complete |
| `task_statistics` | Get completion rates and task analytics |
| `create_task_note` | Create dedicated task list notes |
| `tasks_by_tag` | Get all tasks from notes with specific tags |

### 📋 Templates (3)
| Tool | Description |
|------|-------------|
| `create_template` | Save reusable note templates with placeholders |
| `apply_template` | Create notes from templates with variable substitution |
| `list_templates` | View all available templates |

### 🔗 Link Intelligence (5)
| Tool | Description |
|------|-------------|
| `find_backlinks` | Find all notes that link to a specific note |
| `suggest_links` | AI-powered internal link recommendations |
| `create_moc` | Auto-generate Map of Content from tagged notes |
| `link_graph` | Get network graph data of all connections |
| `most_connected_notes` | Find hub notes with most links |

### 📊 Analytics & Content Analysis (6)
| Tool | Description |
|------|-------------|
| `vault_stats` | Comprehensive statistics (notes, words, links, tags, types) |
| `broken_links` | Find all broken wiki-links in the vault |
| `extract_links` | Get all internal and external links from a note |
| `word_frequency` | Most frequently used words across vault |
| `vault_timeline` | Activity timeline (daily/weekly/monthly) |
| `note_complexity` | Readability and complexity analysis |

### 🎨 Content Extraction (1)
| Tool | Description |
|------|-------------|
| `extract_code_blocks` | Extract all code blocks from a note with language info |

### 💾 Backup & Safety (2)
| Tool | Description |
|------|-------------|
| `backup_vault` | Create timestamped backup of entire vault |
| `list_backups` | View all available vault backups |

### 🔄 Import/Export (11)
| Tool | Description |
|------|-------------|
| `import_markdown_folder` | Bulk import markdown files from a folder |
| `export_note_html` | Export notes as beautifully styled HTML |
| `export_note_pdf` | **Export single note as beautifully formatted PDF** |
| `export_note_markdown` | Export note as standalone markdown (with optional link resolution) |
| `export_note_plaintext` | Export note as clean plain text (strips markdown) |
| `export_vault_pdf` | **Export entire vault as single PDF with TOC, cover page, and navigation** |
| `export_vault_json` | Export vault as structured JSON database |
| `export_vault_csv` | Export vault index as CSV spreadsheet |
| `export_vault_markdown_bundle` | Export complete vault copy with folder structure |
| `export_to_pdf` | PDF export (legacy, use export_note_pdf) |
| `export_vault_archive` | Create ZIP archive (use backup_vault) |

### 📝 Advanced Note Operations (3)
| Tool | Description |
|------|-------------|
| `merge_notes` | Combine multiple notes into one |
| `duplicate_note` | Create a copy of a note |
| `archive_note` | Move note to Archive folder |

---

## 💡 Usage Examples

### Save Code Snippets

```
You: "Save this Python function to Obsidian with tags: python, utils"

def fibonacci(n):
    return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)
```

### Document Your Code

```
You: "Document the architecture of this project in Obsidian"
```

### Save Thread Summaries

```
You: "Save a summary of our conversation about authentication to Obsidian"
```

### Build a Knowledge Base

```
You: "Create a note about React hooks and link it to my existing React notes"
```

### Search Your Notes

```
You: "Search my Obsidian notes for 'authentication patterns'"
```

**[See more examples →](EXAMPLES.md)**

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

## 🛠️ Troubleshooting

### "OBSIDIAN_VAULT_PATH not set"
Run `npm run setup` or manually create a `.env` file with your vault path.

### "Vault directory not found"
Ensure you're using an **absolute path** with forward slashes:
```
✅ C:/Users/Name/Documents/Vault
✅ /Users/Name/Documents/Vault
✅ /home/name/Documents/Vault

❌ ./Vault (relative path)
❌ C:\Users\Name\Documents\Vault (backslashes on Windows)
```

### MCP Not Responding in Amp
1. Run `npm test` to verify configuration
2. Restart Amp
3. Check Amp logs for errors
4. Ensure paths in Amp config match your `.env` file

### Permission Errors on macOS/Linux
Make the scripts executable:
```bash
chmod +x setup.js test.js index.js
```

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
