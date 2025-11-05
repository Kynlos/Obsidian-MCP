---
title: 02 - Discord Developer Setup
type: knowledge-note
created: 2025-11-05T17:57:04.741Z
tags: ["setup", "discord", "developer", "security"]
---

# 02 - Discord Developer Setup

# Discord Developer Setup

This guide walks you through creating and configuring your Discord bot application from scratch.

---

## Creating Your Bot Application

### Step 1: Access Developer Portal

1. Navigate to https://discord.com/developers/applications
2. Log in with your Discord account
3. Click **"New Application"** (top right)
4. Enter a name: `Build Crew Bot` (or your preferred name)
5. Accept Discord's Terms of Service
6. Click **"Create"**

---

## Configuring Bot Settings

### Step 2: General Information

In the **General Information** tab:

1. **Application ID** - Copy this (needed for `config.py` as `APP_ID`)
2. **Public Key** - Copy this (needed for `config.py` as `PUBLIC_KEY`)
3. **Description** - (Optional) Add a description
4. **Icon** - (Optional) Upload a bot icon

### Step 3: Create Bot User

1. Go to **"Bot"** tab (left sidebar)
2. Click **"Add Bot"**
3. Confirm by clicking **"Yes, do it!"**

### Step 4: Configure Bot

In the Bot tab:

#### Token
1. Click **"Reset Token"**
2. Confirm with your password/2FA
3. **Copy the token immediately** (it won't be shown again)
4. Save this as `BOT_TOKEN` in `config.py`

⚠️ **NEVER share your bot token publicly!**

#### Privileged Gateway Intents

Scroll down to **"Privileged Gateway Intents"** and enable:

- ✅ **PRESENCE INTENT** - For member status tracking
- ✅ **SERVER MEMBERS INTENT** - Required for role management
- ✅ **MESSAGE CONTENT INTENT** - Required for command processing

Click **"Save Changes"**

#### Bot Permissions

Under **"Bot Permissions"**, note these for later:
- Administrator (simplest for initial setup)
- Or specific permissions (see [[04 - Bot Permissions]])

### Step 5: OAuth2 Setup

1. Go to **"OAuth2"** tab → **"General"**
2. **Client Secret** - Click **"Reset Secret"** → Copy it
3. Save this as `CLIENT_SECRET` in `config.py`
4. **Client ID** - Copy this (needed for OAuth if used)
5. Save as `OAUTH_CLIENT_ID` in `config.py`

---

## Generating Invite URL

### Step 6: Create Bot Invite Link

1. Go to **"OAuth2"** → **"URL Generator"**
2. Under **SCOPES**, select:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Under **BOT PERMISSIONS**, select **Administrator** (or custom permissions)
4. **Copy the generated URL** at the bottom

**Example URL:**
```
https://discord.com/api/oauth2/authorize?client_id=1234567890&permissions=8&scope=bot%20applications.commands
```

---

## Inviting Bot to Server

### Step 7: Add Bot to Your Discord Server

1. Paste the invite URL in your browser
2. Select the server you want to add the bot to
3. Click **"Authorize"**
4. Complete the CAPTCHA
5. Bot will appear in your server (offline until you run it)

---

## Required Configuration Values

After completing these steps, you should have:

| Config Variable | Where to Find It |
|----------------|------------------|
| `BOT_TOKEN` | Bot tab → Reset Token |
| `APP_ID` | General Information → Application ID |
| `PUBLIC_KEY` | General Information → Public Key |
| `CLIENT_SECRET` | OAuth2 → General → Client Secret |
| `OAUTH_CLIENT_ID` | OAuth2 → General → Client ID |
| `OAUTH_CLIENT_SECRET` | Same as CLIENT_SECRET |

---

## Next Steps

- [[03 - Configuration Guide]] - Complete config.py setup
- [[04 - Bot Permissions]] - Understanding required permissions
- [[05 - Launch and Testing]] - Running your bot

---

## Security Best Practices

🔒 **Keep these values SECRET:**
- Bot Token
- Client Secret
- API Keys

❌ **NEVER:**
- Commit them to GitHub
- Share them in Discord
- Post them publicly

✅ **DO:**
- Use environment variables for production
- Regenerate tokens if exposed
- Store config.py in .gitignore



## Related Notes

- [[01---quick-start-guide|01 - Quick Start Guide]]


---
*Created: 05/11/2025, 17:57:04*
