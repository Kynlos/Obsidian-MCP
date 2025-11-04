#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function getPlatformConfigPath() {
  const platform = os.platform();
  const home = os.homedir();
  
  if (platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Amp', 'mcp-config.json');
  } else if (platform === 'darwin' || platform === 'linux') {
    return path.join(home, '.config', 'amp', 'mcp-config.json');
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function setup() {
  console.log('\n🚀 Obsidian MCP Setup');
  console.log('='.repeat(50));
  console.log('\nThis will configure the Obsidian MCP for Amp.\n');
  
  // Check Node.js version
  const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
  if (nodeVersion < 18) {
    console.error('❌ Node.js version 18 or higher is required.');
    console.error(`   Current version: ${process.version}`);
    process.exit(1);
  }
  console.log(`✅ Node.js ${process.version}`);
  
  // Get vault path
  console.log('\n📁 Obsidian Vault Configuration');
  console.log('-'.repeat(50));
  console.log('Enter the absolute path to your Obsidian vault.');
  console.log('Examples:');
  console.log('  Windows: C:/Users/YourName/Documents/ObsidianVault');
  console.log('  macOS:   /Users/YourName/Documents/ObsidianVault');
  console.log('  Linux:   /home/yourname/Documents/ObsidianVault\n');
  
  const vaultPath = await question('Vault path: ');
  
  if (!vaultPath || vaultPath.trim() === '') {
    console.error('❌ Vault path is required.');
    process.exit(1);
  }
  
  // Normalize path (convert backslashes to forward slashes on Windows)
  const normalizedVaultPath = vaultPath.replace(/\\/g, '/');
  
  // Check if vault exists, offer to create
  const vaultExists = await fileExists(normalizedVaultPath);
  if (!vaultExists) {
    console.log(`\n⚠️  Vault directory does not exist: ${normalizedVaultPath}`);
    const create = await question('Create this directory? (y/n): ');
    if (create.toLowerCase() === 'y') {
      await fs.mkdir(normalizedVaultPath, { recursive: true });
      console.log('✅ Created vault directory');
    } else {
      console.error('❌ Setup cancelled');
      process.exit(1);
    }
  } else {
    console.log('✅ Vault directory found');
  }
  
  // Create .env file
  console.log('\n⚙️  Creating configuration files...');
  
  const envContent = `# Obsidian MCP Configuration
OBSIDIAN_VAULT_PATH=${normalizedVaultPath}

# Optional: Enable debug logging
# OBSIDIAN_DEBUG=true
`;
  
  await fs.writeFile(path.join(__dirname, '.env'), envContent, 'utf-8');
  console.log('✅ Created .env file');
  
  // Create Amp config
  const mcpServerPath = __dirname.replace(/\\/g, '/');
  const ampConfigPath = getPlatformConfigPath();
  const ampConfigDir = path.dirname(ampConfigPath);
  
  // Create config directory if it doesn't exist
  await fs.mkdir(ampConfigDir, { recursive: true });
  
  // Read existing config or create new one
  let ampConfig = { mcpServers: {} };
  if (await fileExists(ampConfigPath)) {
    try {
      const existing = await fs.readFile(ampConfigPath, 'utf-8');
      ampConfig = JSON.parse(existing);
    } catch (error) {
      console.log('⚠️  Could not parse existing config, creating new one');
    }
  }
  
  // Add/update obsidian server
  ampConfig.mcpServers.obsidian = {
    command: 'node',
    args: [`${mcpServerPath}/index.js`],
    env: {
      OBSIDIAN_VAULT_PATH: normalizedVaultPath
    }
  };
  
  await fs.writeFile(ampConfigPath, JSON.stringify(ampConfig, null, 2), 'utf-8');
  console.log(`✅ Updated Amp config: ${ampConfigPath}`);
  
  // Success message
  console.log('\n✅ Setup Complete!');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('1. Restart Amp');
  console.log('2. Test with: "List my Obsidian vaults"');
  console.log('3. Create a note: "Create a note in Obsidian called Test"\n');
  console.log('Configuration files created:');
  console.log(`  - ${path.join(__dirname, '.env')}`);
  console.log(`  - ${ampConfigPath}\n`);
  console.log('Happy note-taking! 🎉\n');
  
  rl.close();
}

setup().catch((error) => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
