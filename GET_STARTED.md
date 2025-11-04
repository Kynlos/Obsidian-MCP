# 🎯 Get Started in 3 Steps

The fastest way to get Obsidian MCP running with Amp.

---

## Step 1: Install

```bash
npm install
```

**What this does:**
- Installs MCP SDK
- Installs dotenv for configuration
- Takes ~10 seconds

---

## Step 2: Setup

```bash
npm run setup
```

**What this does:**
- Asks for your Obsidian vault path
- Creates `.env` configuration
- Configures Amp automatically
- Works on Windows, macOS, and Linux

**Example:**
```
🚀 Obsidian MCP Setup
==================================================

📁 Obsidian Vault Configuration
Enter the absolute path to your Obsidian vault.

Vault path: C:/Users/YourName/Documents/MyVault
✅ Vault directory found
⚙️  Creating configuration files...
✅ Created .env file
✅ Updated Amp config

✅ Setup Complete!
```

---

## Step 3: Restart Amp

Close and reopen Amp to load the MCP.

---

## Verify It Works

In Amp, try:

```
You: "Create a note in Obsidian called 'Test' with content 'Hello!'"
```

If you see a success message, you're all set! 🎉

---

## Quick Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run setup` | Configure everything |
| `npm test` | Verify configuration |
| `npm start` | Run server (debugging) |

---

## Troubleshooting

### Setup failed?
Run `npm test` to see what's wrong.

### Amp not seeing the MCP?
1. Make sure you restarted Amp completely
2. Run `npm test` to verify config
3. Check the vault path is correct

### Still having issues?
- Read [INSTALL.md](INSTALL.md) for detailed instructions
- Check [README.md](README.md) for troubleshooting
- Open an issue on GitHub

---

## What's Next?

- 📖 Read [QUICKSTART.md](QUICKSTART.md) for a tutorial
- 💡 Check [EXAMPLES.md](EXAMPLES.md) for usage ideas
- 🔧 See [README.md](README.md) for all features

---

**That's it! Three simple steps to AI-powered note-taking.** 🚀
