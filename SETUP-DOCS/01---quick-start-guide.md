---
title: 01 - Quick Start Guide
type: knowledge-note
created: 2025-11-05T17:57:04.721Z
tags: ["setup", "quickstart", "getting-started"]
---

# 01 - Quick Start Guide

# Build Crew Bot - Quick Start Guide

## Prerequisites

Before you begin, ensure you have:

- **Python 3.8 or higher** installed
- A **Discord Developer Account** (free at https://discord.com/developers)
- Access to your Discord server with **Administrator permissions**
- **(Optional)** A **Google Gemini API key** for dashboard features

---

## 5-Minute Setup

### Step 1: Create Discord Bot

1. Go to https://discord.com/developers/applications
2. Click **"New Application"** and give it a name (e.g., "Build Crew Bot")
3. Go to **"Bot"** tab → Click **"Add Bot"**
4. Under **"Privileged Gateway Intents"**, enable:
   - ✅ **PRESENCE INTENT**
   - ✅ **SERVER MEMBERS INTENT**
   - ✅ **MESSAGE CONTENT INTENT**
5. Click **"Reset Token"** → **Copy the token** (you'll need this)

### Step 2: Install Bot Files

```bash
# Navigate to your bot directory
cd LOCATION/BuildCrewBot

# Install required packages
pip install -r requirements.txt
```

### Step 3: Configure Bot

Open `config.py` and fill in **required** fields:

```python
# REQUIRED - Get from Discord Developer Portal
BOT_TOKEN = "your_discord_bot_token_here"
APP_ID = "your_application_id_here"
PUBLIC_KEY = "your_public_key_here"
CLIENT_SECRET = "your_client_secret_here"

# OPTIONAL - For dashboard functionality
GEMINI_API_KEY = "your_gemini_api_key_here"  # Leave empty to skip dashboard
```

### Step 4: Remove Old Bot (if applicable)

If there's already a bot in your Discord server:

1. Go to **Server Settings** → **Integrations**
2. Find the old bot → Click **"Remove"** or **"Kick"**
3. Confirm removal

### Step 5: Invite New Bot

Generate invite URL with correct permissions:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=8&scope=bot%20applications.commands
```

**Replace `YOUR_APP_ID`** with your Application ID from Discord Developer Portal.

**Permissions included:** Administrator (simplest for setup)

### Step 6: Launch Bot

```bash
python main.py
```

**You should see:**
```
INFO - Loaded extension: cogs.core.buildcrew
INFO - Loaded extension: cogs.core.invitecode
...
INFO - BuildCrewBot#1234 has connected to Discord!
```

---

## Optional: Launch Dashboard

The dashboard provides AI-powered analytics and visualization.

**Requirements:**
- Gemini API key configured in `config.py`
- Dashboard runs as part of the main bot process

**Note:** Dashboard features are embedded within various cogs. No separate launch needed.

---

## Verification

Test your bot is working:

1. In Discord, type `/buildcrew` - modal should appear
2. Type `/invitecode` - modal should appear
3. Check bot shows as **online** in member list

---

## Next Steps

- [[02 - Discord Developer Setup]] - Detailed Discord setup guide
- [[03 - Configuration Guide]] - All config.py options explained
- [[04 - Bot Permissions]] - Understanding required permissions
- [[05 - Launch and Testing]] - Complete launch procedures

---

## Quick Troubleshooting

**Bot not responding?**
- Check `BOT_TOKEN` is correct
- Ensure bot has proper permissions
- Check bot.log file for errors

**Slash commands not appearing?**
- Wait up to 1 hour for global sync
- Or set `DEVELOPMENT_GUILD_ID` for instant sync

**Dashboard not working?**
- Ensure `GEMINI_API_KEY` is set
- Dashboard is optional - bot works without it




---
*Created: 05/11/2025, 17:57:04*
