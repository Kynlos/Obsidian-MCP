---
title: 05 - Launch and Testing
type: knowledge-note
created: 2025-11-05T17:59:05.161Z
tags: ["launch", "testing", "setup", "verification"]
---

# 05 - Launch and Testing

# Launch and Testing Guide

Complete guide to launching Build Crew Bot and verifying everything works.

---

## Pre-Launch Checklist

### 1. Prerequisites Installed

```bash
# Verify Python version (3.8+)
python --version

# Should output: Python 3.8.x or higher
```

### 2. Dependencies Installed

```bash
# Navigate to bot directory
cd LOCATION/BuildCrewBot

# Install requirements
pip install -r requirements.txt
```

**Required packages:**
- `discord.py>=2.3.0`
- `aiohttp>=3.8.0`
- `flask>=3.0.0`
- `flask-cors>=4.0.0`
- `email-validator>=2.0.0`
- `feedparser>=6.0.10`

### 3. Configuration Completed

- [ ] `config.py` has `BOT_TOKEN` set
- [ ] `config.py` has `APP_ID` set
- [ ] `config.py` has `PUBLIC_KEY` set
- [ ] `config.py` has `CLIENT_SECRET` set
- [ ] At least one `OWNER_ID` configured
- [ ] `DEVELOPMENT_GUILD_ID` set for testing

### 4. Data Files Exist

```bash
# Create files if they don't exist
type nul > users.txt
type nul > invcode.txt

# Or on Linux/Mac:
# touch users.txt invcode.txt
```

### 5. Old Bot Removed (if applicable)

**If replacing an existing bot:**

1. Open Discord → Your Server
2. Server Settings → Integrations
3. Find old bot → Click **"Remove"** or **"Kick"**
4. Confirm removal

---

## Launching the Bot

### Method 1: Direct Launch (Main Bot Only)

```bash
# Run from bot directory
python main.py
```

**Expected output:**
```
INFO - Setting up bot...
INFO - Loaded extension: cogs.core.buildcrew
INFO - Loaded extension: cogs.core.invitecode
INFO - Loaded extension: cogs.core.help_command
INFO - Loaded extension: cogs.core.api
INFO - Loaded extension: cogs.admin.bot_management
INFO - Loaded extension: cogs.moderation.member_management
INFO - Guild sync successful: 8 slash commands to guild 1234567890
INFO - BuildCrewBot#1234 has connected to Discord!
INFO - Bot is in 1 guilds
INFO - CHECKING BOT PERMISSIONS IN ALL GUILDS
INFO - Guild: Your Server Name (ID: 1234567890)
INFO -    STATUS: ALL PERMISSIONS OK
```

### Method 2: With Dashboard (Optional)

**The bot includes dashboard features automatically** if `GEMINI_API_KEY` is set.

Dashboard features are embedded in cogs - no separate launch needed.

**To enable dashboard features:**
1. Get Gemini API key from https://aistudio.google.com/apikey
2. Add to `config.py`: `GEMINI_API_KEY = "your_key_here"`
3. Launch bot normally: `python main.py`

---

## Inviting the New Bot

### Step 1: Generate Invite URL

Replace `YOUR_APP_ID` with your Application ID from `config.py`:

**With Administrator permissions (easiest):**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=8&scope=bot%20applications.commands
```

**With minimal permissions:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=2416112640&scope=bot%20applications.commands
```

### Step 2: Authorize Bot

1. Paste URL in browser
2. Select your Discord server
3. Click **"Authorize"**
4. Complete CAPTCHA
5. Bot appears in server member list

### Step 3: Configure Role Hierarchy

**CRITICAL:** Bot must be above Build Crew roles

1. Server Settings → Roles
2. Drag bot's role **above**:
   - Build Crew
   - BC1
   - BC2
   - BC3
3. Keep bot's role **below**:
   - Staff
   - Admin roles

---

## Verification Tests

### Test 1: Bot is Online

✅ **Check:** Bot appears in member list with green "Online" status

❌ **If offline:** Check bot.log for errors, verify BOT_TOKEN

### Test 2: Slash Commands Work

```
/buildcrew
```
✅ **Should:** Open email input modal

```
/invitecode
```
✅ **Should:** Open invite code input modal

```
/help
```
✅ **Should:** Show help information

❌ **If commands don't appear:**
- Wait up to 1 hour (global sync)
- Or set `DEVELOPMENT_GUILD_ID` for instant sync
- Run `!reload_slash` (owner only)

### Test 3: Owner Commands Work

**As bot owner, type in Discord:**

```
!status
```

✅ **Should:** Show bot uptime, loaded cogs, performance stats

❌ **If "command not found":**
- Check your Discord ID is in `OWNER_IDS`
- Ensure MESSAGE_CONTENT intent is enabled

### Test 4: Permission Check

Look in `bot.log` for permission report:

```
INFO - CHECKING BOT PERMISSIONS IN ALL GUILDS
INFO -    STATUS: ALL PERMISSIONS OK
```

