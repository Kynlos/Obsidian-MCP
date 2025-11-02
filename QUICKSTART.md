# Quick Start Guide

Get Amp connected to Obsidian in 5 minutes!

## Step 1: Clone & Build Obsidian MCP Server

```bash
git clone https://github.com/Kynlos/Obsidian-MCP.git
cd Obsidian-MCP
npm install
npm run build
cd ..
```

**Note the full path** to the Obsidian-MCP directory!

## Step 2: Run Setup Script

**Windows:**
```powershell
cd obsidian-mcp-amp-setup
.\setup.ps1
```

**macOS/Linux:**
```bash
cd obsidian-mcp-amp-setup
chmod +x setup.sh
./setup.sh
```

The script will ask for:
- Path to Obsidian-MCP directory (from Step 1)
- Path to your Obsidian vault

## Step 3: Restart Amp

Close and reopen Amp.

## Step 4: Test It!

In Amp, try:
```
You: "Create a note in Obsidian called 'Test' with content 'Hello from Amp!'"
```

Check your Obsidian vault - the note should appear!

## ✅ You're Done!

Now you can:
- Ask Amp to save code snippets
- Document projects automatically
- Save thread summaries
- Build knowledge graphs

**See [EXAMPLES.md](EXAMPLES.md) for more ideas!**
