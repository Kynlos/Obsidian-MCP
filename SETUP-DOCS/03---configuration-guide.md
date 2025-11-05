---
title: 03 - Configuration Guide
type: knowledge-note
created: 2025-11-05T17:58:15.870Z
tags: ["configuration", "setup", "config"]
---

# 03 - Configuration Guide

# Configuration Guide (config.py)

Complete reference for all configuration options in `config.py`.

---

## Required Settings

### Discord Bot Credentials

```python
# Get these from Discord Developer Portal
BOT_TOKEN = "your_bot_token_here"              # REQUIRED - Bot tab → Token
APP_ID = "your_application_id_here"            # REQUIRED - General Info → App ID
PUBLIC_KEY = "your_public_key_here"            # REQUIRED - General Info → Public Key
CLIENT_SECRET = "your_client_secret_here"      # REQUIRED - OAuth2 → Client Secret
```

**How to get these:** See [[02 - Discord Developer Setup]]

### OAuth Settings

```python
OAUTH_CLIENT_ID = "same_as_app_id"             # Usually same as APP_ID
OAUTH_CLIENT_SECRET = "same_as_client_secret"  # Usually same as CLIENT_SECRET
```

---

## Owner Configuration

### Bot Owners

```python
OWNER_IDS = [123456789012345678]  # List of Discord User IDs
```

**How to get your User ID:**
1. Enable Developer Mode: Discord Settings → Advanced → Developer Mode
2. Right-click your username → Copy ID
3. Add the ID to this list

**Owner privileges:**
- Access to `!reload_slash` command
- Access to `!sync_global` command
- Access to `!status` command
- Full bot administration

---

## Server Configuration

### Role IDs

```python
ROLES = {
    "STAFF": 0,        # Staff/Moderator role ID
    "BUILD_CREW": 0,   # Base Build Crew role ID
    "BC1": 0,          # Cohort 1 role ID
    "BC2": 0,          # Cohort 2 role ID
    "BC3": 0           # Cohort 3 role ID
}
```

**How to get Role IDs:**
1. Enable Developer Mode in Discord
2. Go to Server Settings → Roles
3. Right-click a role → Copy ID
4. Paste into config.py

### Category & Channel IDs

```python
CATEGORIES = {
    "GENERAL_BUILD_CREW": 0,  # General Build Crew category ID
    "COHORT": 0               # Cohort channels category ID
}

COHORT_CHANNELS = {
    "COHORT_1": 0,  # BC1 text channel ID
    "COHORT_2": 0,  # BC2 text channel ID
    "COHORT_3": 0   # BC3 text channel ID
}

NOTIFICATION_CHANNEL_ID = 0  # Channel for bot notifications
```

**How to get Channel/Category IDs:**
1. Right-click channel or category → Copy ID
2. Paste into config.py

---

## Bot Settings

### Basic Settings

```python
COMMAND_PREFIX = "!"  # Prefix for legacy commands
MAX_ROLE_MEMBERS = 250  # Max members per cohort (overflow to next cohort)
USER_FILE = "users.txt"  # Email → Role mappings file
INVITE_CODE_FILE = "invcode.txt"  # Invite codes file
```

### Development Mode

```python
DEVELOPMENT_MODE = True  # Set False for production
DEVELOPMENT_GUILD_ID = 1234567890123456789  # Your test server ID
```

**Why use Development Mode?**
- ✅ Instant slash command sync (seconds instead of 1 hour)
- ✅ Test changes without affecting production
- ❌ Commands only visible in test server

**Production Mode:**
```python
DEVELOPMENT_MODE = False  # Commands sync globally (takes up to 1 hour)
DEVELOPMENT_GUILD_ID = None
```

---

## Optional Features

### External API Integration

```python
EXTERNAL_API_ENABLED = False  # Enable external email validation API
EXTERNAL_API_URL = "https://your-api.com/validate"
EXTERNAL_API_KEY = "your_api_key"
EXTERNAL_API_TIMEOUT = 10  # Timeout in seconds
```

**When to enable:**
- You have an external user database
- Want to validate emails against external system
- Need centralized user management

### Gemini API (Dashboard Features)

```python
GEMINI_API_KEY = "your_gemini_api_key_here"  # Optional - for AI features
```