❌ **If permission issues found:**
- See [[04 - Bot Permissions]]
- Adjust role hierarchy
- Re-invite bot with correct permissions

---

## Understanding Sync Modes

### Development Mode (Instant Sync)

```python
# In config.py
DEVELOPMENT_MODE = True
DEVELOPMENT_GUILD_ID = 1234567890123456789  # Your test server
```

✅ **Slash commands appear in seconds**
❌ **Only visible in test server**

### Production Mode (Global Sync)

```python
# In config.py
DEVELOPMENT_MODE = False
DEVELOPMENT_GUILD_ID = None
```

✅ **Slash commands visible in all servers**
❌ **Takes up to 1 hour to propagate**

### Manual Sync (Owner Only)

**Instant guild sync:**
```
!reload_slash
```
Syncs to `DEVELOPMENT_GUILD_ID` or current guild

**Global sync:**
```
!sync_global
```
Syncs globally (takes up to 1 hour)

---

## Dashboard Features (Optional)

**If `GEMINI_API_KEY` is configured:**

Available AI-powered features:
- Word cloud generation (`/wordcloud`)
- Conversation analysis
- Power user detection
- Marketing intelligence
- Daily digest summaries

**If Gemini API key NOT set:**
- Bot works normally
- AI features are disabled
- No errors or warnings

---

## First Time Setup

### 1. Create Initial Invite Code

**Add to `invcode.txt`:**
```
WELCOME2024 :: BC1 :: 100 :: 0
```

Format: `code :: starting_cohort :: max_uses :: used_count`

### 2. Test User Verification

1. As regular user (not owner), type:
   ```
   /invitecode
   ```

2. Enter code: `WELCOME2024`

3. Verify:
   - User gets "Build Crew" role
   - User gets "BC1" role (or BC2/BC3 if BC1 is full)
   - User gets access to cohort channel

### 3. Verify Role Assignment

Check:
- [ ] User has "Build Crew" role
- [ ] User has cohort role (BC1, BC2, or BC3)
- [ ] User can see cohort channel
- [ ] `invcode.txt` shows usage count updated

---

## Monitoring the Bot

### Log File

**Location:** `bot.log` in bot directory

**View in real-time:**
```bash
# Windows (PowerShell)
Get-Content bot.log -Wait -Tail 50

# Linux/Mac
tail -f bot.log
```

### Console Output

Bot logs to both file and console simultaneously.

**Watch for:**
- `ERROR` - Critical issues
- `WARNING` - Potential problems
- `INFO` - Normal operation

### Status Command

```
!status
```

Shows:
- Bot uptime
- Loaded cogs
- Command count
- Performance metrics

---

## Common Launch Issues

### "Failed to start bot: Improper token"

❌ **Problem:** Invalid `BOT_TOKEN`

✅ **Solution:**
1. Go to Discord Developer Portal
2. Bot tab → Reset Token
3. Copy new token to `config.py`
4. Restart bot

### "403 Forbidden" or "Missing Permissions"

❌ **Problem:** Insufficient bot permissions

✅ **Solution:**
1. Check role hierarchy
2. Verify bot has required permissions
3. See [[04 - Bot Permissions]]

### "Slash commands not appearing"

❌ **Problem:** Commands not synced

✅ **Solution:**
1. Set `DEVELOPMENT_GUILD_ID` for instant sync
2. Or wait up to 1 hour for global sync
3. Or run `!reload_slash` (owner only)

### "ModuleNotFoundError"

❌ **Problem:** Missing dependencies

✅ **Solution:**
```bash
pip install -r requirements.txt
```

---

## Stopping the Bot

### Graceful Shutdown

Press `Ctrl+C` in terminal

**Expected output:**
```
INFO - Bot stopped by user
```

### Force Stop

If Ctrl+C doesn't work:
- Close terminal window
- Or find process and kill it

**Windows:**
```powershell
taskkill /F /IM python.exe
```

---

## Next Steps

- [[06 - Data Files Setup]] - Configure users and invite codes
- [[08 - Bot Commands Reference]] - Learn all commands
- [[07 - Troubleshooting]] - Solve common issues
- [[09 - Dashboard Guide]] - Optional dashboard features

---

## Quick Reference

**Launch bot:**
```bash
python main.py
```

**Check status (owner only):**
```
!status
```

**Reload commands (owner only):**
```
!reload_slash
```

**View logs:**
```bash
# Real-time log viewing (Windows)
Get-Content bot.log -Wait -Tail 50
```

**Stop bot:**
```
Ctrl+C
```



## Related Notes

- [[01---quick-start-guide|01 - Quick Start Guide]]
- [[02---discord-developer-setup|02 - Discord Developer Setup]]
- [[03---configuration-guide|03 - Configuration Guide]]
- [[04---bot-permissions|04 - Bot Permissions]]


---
*Created: 05/11/2025, 17:59:05*
