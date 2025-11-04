# 🚀 Quick Setup Guide

## Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [Amp](https://ampcode.com/) installed
- [Obsidian](https://obsidian.md/) installed (optional but recommended)

## Setup Steps

### Option 1: Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

**macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

The script will:
1. Check prerequisites
2. Ask for your Obsidian vault path
3. Install dependencies
4. Configure Amp automatically

### Option 2: Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Amp:**
   
   Create or edit `mcp-config.json` in:
   - **Windows:** `%APPDATA%\Amp\mcp-config.json`
   - **macOS/Linux:** `~/.config/amp/mcp-config.json`

   Add this configuration (replace paths with your actual paths):
   ```json
   {
     "mcpServers": {
       "obsidian": {
         "command": "node",
         "args": [
           "C:/path/to/Obsidian-MCP/index.js"
         ],
         "env": {
           "OBSIDIAN_VAULT_PATH": "C:/path/to/your/ObsidianVault"
         }
       }
     }
   }
   ```

   **Important:**
   - Use **absolute paths** only
   - On Windows, use forward slashes `/` not backslashes `\`
   - The vault path should point to your Obsidian vault folder

3. **Restart Amp**

## Testing

After setup, test the integration in Amp:

```
You: "List my Obsidian vaults"
```

```
You: "Create a note in Obsidian called 'Test' with content 'Hello from Amp!'"
```

## Configuration

### Environment Variables

You can optionally create a `.env` file in the Obsidian-MCP directory:

```env
OBSIDIAN_VAULT_PATH=/path/to/your/vault
OBSIDIAN_DEBUG=false
```

### Multiple Vaults

The MCP supports multiple vaults. You can:
- Create new vaults: `"Create a vault called ProjectNotes"`
- Switch vaults: `"Switch to vault ProjectNotes"`
- List vaults: `"List my Obsidian vaults"`

## Troubleshooting

### "Cannot find index.js"
- Ensure you've cloned the repository completely
- Check that `index.js` exists in the Obsidian-MCP directory

### "Vault not found"
- Use absolute paths (not relative like `./vault`)
- On Windows, use forward slashes: `C:/Users/Name/vault`
- Ensure the vault directory exists

### MCP Not Responding
1. Restart Amp
2. Check the config file is in the correct location
3. Verify the paths in your configuration are correct
4. Check Node.js is in your PATH: `node -v`

### Permission Errors
On macOS/Linux, make sure the setup script is executable:
```bash
chmod +x setup.sh
```

## Next Steps

Read the documentation:
- [README.md](README.md) - Full feature documentation
- [EXAMPLES.md](EXAMPLES.md) - Usage examples and workflows
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute

## Support

- 🐛 [Report Issues](https://github.com/Kynlos/Obsidian-MCP/issues)
- 📖 [Read the Documentation](README.md)
- 💬 Join the Amp Discord community

---

**Happy note-taking! 🎉**
