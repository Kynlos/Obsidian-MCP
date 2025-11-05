---
title: 07 - Troubleshooting
type: knowledge-note
created: 2025-11-05T18:00:59.260Z
tags: ["troubleshooting", "errors", "debugging", "help"]
---

# 07 - Troubleshooting

# Troubleshooting Guide

Common issues and solutions for Build Crew Bot.

---

## Bot Won't Start

### Error: "Improper token has been passed"

**Problem:** Invalid or missing `BOT_TOKEN`

**Solutions:**
1. Go to Discord Developer Portal
2. Applications → Your Bot → Bot tab
3. Click **"Reset Token"**
4. Copy new token to `config.py`
5. Ensure no extra spaces or quotes
6. Restart bot

**Example correct format:**
```python
BOT_TOKEN = "MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.AbCdEf.GhIjKlMnOpQrStUvWxYz"
```

### Error: "Privileged intent provided is not enabled"

**Problem:** Missing Gateway Intents

**Solution:**
1. Discord Developer Portal → Your Bot → Bot tab
2. Scroll to **"Privileged Gateway Intents"**
3. Enable:
   - ✅ PRESENCE INTENT
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
4. Click **"Save Changes"**
5. Restart bot

### Error: "ModuleNotFoundError: No module named 'discord'"

**Problem:** Dependencies not installed

**Solution:**
```bash
pip install -r requirements.txt
```

**If still failing:**
```bash
pip install discord.py aiohttp flask flask-cors email-validator feedparser
```

### Error: "FileNotFoundError: users.txt"

**Problem:** Data files missing

**Solution:**
```bash
# Windows
type nul > users.txt
type nul > invcode.txt

# Linux/Mac
touch users.txt
touch invcode.txt
```

---

## Slash Commands Not Appearing

### Commands don't show up in Discord

**Problem:** Commands not synced

**Solutions:**

**Option 1: Development Mode (Instant Sync)**
```python
# In config.py
DEVELOPMENT_MODE = True
DEVELOPMENT_GUILD_ID = 1234567890123456789  # Your server ID
```
Restart bot - commands appear in seconds

**Option 2: Manual Sync (Owner Only)**
```
!reload_slash
```

**Option 3: Global Sync (Takes up to 1 hour)**
```python
# In config.py
DEVELOPMENT_MODE = False
```
Wait up to 1 hour for commands to appear

**Option 4: Re-invite Bot**

Ensure invite URL includes `scope=bot%20applications.commands`:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=8&scope=bot%20applications.commands
```

### Commands appear but don't work

**Problem:** Permissions or errors

**Solutions:**

1. **Check bot.log:**
   ```bash
   # View recent errors
   Get-Content bot.log -Tail 50
   ```

2. **Check permissions:**
   ```
   !status
   ```
   Look for permission warnings

3. **Check role hierarchy:**
   - Server Settings → Roles
   - Bot role must be above Build Crew roles

---

## Permission Errors

### "Missing Permissions" or "403 Forbidden"

**Problem:** Bot lacks required permissions

**Solutions:**

1. **Check role hierarchy:**
   - Server Settings → Roles
   - Drag bot role **above** BC1, BC2, BC3, Build Crew
   - Keep bot role **below** Staff

2. **Verify permissions:**
   Required permissions:
   - Manage Roles
   - View Channels
   - Send Messages
   - Embed Links
   - Use Application Commands

3. **Re-invite bot with correct permissions:**
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=8&scope=bot%20applications.commands
   ```

### "Cannot assign role"

**Problem:** Role hierarchy issue

**Solution:**

Bot can only assign roles **below** its highest role.

1. Server Settings → Roles
2. Move bot's role **above** all Build Crew roles
3. Test role assignment again

---

## Email Verification Issues

### `/buildcrew` command - "Email not found"

**Problem:** Email not in `users.txt`

**Solutions:**

1. **Add email to users.txt:**
   ```
   user@email.com :: BC1
   ```

2. **Check email format:**
   - Ensure `::` separator is present
   - Check for typos
   - Verify cohort is BC1, BC2, or BC3

3. **Verify file exists:**
   ```bash
   # Check file exists
   dir users.txt  # Windows
   ls users.txt   # Linux/Mac
   ```

### Email verification works but no role assigned

**Problem:** Permission or role issue

**Solutions:**

1. **Check bot.log:**
   ```bash
   Get-Content bot.log -Tail 50
   ```

2. **Verify roles exist:**
   - Server Settings → Roles
   - Ensure "Build Crew", "BC1", "BC2", "BC3" exist

3. **Check role hierarchy:**
   - Bot role must be above Build Crew roles

---

## Invite Code Issues

### `/invitecode` - "Invalid or expired code"

**Problem:** Code not in `invcode.txt` or fully used

**Solutions:**

1. **Check code in invcode.txt:**
   ```
   CODE123 :: BC1 :: 50 :: 0
   ```

2. **Verify code isn't fully used:**
   ```
   CODE123 :: BC1 :: 50 :: 50  ← Fully used (50/50)
   CODE123 :: BC1 :: 50 :: 25  ← Still available (25/50)
   ```

3. **Check code format:**
   - Code name is **case-sensitive**
   - Must have all 4 fields: `code :: cohort :: max :: used`

4. **Add new code:**
   ```
   echo NEWCODE :: BC1 :: 100 :: 0 >> invcode.txt
   ```

### Invite code works but no role assigned

Same as email verification - check permissions and role hierarchy.

---

## Cohort Overflow Issues

### Users not assigned to correct cohort

**Problem:** Cohort full, overflow system activated

**Expected behavior:**

