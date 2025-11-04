#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

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

async function test() {
  console.log('\n🧪 Testing Obsidian MCP Configuration');
  console.log('='.repeat(50));
  
  let hasErrors = false;
  
  // Test 1: Check .env file
  console.log('\n📋 Checking configuration files...\n');
  const envPath = path.join(__dirname, '.env');
  if (await fileExists(envPath)) {
    console.log('✅ .env file exists');
    const vaultPath = process.env.OBSIDIAN_VAULT_PATH?.trim();
    if (vaultPath && vaultPath !== '') {
      console.log(`   Vault path: ${vaultPath}`);
      
      // Check if vault exists
      if (await fileExists(vaultPath)) {
        console.log('✅ Vault directory exists');
      } else {
        console.log('❌ Vault directory not found');
        hasErrors = true;
      }
    } else {
      console.log('❌ OBSIDIAN_VAULT_PATH not set in .env');
      console.log('   Edit .env and set: OBSIDIAN_VAULT_PATH=/path/to/vault');
      hasErrors = true;
    }
  } else {
    console.log('❌ .env file not found');
    console.log('   Run: npm run setup');
    hasErrors = true;
  }
  
  // Test 2: Check Amp config
  const ampConfigPath = getPlatformConfigPath();
  if (await fileExists(ampConfigPath)) {
    console.log('✅ Amp config file exists');
    console.log(`   Location: ${ampConfigPath}`);
    
    try {
      const config = JSON.parse(await fs.readFile(ampConfigPath, 'utf-8'));
      if (config.mcpServers?.obsidian) {
        console.log('✅ Obsidian MCP server configured in Amp');
        const serverConfig = config.mcpServers.obsidian;
        console.log(`   Command: ${serverConfig.command}`);
        console.log(`   Script: ${serverConfig.args?.[0] || 'N/A'}`);
        console.log(`   Vault: ${serverConfig.env?.OBSIDIAN_VAULT_PATH || 'N/A'}`);
      } else {
        console.log('❌ Obsidian MCP server not found in Amp config');
        hasErrors = true;
      }
    } catch (error) {
      console.log('❌ Could not parse Amp config file');
      console.log(`   Error: ${error.message}`);
      hasErrors = true;
    }
  } else {
    console.log('❌ Amp config file not found');
    console.log('   Run: npm run setup');
    hasErrors = true;
  }
  
  // Test 3: Check index.js
  const indexPath = path.join(__dirname, 'index.js');
  if (await fileExists(indexPath)) {
    console.log('✅ index.js exists');
  } else {
    console.log('❌ index.js not found');
    hasErrors = true;
  }
  
  // Test 4: Check node_modules
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (await fileExists(nodeModulesPath)) {
    console.log('✅ Dependencies installed');
  } else {
    console.log('❌ Dependencies not installed');
    console.log('   Run: npm install');
    hasErrors = true;
  }
  
  // Test 5: Check Node.js version
  const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
  if (nodeVersion >= 18) {
    console.log(`✅ Node.js version ${process.version} is supported`);
  } else {
    console.log(`❌ Node.js version ${process.version} is too old (need >=18)`);
    hasErrors = true;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Configuration has errors. Please fix them and try again.');
    console.log('\nTo reconfigure, run: npm run setup\n');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    console.log('\nYour Obsidian MCP is properly configured.');
    console.log('\nNext steps:');
    console.log('1. Restart Amp');
    console.log('2. Test in Amp: "List my Obsidian vaults"');
    console.log('3. Create a note: "Create a note in Obsidian called Test"\n');
    process.exit(0);
  }
}

test().catch((error) => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});
