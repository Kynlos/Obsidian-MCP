---
title: 04 - Bot Permissions
type: knowledge-note
created: 2025-11-05T17:58:15.884Z
tags: ["permissions", "setup", "discord", "troubleshooting"]
---

# 04 - Bot Permissions

# Bot Permissions Guide

Understanding and configuring Discord permissions for Build Crew Bot.

---

## Quick Setup: Administrator Permission

**Easiest option for initial setup:**

When inviting the bot, use **Administrator** permission (permission code `8`)

**Invite URL with Administrator:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=8&scope=bot%20applications.commands
```

✅ **Advantages:**
- Grants all necessary permissions
- No permission troubleshooting needed
- Bot can manage all roles and channels

⚠️ **Considerations:**
- Very broad permissions
- May not be acceptable in all servers
- Consider minimal permissions for production

---

## Minimal Required Permissions

If you don't want to use Administrator, these are the **minimum required permissions:**

### Essential Permissions

| Permission | Why Needed | Permission Code |
|-----------|-----------|----------------|
| **View Channels** | See server channels | `1024` |
| **Send Messages** | Send notifications and responses | `2048` |
| **Embed Links** | Display rich embedded messages | `16384` |
| **Read Message History** | Process commands | `65536` |
| **Use Application Commands** | Enable slash commands | `2147483648` |
| **Manage Roles** | Assign BC1/BC2/BC3 roles to users | `268435456` |

### Recommended Additional Permissions

| Permission | Why Needed | Permission Code |
|-----------|-----------|----------------|
| **Manage Channels** | Auto-create cohort channels | `16` |
| **Mention Everyone** | Mention roles in announcements | `131072` |
| **Kick Members** | Moderation commands (Staff only) | `2` |
| **Ban Members** | Moderation commands (Staff only) | `4` |
| **Moderate Members** | Timeout commands (Staff only) | `1099511627776` |

### Combined Permission Code

**Minimal permissions code:** `2416112640`

**Recommended permissions code:** `2416244742`

**Invite URL with minimal permissions:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=2416112640&scope=bot%20applications.commands
```

---

## Role Hierarchy

### Critical: Bot Role Position

**The bot CANNOT assign roles that are above it in the role hierarchy.**

#### Setting Up Role Hierarchy

1. Go to **Server Settings** → **Roles**
2. Drag roles to set hierarchy (higher = more power)

**Recommended order (top to bottom):**
```
1. Server Owner (automatic)
2. Admin roles
3. Staff role
4. Build Crew Bot role  ← Bot's role
5. Build Crew (base role)
6. BC1
7. BC2
8. BC3
9. @everyone
```

**Why this matters:**
- Bot can assign BC1, BC2, BC3, Build Crew (they're below it)
- Bot cannot assign Staff or Admin roles (they're above it)
- Bot can manage cohort channels

---

## Checking Bot Permissions

### Automatic Permission Check

The bot automatically checks permissions on startup and logs results in `bot.log`:

```
INFO - CHECKING BOT PERMISSIONS IN ALL GUILDS
INFO - Guild: Build Crew Server (ID: 1234567890)
INFO -    [OK] Manage Roles - Required for role assignment
INFO -    [OK] Send Messages - Required for notifications
INFO -    [MISSING] Manage Channels - Required for auto-setup
```

### Manual Permission Check

**In Discord:**
1. Right-click the bot in member list
2. Select **"Roles"** or **"Permissions"**
3. View current permissions

**Using Bot Commands:**
```
!status
```
Shows bot status, loaded cogs, and permission warnings

---

## Troubleshooting Permissions

### "Bot cannot assign roles"

**Problem:** Role hierarchy is incorrect

**Solution:**
1. Server Settings → Roles
2. Move bot's role **above** BC1, BC2, BC3, Build Crew roles
3. Keep it **below** Staff role

### "Missing Access to Channel"

**Problem:** Bot can't see channels

**Solution:**
1. Ensure bot has **"View Channels"** permission
2. Check channel-specific permissions
3. Grant bot access to categories

### "Cannot Send Messages"

**Problem:** Bot lacks send permissions

**Solution:**
1. Check **"Send Messages"** permission is enabled
2. Check channel-specific overrides
3. Ensure bot isn't muted/restricted

### "Slash Commands Not Appearing"

**Problem:** Application Commands permission missing

**Solution:**
1. Re-invite bot with `scope=bot%20applications.commands`
2. Wait up to 1 hour for global sync
3. Or use `DEVELOPMENT_GUILD_ID` for instant sync

---

## Permission Templates

### Development/Testing Server

```python
# Invite URL for testing (Administrator)
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=8&scope=bot%20applications.commands
```

### Production Server (Minimal)

```python
# Invite URL for production (Minimal required)
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=2416112640&scope=bot%20applications.commands
```

### Production Server (Recommended)

```python
# Invite URL for production (All features)
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=2416244742&scope=bot%20applications.commands
```

---

## Permission Verification Checklist

Before going live:

- [ ] Bot role positioned above Build Crew roles
- [ ] Bot has "Manage Roles" permission
- [ ] Bot has "View Channels" permission
- [ ] Bot has "Send Messages" permission
- [ ] Bot has "Use Application Commands" permission
- [ ] Bot can see cohort channels
- [ ] `!status` command shows no permission errors
- [ ] `/buildcrew` and `/invitecode` commands visible

---

## Next Steps

- [[05 - Launch and Testing]] - Launch and verify bot
- [[07 - Troubleshooting]] - Common permission issues
- [[03 - Configuration Guide]] - Back to configuration



## Related Notes

- [[02---discord-developer-setup|02 - Discord Developer Setup]]
- [[01---quick-start-guide|01 - Quick Start Guide]]
- [[03---configuration-guide|03 - Configuration Guide]]


---
*Created: 05/11/2025, 17:58:15*
