# 📦 Installation Guide

Complete installation guide for Windows, macOS, and Linux.

---

## Prerequisites

Before you begin, ensure you have:

- ✅ [Node.js](https://nodejs.org/) v18 or higher
- ✅ [Amp](https://ampcode.com/) installed
- ✅ [Obsidian](https://obsidian.md/) installed (recommended)

### Check Node.js Version

```bash
node -v
```

Should show `v18.0.0` or higher. If not, download from [nodejs.org](https://nodejs.org/).

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Kynlos/Obsidian-MCP.git
cd Obsidian-MCP
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `dotenv` - Environment variable management

### 3. Run Setup Wizard

```bash
npm run setup
```

The wizard will:
1. ✅ Check your Node.js version
2. 📁 Ask for your Obsidian vault path
3. ✅ Create `.env` configuration file
4. ⚙️ Configure Amp automatically for your platform
5. ✅ Verify everything is set up correctly

**Example interaction:**
```
🚀 Obsidian MCP Setup
==================================================

📁 Obsidian Vault Configuration
--------------------------------------------------
Enter the absolute path to your Obsidian vault.

Examples:
  Windows: C:/Users/YourName/Documents/ObsidianVault
  macOS:   /Users/YourName/Documents/ObsidianVault
  Linux:   /home/yourname/Documents/ObsidianVault

Vault path: C:/Users/Alice/Documents/MyVault
✅ Vault directory found
⚙️  Creating configuration files...
✅ Created .env file
✅ Updated Amp config: C:\Users\Alice\AppData\Roaming\Amp\mcp-config.json

✅ Setup Complete!
```

### 4. Verify Setup

```bash
npm test
```

Should show:
```
✅ .env file exists
✅ Vault directory exists
✅ Amp config file exists
✅ Obsidian MCP server configured in Amp
✅ index.js exists
✅ Dependencies installed
✅ Node.js version v18.0.0+ is supported

✅ All tests passed!
```

### 5. Restart Amp

Close and reopen Amp to load the new MCP configuration.

### 6. Test in Amp

Try this command in Amp:

```
You: "Create a note in Obsidian called 'Test' with content 'Hello from Amp!'"
```

If it works, you're all set! 🎉

---

## Platform-Specific Notes

### Windows

**Config location:** `%APPDATA%\Amp\mcp-config.json`

Typical path: `C:\Users\YourName\AppData\Roaming\Amp\mcp-config.json`

**Path format:**
- ✅ Use forward slashes: `C:/Users/Name/vault`
- ❌ Don't use backslashes: `C:\Users\Name\vault`

### macOS

**Config location:** `~/.config/amp/mcp-config.json`

Typical path: `/Users/YourName/.config/amp/mcp-config.json`

**Path format:**
- ✅ Use absolute paths: `/Users/Name/Documents/vault`
- ❌ Don't use `~`: `~/Documents/vault`

### Linux

**Config location:** `~/.config/amp/mcp-config.json`

Typical path: `/home/yourname/.config/amp/mcp-config.json`

**Path format:**
- ✅ Use absolute paths: `/home/name/Documents/vault`
- ❌ Don't use `~`: `~/Documents/vault`

---

## Manual Configuration

If you prefer to configure manually instead of using `npm run setup`:

### Step 1: Create `.env` file

Copy the example:
```bash
cp .env.example .env
```

Edit `.env`:
```env
OBSIDIAN_VAULT_PATH=/path/to/your/vault
```

### Step 2: Configure Amp

Edit the Amp config file for your platform:

**Windows:** `%APPDATA%\Amp\mcp-config.json`  
**macOS/Linux:** `~/.config/amp/mcp-config.json`

Add this configuration (adjust paths for your system):

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": [
        "/absolute/path/to/Obsidian-MCP/index.js"
      ],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/path/to/your/ObsidianVault"
      }
    }
  }
}
```

**Windows example:**
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": [
        "C:/Users/Alice/Obsidian-MCP/index.js"
      ],
      "env": {
        "OBSIDIAN_VAULT_PATH": "C:/Users/Alice/Documents/MyVault"
      }
    }
  }
}
```

**macOS/Linux example:**
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": [
        "/Users/alice/Obsidian-MCP/index.js"
      ],
      "env": {
        "OBSIDIAN_VAULT_PATH": "/Users/alice/Documents/MyVault"
      }
    }
  }
}
```

### Step 3: Test

```bash
npm test
```

---

## Troubleshooting

### "npm: command not found"

Install Node.js from [nodejs.org](https://nodejs.org/).

### ".env file not found"

Run `npm run setup` or manually create `.env` file.

### "Vault directory not found"

Check that:
1. Path is absolute (starts with `/` on Unix or `C:/` on Windows)
2. Path uses forward slashes `/` not backslashes `\`
3. Directory actually exists

### "Amp config file not found"

The setup script should create this automatically. If not:
1. Check the platform-specific path above
2. Ensure the directory exists (create if needed)
3. Run `npm run setup` again

### "MCP not responding in Amp"

1. Verify config: `npm test`
2. Restart Amp completely
3. Check Amp logs for error messages
4. Verify paths are absolute and use forward slashes

### Permission errors (macOS/Linux)

Make scripts executable:
```bash
chmod +x setup.js test.js index.js
```

---

## Uninstallation

To remove the Obsidian MCP:

1. **Remove from Amp config:**
   Edit your Amp config file and remove the `obsidian` entry from `mcpServers`.

2. **Delete the repository:**
   ```bash
   cd ..
   rm -rf Obsidian-MCP
   ```

3. **Restart Amp**

---

## Next Steps

- 📖 Read [QUICKSTART.md](QUICKSTART.md) for a 5-minute tutorial
- 💡 Check [EXAMPLES.md](EXAMPLES.md) for usage examples
- 🔧 See [README.md](README.md) for full documentation

---

**Need help?** Open an issue at [github.com/Kynlos/Obsidian-MCP/issues](https://github.com/Kynlos/Obsidian-MCP/issues)
