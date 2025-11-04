# 🚀 Quickstart Guide

Get up and running with Obsidian MCP in under 5 minutes!

## Installation

```bash
# Clone the repository
git clone https://github.com/Kynlos/Obsidian-MCP.git
cd Obsidian-MCP

# Install dependencies
npm install

# Run the setup wizard
npm run setup
```

That's it! The setup wizard will:
1. Ask for your Obsidian vault path
2. Create configuration files
3. Configure Amp automatically

## Verify Setup

```bash
npm test
```

## Restart Amp

Close and reopen Amp for the changes to take effect.

## Test in Amp

Try these commands:

```
You: "List my Obsidian vaults"
```

```
You: "Create a note in Obsidian called 'Getting Started' with content 'My first note from Amp!'"
```

```
You: "Save this code snippet to Obsidian"
function hello() {
  console.log("Hello from Amp!");
}
```

## What's Next?

- Read [EXAMPLES.md](EXAMPLES.md) for more usage examples
- Check [README.md](README.md) for full documentation
- Explore all available MCP tools in Amp

## Troubleshooting

If something doesn't work:

1. Run `npm test` to check configuration
2. Make sure you restarted Amp
3. Check that your vault path exists
4. See [README.md#troubleshooting](README.md#troubleshooting) for more help

---

**Happy note-taking! 🎉**