**Required for:**
- Word cloud generation
- Conversation analysis
- Marketing intelligence
- Power user detection
- AI-powered insights

**How to get Gemini API Key:**
1. Go to https://aistudio.google.com/apikey
2. Create new API key
3. Copy and paste into config.py

**If left empty:** Bot works fine, but AI features will be disabled

### Dashboard Settings

```python
DASHBOARD_GUILD_ID = 1234567890123456789  # Guild for dashboard access
DASHBOARD_ROLE_ID = 9876543210987654321   # Role required to access dashboard
DASHBOARD_SECRET_KEY = "change-this-to-random-string"  # Flask session key
```

**Dashboard is optional** - main bot functionality works without it

---

## File Paths

### Data Files

Bot uses two text files for data storage:

**users.txt** - Email to cohort mapping
```
email@example.com :: BC1
another@email.com :: BC2
```

**invcode.txt** - Invite codes with usage tracking
```
CODE123 :: BC1 :: 50 :: 0
WELCOME :: BC2 :: 100 :: 25
```
Format: `code :: role :: max_uses :: used_count`

---

## Example Complete Configuration

```python
# Discord Bot Configuration
BOT_TOKEN = "MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.AbCdEf.GhIjKlMnOpQrStUvWxYz123456"
APP_ID = "1234567890123456789"
PUBLIC_KEY = "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890"
CLIENT_SECRET = "AbCdEfGhIjKlMnOpQrStUvWxYz123456"

OAUTH_CLIENT_ID = "1234567890123456789"
OAUTH_CLIENT_SECRET = "AbCdEfGhIjKlMnOpQrStUvWxYz123456"

OWNER_IDS = [419699564812173344, 1270371236316184621]

ROLES = {
    "STAFF": 1419633403002617978,
    "BUILD_CREW": 1419707166289432707,
    "BC1": 1419634050683109397,
    "BC2": 1419634144861880445,
    "BC3": 1419634183034245152
}

CATEGORIES = {
    "GENERAL_BUILD_CREW": 1419633686747418664,
    "COHORT": 1419633965190615142
}

COHORT_CHANNELS = {
    "COHORT_1": 1419634276399452241,
    "COHORT_2": 1419634390191050792,
    "COHORT_3": 1419634449108176896
}

NOTIFICATION_CHANNEL_ID = 1419784662414393394

MAX_ROLE_MEMBERS = 250
USER_FILE = "users.txt"
INVITE_CODE_FILE = "invcode.txt"
COMMAND_PREFIX = "!"

DEVELOPMENT_MODE = True
DEVELOPMENT_GUILD_ID = 1369018393407127613

EXTERNAL_API_ENABLED = False
EXTERNAL_API_URL = ""
EXTERNAL_API_KEY = ""
EXTERNAL_API_TIMEOUT = 10

GEMINI_API_KEY = ""  # Optional - leave empty to skip dashboard features

DASHBOARD_GUILD_ID = 1369018393407127613
DASHBOARD_ROLE_ID = 1373719727662432348
DASHBOARD_SECRET_KEY = "super-secret-random-string-change-me"
```

---

## Configuration Checklist

Before launching:

- [ ] BOT_TOKEN set
- [ ] APP_ID set
- [ ] PUBLIC_KEY set
- [ ] CLIENT_SECRET set
- [ ] At least one OWNER_ID set
- [ ] All ROLE IDs configured (or will be auto-created)
- [ ] DEVELOPMENT_GUILD_ID set for testing
- [ ] users.txt file exists (can be empty)
- [ ] invcode.txt file exists (can be empty)

**Optional:**
- [ ] GEMINI_API_KEY set (for AI features)
- [ ] External API configured (if needed)
- [ ] Dashboard settings configured (if needed)

---

## Next Steps

- [[04 - Bot Permissions]] - Configure Discord permissions
- [[05 - Launch and Testing]] - Launch your bot
- [[06 - Data Files Setup]] - Configure users.txt and invcode.txt



## Related Notes

- [[01---quick-start-guide|01 - Quick Start Guide]]
- [[02---discord-developer-setup|02 - Discord Developer Setup]]


---
*Created: 05/11/2025, 17:58:15*