If BC1 has 250 members (full):
- User assigned to BC2 instead
- This is **normal behavior**
- Not an error

**Solutions:**

1. **Check cohort counts:**
   ```
   !quickstats
   ```

2. **Increase MAX_ROLE_MEMBERS:**
   ```python
   # In config.py
   MAX_ROLE_MEMBERS = 500  # Default: 250
   ```

3. **Create more cohort roles:**
   - Server Settings → Roles
   - Create BC4, BC5, etc.
   - Bot will use them automatically

---

## API Server Issues

### API server won't start

**Problem:** Port already in use or config issue

**Solutions:**

1. **Check config.py:**
   ```python
   API_ENABLED = True
   API_HOST = "localhost"
   API_PORT = 5000
   API_KEY = "your_api_key_here"
   ```

2. **Change port if in use:**
   ```python
   API_PORT = 5001  # Or another port
   ```

3. **Check if port is in use:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Linux/Mac
   lsof -i :5000
   ```

4. **Kill process using port:**
   ```bash
   # Windows (replace PID with actual process ID)
   taskkill /F /PID 1234
   
   # Linux/Mac
   kill -9 1234
   ```

### API requests return 401 Unauthorized

**Problem:** Missing or invalid API key

**Solution:**

Include API key in request:

**Header method:**
```bash
curl http://localhost:5000/list_codes \
  -H "X-API-Key: your_api_key_here"
```

**Query parameter method:**
```bash
curl http://localhost:5000/list_codes?api_key=your_api_key_here
```

**JSON body method:**
```bash
curl -X POST http://localhost:5000/add_invite_code \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your_api_key_here", "code": "TEST", "role": "BC1", "max_uses": 1}'
```

---

## Dashboard Issues

### Dashboard features not working

**Problem:** Gemini API key not set or invalid

**Solutions:**

1. **Get Gemini API key:**
   - Go to https://aistudio.google.com/apikey
   - Create new API key
   - Copy to config.py

2. **Add to config.py:**
   ```python
   GEMINI_API_KEY = "your_gemini_api_key_here"
   ```

3. **Restart bot**

**Note:** Dashboard is **optional** - bot works without it

### Word cloud not generating

**Problem:** Gemini API key issue or insufficient data

**Solutions:**

1. **Check Gemini API key is set**
2. **Ensure channel has messages**
3. **Check bot.log for errors**

---

## Data File Corruption

### Invalid format errors

**Problem:** `users.txt` or `invcode.txt` has incorrect format

**Solutions:**

1. **Validate users.txt format:**
   ```
   email@domain.com :: BC1
   ```
   - Email address
   - Space + `::` + Space
   - Cohort (BC1, BC2, or BC3)

2. **Validate invcode.txt format:**
   ```
   CODE :: BC1 :: 50 :: 0
   ```
   - Code name
   - Space + `::` + Space + Cohort
   - Space + `::` + Space + Max uses
   - Space + `::` + Space + Used count

3. **Restore from backup:**
   ```bash
   copy users.txt.backup users.txt
   copy invcode.txt.backup invcode.txt
   ```

4. **Remove invalid lines:**
   - Open file in text editor
   - Delete malformed lines
   - Save file

---

## Performance Issues

### Bot is slow or unresponsive

**Solutions:**

1. **Check bot status:**
   ```
   !status
   ```

2. **Review bot.log:**
   Look for errors or warnings

3. **Restart bot:**
   ```bash
   # Stop with Ctrl+C
   # Start again
   python main.py
   ```

4. **Check server resources:**
   - CPU usage
   - Memory usage
   - Disk space

### High memory usage

**Problem:** Bot consuming too much RAM

**Solutions:**

1. **Restart bot periodically**
2. **Reduce loaded cogs** (edit `main.py`)
3. **Check for memory leaks** in custom cogs

---

## Logging & Debugging

### Enable verbose logging

**In main.py:**
```python
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO to DEBUG
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler()
    ]
)
```

### View real-time logs

```bash
# Windows PowerShell
Get-Content bot.log -Wait -Tail 50

# Linux/Mac
tail -f bot.log
```

### Clear log file

```bash
# Windows
type nul > bot.log

# Linux/Mac
> bot.log
```

---

## Getting Help

### Built-in Help Commands

```
/help          # User help
!help_staff    # Staff help (staff only)
!status        # Bot status (owner only)
```

### Check Documentation

- [[01 - Quick Start Guide]]
- [[04 - Bot Permissions]]
- [[05 - Launch and Testing]]
- [[08 - Bot Commands Reference]]

### Log Files

Always check `bot.log` first:
```bash
Get-Content bot.log -Tail 100
```

### Discord Developer Portal

Check:
- Bot token is valid
- Intents are enabled
- Application ID is correct

---

## Emergency Recovery

### Complete Bot Reset

1. **Stop bot** (Ctrl+C)

2. **Backup data:**
   ```bash
   copy users.txt users.txt.backup
   copy invcode.txt invcode.txt.backup
   ```

3. **Reset config:**
   - Get new bot token from Discord
   - Update config.py
   - Verify all IDs are correct

4. **Remove and re-invite bot:**
   - Kick bot from server
   - Re-invite with correct permissions

5. **Restart bot:**
   ```bash
   python main.py
   ```

6. **Verify functionality:**
   - Test `/buildcrew`
   - Test `/invitecode`
   - Check `!status`

---

## Still Having Issues?

1. **Check bot.log** for specific error messages
2. **Review configuration** in config.py
3. **Verify permissions** in Discord
4. **Test with minimal setup** (empty data files)
5. **Check Discord Developer Portal** for bot status




---
*Created: 05/11/2025, 18:00:59*
