# Obsidian MCP Setup for Amp

> **Connect your Obsidian vault to Amp and supercharge your note-taking with AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node: >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Obsidian MCP](https://img.shields.io/badge/MCP-Obsidian-purple.svg)](https://github.com/Kynlos/Obsidian-MCP)

Use [Amp](https://ampcode.com/) (Sourcegraph's AI coding assistant) to automatically create, update, and manage notes in your [Obsidian](https://obsidian.md/) vault. Perfect for documentation, learning logs, code snippets, and building a knowledge base as you code.

---

## ✨ Features

- 🤖 **AI-Powered Note Creation** - Let Amp create structured notes for you
- 📝 **Code Snippet Library** - Automatically save code with syntax highlighting
- 🧠 **Knowledge Graphs** - Build interconnected notes with automatic linking
- 📊 **Thread Summaries** - Save your Amp conversations for future reference
- 🔍 **Vault Search** - Ask Amp to search your existing notes
- 🏷️ **Smart Tagging** - Automatic categorization and organization
- 🔗 **Cross-Referencing** - Link related notes automatically

---

## 🚀 Quick Start

### Prerequisites

- [Obsidian](https://obsidian.md/) installed
- [Amp](https://ampcode.com/) installed
- [Node.js](https://nodejs.org/) v18 or higher
- [Obsidian MCP Server](https://github.com/Kynlos/Obsidian-MCP) cloned and built locally

### Installation

#### Option 1: Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
git clone https://github.com/your-username/obsidian-mcp-amp-setup.git
cd obsidian-mcp-amp-setup
.\setup.ps1
```

**macOS/Linux:**
```bash
git clone https://github.com/your-username/obsidian-mcp-amp-setup.git
cd obsidian-mcp-amp-setup
chmod +x setup.sh
./setup.sh
```

#### Option 2: Manual Setup

1. **Clone and build Obsidian MCP Server:**
   ```bash
   git clone https://github.com/Kynlos/Obsidian-MCP.git
   cd Obsidian-MCP
   npm install
   npm run build
   cd ..
   ```

2. **Clone this repository:**
   ```bash
   git clone https://github.com/your-username/obsidian-mcp-amp-setup.git
   cd obsidian-mcp-amp-setup
   ```

3. **Copy configuration:**
   
   **Windows:**
   ```powershell
   copy obsidian-config.json %APPDATA%\Amp\mcp-config.json
   ```
   
   **macOS/Linux:**
   ```bash
   cp obsidian-config.json ~/.config/amp/mcp-config.json
   ```

4. **Edit the config** and set your paths:
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "node",
         "args": ["/absolute/path/to/Obsidian-MCP/build/index.js"],
         "env": {
           "OBSIDIAN_VAULT_PATH": "/absolute/path/to/your/vault"
         }
       }
     }
   }
   ```

5. **Restart Amp**

6. **Test it:**
   ```
   You: "Create a note in Obsidian called 'Test' with content 'Hello from Amp!'"
   ```

---

## 📚 Documentation

- **[README.md](README.md)** - Complete setup guide and troubleshooting
- **[EXAMPLES.md](EXAMPLES.md)** - Real-world usage examples and workflows
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

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

Amp will analyze your codebase and create comprehensive documentation.

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

## 🎯 Use Cases

### For Developers
- 📝 Document code as you write it
- 💾 Save useful snippets for reuse
- 🐛 Log bug fixes and solutions
- 📚 Build a personal code library

### For Learners
- 🎓 Take notes while learning
- 🔗 Connect concepts with links
- 📊 Track progress over time
- 💡 Save insights and aha moments

### For Teams
- 📋 Document meetings and decisions
- 🔍 Share knowledge across the team
- 🎯 Track project progress
- 📖 Build team wikis

---

## 🛠️ Configuration

### Basic Configuration

Single vault, simple setup:
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["/absolute/path/to/Obsidian-MCP/build/index.js"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/vault"
      }
    }
  }
}
```

### Advanced Configuration

Multiple vaults, debug enabled:
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["/absolute/path/to/Obsidian-MCP/build/index.js"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/main/vault",
        "OBSIDIAN_DEFAULT_VAULT": "MainVault",
        "OBSIDIAN_DEBUG": "true"
      }
    }
  }
}
```

**[Full configuration guide →](README.md#-configuration-options)**

---

## 🔧 Troubleshooting

### Vault Not Found

**Solution:** Ensure you're using an **absolute path** with forward slashes:
```json
✅ "C:/Users/Name/Documents/Vault"
❌ "C:\Users\Name\Documents\Vault"
❌ "./Vault"
```

### MCP Server Not Responding

**Solution:**
```bash
# Restart Amp
# Rebuild MCP server
cd Obsidian-MCP
npm run build
# Verify build/index.js exists
ls build/index.js
```

**[Full troubleshooting guide →](README.md#-troubleshooting)**

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute

- 📝 Improve documentation
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests
- 📖 Share your workflows

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Obsidian MCP Server**: https://github.com/Kynlos/Obsidian-MCP
- **Amp Documentation**: https://ampcode.com/manual
- **Obsidian**: https://obsidian.md/
- **MCP Specification**: https://modelcontextprotocol.io/

---

## 🙏 Acknowledgments

- **Kynlos** for creating the [Obsidian MCP Server](https://github.com/Kynlos/Obsidian-MCP)
- **Sourcegraph** for [Amp](https://ampcode.com/)
- **Obsidian** team for the amazing note-taking app

---

## 💬 Support

- 📖 Read the [documentation](README.md)
- 🐛 Report issues on [GitHub Issues](https://github.com/your-username/obsidian-mcp-amp-setup/issues)
- 💬 Join the discussion in Amp Discord

---

**Made with ❤️ for the Amp and Obsidian communities**

⭐ Star this repo if you find it useful!
