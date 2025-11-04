# Obsidian MCP Setup Script for Windows
# Quick setup for Amp + Obsidian integration

Write-Host "🚀 Obsidian MCP Setup for Amp" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = (node -v) -replace 'v', '' -split '\.' | Select-Object -First 1
    if ([int]$nodeVersion -lt 18) {
        Write-Host "❌ Node.js version $nodeVersion is too old. Please install v18 or newer." -ForegroundColor Red
        Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Node.js $(node -v) found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js v18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Obsidian
$obsidianPaths = @(
    "$env:LOCALAPPDATA\Obsidian\Obsidian.exe",
    "$env:ProgramFiles\Obsidian\Obsidian.exe"
)

$obsidianFound = $false
foreach ($path in $obsidianPaths) {
    if (Test-Path $path) {
        Write-Host "✅ Obsidian found" -ForegroundColor Green
        $obsidianFound = $true
        break
    }
}

if (-not $obsidianFound) {
    Write-Host "⚠️  Obsidian not found. Please install from https://obsidian.md/" -ForegroundColor Yellow
}

# Prompt for MCP server path
Write-Host ""
Write-Host "📁 MCP Server Configuration" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Write-Host "Example: C:/Users/YourName/Obsidian-MCP" -ForegroundColor Gray
$mcpPath = Read-Host "Enter the absolute path to Obsidian-MCP directory"

# Normalize path
$mcpPath = $mcpPath -replace '\\', '/'

# Validate MCP path
if (-not (Test-Path "$mcpPath/index.js")) {
    Write-Host "❌ Cannot find index.js in $mcpPath" -ForegroundColor Red
    Write-Host "Please ensure you've cloned the Obsidian MCP server:" -ForegroundColor Yellow
    Write-Host "   git clone https://github.com/Kynlos/Obsidian-MCP.git" -ForegroundColor Gray
    Write-Host "   cd Obsidian-MCP" -ForegroundColor Gray
    Write-Host "   npm install" -ForegroundColor Gray
    exit 1
}

# Prompt for vault path
Write-Host ""
Write-Host "📁 Vault Configuration" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Yellow
Write-Host "Example: C:/Users/YourName/Documents/ObsidianVault" -ForegroundColor Gray
$vaultPath = Read-Host "Enter the absolute path to your Obsidian vault"

# Normalize path (convert backslashes to forward slashes)
$vaultPath = $vaultPath -replace '\\', '/'

# Validate path
if (-not (Test-Path $vaultPath)) {
    Write-Host "❌ Vault path does not exist: $vaultPath" -ForegroundColor Red
    $createDir = Read-Host "Create this directory? (y/n)"
    if ($createDir -eq 'y') {
        New-Item -ItemType Directory -Force -Path $vaultPath | Out-Null
        Write-Host "✅ Created vault directory" -ForegroundColor Green
    } else {
        Write-Host "❌ Setup cancelled" -ForegroundColor Red
        exit 1
    }
}

# Create .env file
Write-Host ""
Write-Host "⚙️  Creating configuration..." -ForegroundColor Yellow

$envContent = @"
# Obsidian MCP Configuration
OBSIDIAN_VAULT_PATH=$vaultPath
OBSIDIAN_DEBUG=false
"@

Set-Content -Path ".env" -Value $envContent
Write-Host "✅ Created .env file" -ForegroundColor Green

# Create Amp config directory
$ampConfigDir = "$env:APPDATA\Amp"
New-Item -ItemType Directory -Force -Path $ampConfigDir | Out-Null

# Create MCP config
$mcpConfig = @"
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": [
        "$mcpPath/index.js"
      ],
      "env": {
        "OBSIDIAN_VAULT_PATH": "$vaultPath"
      }
    }
  }
}
"@

$configPath = "$ampConfigDir\mcp-config.json"
Set-Content -Path $configPath -Value $mcpConfig
Write-Host "✅ Created Amp MCP configuration at $configPath" -ForegroundColor Green

# Test the configuration
Write-Host ""
Write-Host "🧪 Testing configuration..." -ForegroundColor Yellow
if (Test-Path "$mcpPath/index.js") {
    Write-Host "✅ Obsidian MCP server found and configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: MCP server file not found at expected location" -ForegroundColor Yellow
}

# Success!
Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart Amp"
Write-Host "2. Test with: 'List my Obsidian vaults'"
Write-Host "3. Create a note: 'Create a note in Obsidian called Test'"
Write-Host ""
Write-Host "📚 Read the documentation:" -ForegroundColor Cyan
Write-Host "   - README.md - Full setup guide"
Write-Host "   - EXAMPLES.md - Usage examples"
Write-Host ""
Write-Host "Configuration saved to:" -ForegroundColor Yellow
Write-Host "   - $configPath"
Write-Host "   - .env (in current directory)"
Write-Host ""
Write-Host "Happy note-taking! 🎉" -ForegroundColor Cyan
