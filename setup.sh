#!/bin/bash
# Obsidian MCP Setup Script for macOS/Linux
# Quick setup for Amp + Obsidian integration

set -e

echo "🚀 Obsidian MCP Setup for Amp"
echo "================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install v18 or newer."
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Check if Obsidian is installed
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ ! -d "/Applications/Obsidian.app" ]; then
        echo "⚠️  Obsidian not found in /Applications. Please install from https://obsidian.md/"
    else
        echo "✅ Obsidian found"
    fi
fi

# Prompt for MCP server path
echo ""
echo "📁 MCP Server Configuration"
echo "----------------------------"
read -p "Enter the absolute path to Obsidian-MCP directory: " MCP_PATH

# Validate MCP path
if [ ! -f "$MCP_PATH/index.js" ]; then
    echo "❌ Cannot find index.js in $MCP_PATH"
    echo "Please ensure you've cloned the Obsidian MCP server:"
    echo "   git clone https://github.com/Kynlos/Obsidian-MCP.git"
    echo "   cd Obsidian-MCP"
    echo "   npm install"
    exit 1
fi

# Prompt for vault path
echo ""
echo "📁 Vault Configuration"
echo "----------------------"
read -p "Enter the absolute path to your Obsidian vault: " VAULT_PATH

# Validate path
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Vault path does not exist: $VAULT_PATH"
    read -p "Create this directory? (y/n): " CREATE_DIR
    if [ "$CREATE_DIR" = "y" ]; then
        mkdir -p "$VAULT_PATH"
        echo "✅ Created vault directory"
    else
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

# Create .env file
echo ""
echo "⚙️  Creating configuration..."
cat > .env << EOF
# Obsidian MCP Configuration
OBSIDIAN_VAULT_PATH=$VAULT_PATH
OBSIDIAN_DEBUG=false
EOF

echo "✅ Created .env file"

# Determine Amp config directory
if [[ "$OSTYPE" == "darwin"* ]]; then
    AMP_CONFIG_DIR="$HOME/.config/amp"
else
    AMP_CONFIG_DIR="$HOME/.config/amp"
fi

# Create Amp config directory
mkdir -p "$AMP_CONFIG_DIR"

# Create MCP config with absolute path
cat > "$AMP_CONFIG_DIR/mcp-config.json" << EOF
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": [
        "$MCP_PATH/index.js"
      ],
      "env": {
        "OBSIDIAN_VAULT_PATH": "$VAULT_PATH"
      }
    }
  }
}
EOF

echo "✅ Created Amp MCP configuration at $AMP_CONFIG_DIR/mcp-config.json"

# Test the configuration
echo ""
echo "🧪 Testing configuration..."
if [ -f "$MCP_PATH/index.js" ]; then
    echo "✅ Obsidian MCP server found and configured"
else
    echo "⚠️  Warning: MCP server file not found at expected location"
fi

# Success!
echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Restart Amp"
echo "2. Test with: 'List my Obsidian vaults'"
echo "3. Create a note: 'Create a note in Obsidian called Test'"
echo ""
echo "📚 Read the documentation:"
echo "   - README.md - Full setup guide"
echo "   - EXAMPLES.md - Usage examples"
echo ""
echo "Configuration saved to:"
echo "   - $AMP_CONFIG_DIR/mcp-config.json"
echo "   - .env (in current directory)"
echo ""
echo "Happy note-taking! 🎉"
