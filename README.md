# Obsidian MCP Server

> **Connect your Obsidian vault to Amp and supercharge your note-taking with AI**

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

- **Kynlos** for creating the original Obsidian MCP Server
- **Sourcegraph** for [Amp](https://ampcode.com/)
- **Obsidian** team for the amazing note-taking app

---

**Made with ❤️ for the Amp and Obsidian communities**

⭐ Star this repo if you find it useful!
