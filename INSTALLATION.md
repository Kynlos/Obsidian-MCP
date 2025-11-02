# Obsidian MCP Setup for Amp

Connect your Obsidian vault to Amp (Sourcegraph's AI coding assistant) to enable AI-powered note-taking, documentation generation, and knowledge management.

## 🎯 What This Does

This setup allows Amp to:
- ✅ **Create notes** in your Obsidian vault
- ✅ **Read notes** and search your knowledge base
- ✅ **Save code snippets** with automatic formatting
- ✅ **Document projects** as you code
- ✅ **Create knowledge graphs** with linked notes
- ✅ **Save thread summaries** from your Amp sessions

## 📋 Prerequisites

1. **Obsidian** installed ([download here](https://obsidian.md/))
2. **Amp** installed ([Sourcegraph Amp](https://ampcode.com/))
3. **Node.js** v18+ ([download here](https://nodejs.org/))
4. **Obsidian MCP Server** cloned and built ([GitHub](https://github.com/Kynlos/Obsidian-MCP))

## 🚀 Quick Start

### Step 0: Setup Obsidian MCP Server

1. **Clone the Obsidian MCP repository:**
   ```bash
   git clone https://github.com/Kynlos/Obsidian-MCP.git
   cd Obsidian-MCP
   npm install
   npm run build
   ```

2. **Note the installation path** (you'll need it for configuration)

### Step 1: Configure MCP Server

1. **Copy the configuration template:**
   ```bash
   cp obsidian-config.json ~/.config/amp/mcp-config.json
   ```

   Or on Windows:
   ```powershell
   copy obsidian-config.json %APPDATA%\Amp\mcp-config.json
   ```

2. **Edit the configuration** and set your paths:
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "node",
         "args": [
           "C:/path/to/Obsidian-MCP/build/index.js"
         ],
         "env": {
           "OBSIDIAN_VAULT_PATH": "C:/Users/YourName/Documents/MyVault"
         }
       }
     }
   }
   ```

   **Important**: Use absolute paths for both the MCP server and your vault!

### Step 2: Verify Installation

1. **Restart Amp**

2. **Test the connection** in Amp:
   ```
   You: "List my Obsidian vaults"
   Amp: [should show your vault(s)]
   ```

3. **Create a test note:**
   ```
   You: "Create a note in Obsidian called 'Test' with content 'Hello from Amp!'"
   Amp: [creates the note]
   ```

4. **Verify in Obsidian** - You should see the new note!

## 📁 Configuration Options

### Basic Configuration

**Minimal setup** (single vault):
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": [
        "/absolute/path/to/Obsidian-MCP/build/index.js"
      ],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/absolute/path/to/vault"
      }
    }
  }
}
```

### Advanced Configuration

**Multiple vaults** or custom settings:
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": [
        "/absolute/path/to/Obsidian-MCP/build/index.js"
      ],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/main/vault",
        "OBSIDIAN_DEFAULT_VAULT": "MainVault",
        "OBSIDIAN_DEBUG": "false"
      }
    }
  }
}
```

### Environment Variables

Create a `.env` file in your vault directory:

```bash
# .env
OBSIDIAN_VAULT_PATH=/Users/you/Documents/MyVault
OBSIDIAN_DEFAULT_VAULT=MyVault
OBSIDIAN_DEBUG=false
```

## 💡 Usage Examples

### 1. **Save Code Snippets**

```
You: "Save this Python function to Obsidian as a code snippet"

[paste your code]
```

Amp will create a formatted note with:
- Code block with syntax highlighting
- Description and tags
- Automatic filename

### 2. **Document a Project**

```
You: "Document the architecture of this project in Obsidian"
```

Amp will:
- Analyze your codebase
- Create architecture documentation
- Add diagrams and code examples
- Link related concepts

### 3. **Create Knowledge Notes**

```
You: "Save this explanation about React hooks to Obsidian with tags react, hooks, javascript"
```

Creates a note with:
- Title
- Content in Markdown
- Tags for searchability
- Automatic linking

### 4. **Save Thread Summaries**

```
You: "Save a summary of our conversation to Obsidian"
```

Amp creates:
- Thread summary
- Key insights
- Code snippets discussed
- Tags and references

### 5. **Search Your Notes**

```
You: "Search my Obsidian notes for 'authentication patterns'"
```

Amp will:
- Search your vault
- Show relevant notes
- Provide summaries

## 🔧 Platform-Specific Setup

### Windows

**Config location:**
```
%APPDATA%\Amp\mcp-config.json
```

**Example path:**
```json
{
  "OBSIDIAN_VAULT_PATH": "C:/Users/YourName/Documents/ObsidianVault"
}
```

**PowerShell setup:**
```powershell
# Create config directory
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Amp"

# Copy config
Copy-Item obsidian-config.json "$env:APPDATA\Amp\mcp-config.json"

# Edit with notepad
notepad "$env:APPDATA\Amp\mcp-config.json"
```

### macOS

**Config location:**
```
~/.config/amp/mcp-config.json
```

**Example path:**
```json
{
  "OBSIDIAN_VAULT_PATH": "/Users/YourName/Documents/ObsidianVault"
}
```

**Terminal setup:**
```bash
# Create config directory
mkdir -p ~/.config/amp

# Copy config
cp obsidian-config.json ~/.config/amp/mcp-config.json

# Edit with default editor
open -e ~/.config/amp/mcp-config.json
```

### Linux

**Config location:**
```
~/.config/amp/mcp-config.json
```

**Example path:**
```json
{
  "OBSIDIAN_VAULT_PATH": "/home/yourname/Documents/ObsidianVault"
}
```

**Terminal setup:**
```bash
# Create config directory
mkdir -p ~/.config/amp

# Copy config
cp obsidian-config.json ~/.config/amp/mcp-config.json

# Edit with nano
nano ~/.config/amp/mcp-config.json
```

## 🎨 Best Practices

### 1. **Organize with Tags**

Always tag your notes for easy retrieval:
```
You: "Save this with tags: python, async, patterns"
```

### 2. **Use Descriptive Titles**

Let Amp generate good titles:
```
You: "Save this code snippet about API rate limiting"
```
→ Creates: `api-rate-limiting-implementation.md`

### 3. **Link Related Notes**

Amp automatically creates links between related notes using `[[wikilinks]]`

### 4. **Save Thread Context**

After solving a problem:
```
You: "Save a summary of how we solved this bug to Obsidian"
```

### 5. **Create Learning Logs**

Document what you learn:
```
You: "Save what I learned about GraphQL subscriptions to Obsidian"
```

## 📚 Example Workflows

### Workflow 1: **Document a New Codebase**

```
1. You: "Analyze this repository and create an architecture overview in Obsidian"
2. You: "Document the API endpoints in Obsidian"
3. You: "Create a developer onboarding guide in Obsidian"
4. You: "Save code examples for common tasks to Obsidian"
```

### Workflow 2: **Learning & Research**

```
1. You: "Search my Obsidian notes for 'microservices patterns'"
2. You: "Read the note about event sourcing from Obsidian"
3. You: "Save this new pattern I learned about CQRS to Obsidian"
4. You: "Create a comparison note between different patterns"
```

### Workflow 3: **Bug Fixing Session**

```
1. [Start debugging with Amp]
2. You: "Save the root cause of this bug to Obsidian"
3. You: "Save the solution as a code snippet in Obsidian"
4. You: "Create a note about how to prevent this in the future"
```

## 🐛 Troubleshooting

### Issue: "Vault not found"

**Solution:**
1. Check your vault path is **absolute**, not relative
2. Use forward slashes `/` even on Windows
3. No trailing slash: `C:/Vault` not `C:/Vault/`
4. Verify the path exists: `ls /path/to/vault` or `dir C:\path\to\vault`

### Issue: "Permission denied"

**Solution:**
1. Ensure Obsidian isn't locking the vault
2. Close Obsidian temporarily
3. Check file permissions on the vault directory
4. On Linux/Mac: `chmod -R 755 /path/to/vault`

### Issue: "MCP server not responding"

**Solution:**
1. Restart Amp
2. Check Node.js is installed: `node --version`
3. Clear npm cache: `npx clear-npx-cache`
4. Reinstall MCP: `npm install -g @kynlos/obsidian-mcp`

### Issue: "Notes not appearing in Obsidian"

**Solution:**
1. Refresh Obsidian: `Ctrl/Cmd + R`
2. Check the vault path is correct
3. Verify notes are created: check the file system directly
4. Ensure Obsidian is pointed to the correct vault

## 🔐 Security & Privacy

- ✅ **Local only** - All data stays on your machine
- ✅ **No cloud sync** - Unless you configure Obsidian sync
- ✅ **No tracking** - MCP server is open source
- ✅ **Full control** - You own your notes

## 🔗 Links & Resources

- **Obsidian MCP Server**: https://github.com/Kynlos/Obsidian-MCP
- **Amp Documentation**: https://ampcode.com/manual
- **Obsidian**: https://obsidian.md/
- **MCP Specification**: https://modelcontextprotocol.io/

## 🆘 Support

**Having issues?**
1. Check the [troubleshooting section](#-troubleshooting)
2. Open an issue on [GitHub](https://github.com/Kynlos/Obsidian-MCP/issues)
3. Ask in the Amp Discord community

## 📄 License

MIT License - See the Obsidian MCP repository for details.

---

**Happy note-taking with Amp + Obsidian! 🚀**
