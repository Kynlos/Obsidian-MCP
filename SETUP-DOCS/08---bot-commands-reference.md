---
title: 08 - Bot Commands Reference
type: knowledge-note
created: 2025-11-05T18:01:50.427Z
tags: ["commands", "reference", "documentation"]
---

# 08 - Bot Commands Reference

# Bot Commands Reference

Complete reference for all Build Crew Bot commands.

---

## User Commands (Slash Commands)

### `/buildcrew`

**Description:** Email verification for Build Crew access

**Who can use:** Anyone

**How it works:**
1. User types `/buildcrew` in Discord
2. Modal appears asking for email address
3. User enters email
4. Bot checks email against `users.txt`
5. If found, assigns appropriate cohort role

**Example:**
```
User: /buildcrew
Bot: [Modal appears]
User: [Enters: john@example.com]
Bot: ✅ Welcome! You've been assigned to BC1.
```

**Cohort assignment:**
- Email in `users.txt` specifies starting cohort
- If cohort full (250 members), assigns to next available
- Always assigns base "Build Crew" role + cohort role

---

### `/invitecode`

**Description:** Invite code verification for cohort access

**Who can use:** Anyone

**How it works:**
1. User types `/invitecode`
2. Modal appears asking for invite code
3. User enters code
4. Bot checks code in `invcode.txt`
5. If valid and not expired, assigns cohort role
6. Increments usage counter

**Example:**
```
User: /invitecode
Bot: [Modal appears]
User: [Enters: WELCOME2024]
Bot: ✅ Welcome! You've been assigned to BC2.
```

**Code validation:**
- Code must exist in `invcode.txt`
- Used count must be less than max uses
- Cohort overflow applies (BC1 → BC2 → BC3)

---

### `/help`

**Description:** Shows help information

**Who can use:** Anyone

**Output:**
- Available slash commands
- How to use each command
- Link to support/documentation

---

## Staff Commands (Slash Commands)

### `/stats`

**Description:** Comprehensive server and cohort statistics

**Who can use:** Staff role members

**Output:**
- Total server members
- Members per cohort (BC1, BC2, BC3)
- Build Crew member count
- Role distribution
- Growth metrics

**Example:**
```
/stats

📊 Build Crew Server Statistics
━━━━━━━━━━━━━━━━━━━━━━

👥 Total Members: 1,247
🎯 Build Crew Members: 823

📍 Cohort Distribution:
├─ BC1: 250/250 (Full)
├─ BC2: 250/250 (Full)
└─ BC3: 323/250 (Overflow)

📈 Growth: +47 this week
```

---

### `/kick`

**Description:** Kick a member from the server

**Who can use:** Staff role members

**Syntax:**
```
/kick user:[member] reason:[optional]
```

**Example:**
```
/kick user:@JohnDoe reason:Spam
```

---

### `/ban`

**Description:** Ban a member from the server

**Who can use:** Staff role members

**Syntax:**
```
/ban user:[member] reason:[optional] delete_messages:[days]
```

**Example:**
```
/ban user:@Spammer reason:Multiple violations delete_messages:7
```

---

### `/unban`

**Description:** Unban a user by ID

**Who can use:** Staff role members

**Syntax:**
```
/unban user_id:[discord_id]
```

**Example:**
```
/unban user_id:123456789012345678
```

---

### `/timeout`

**Description:** Timeout a member (temporary mute)

**Who can use:** Staff role members

**Syntax:**
```
/timeout user:[member] duration:[minutes] reason:[optional]
```

**Example:**
```
/timeout user:@User duration:60 reason:Disruptive behavior
```

---

### `/untimeout`

**Description:** Remove timeout from member

**Who can use:** Staff role members

**Syntax:**
```
/untimeout user:[member]
```

---

### `/role_add`

**Description:** Add a role to a member

**Who can use:** Staff role members

**Syntax:**
```
/role_add user:[member] role:[role]
```

**Example:**
```
/role_add user:@JohnDoe role:@BC2
```

---

### `/role_remove`

**Description:** Remove a role from a member

**Who can use:** Staff role members

**Syntax:**
```
/role_remove user:[member] role:[role]
```

---

### `/role_info`

**Description:** Get information about a role

**Who can use:** Staff role members

**Syntax:**
```
/role_info role:[role]
```

**Output:**
- Role name and ID
- Member count
- Color
- Position
- Permissions

---

### `/member_roles`

**Description:** List all roles a member has

**Who can use:** Staff role members

**Syntax:**
```
/member_roles user:[member]
```

---

## Staff Commands (Prefix Commands)

### `!help_staff`

**Description:** Show all staff commands

**Who can use:** Staff role members

**Output:**
- List of all staff-only commands
- Brief description of each
- Usage examples

---

### `!quickstats`

**Description:** Quick cohort member overview

**Who can use:** Staff role members

**Output:**
```
📊 Quick Stats

BC1: 250/250 (Full)
BC2: 250/250 (Full)
BC3: 145/250 (Available)
Build Crew: 645 members
```

---

### `!api_status`

**Description:** Check API integration status

**Who can use:** Staff role members

**Output:**
- API server status
- Available endpoints
- Integration health

---

### `!sync_users`

**Description:** Sync users with external API

**Who can use:** Staff role members

**Requirements:**
- External API must be configured
- `EXTERNAL_API_ENABLED = True` in config.py

---

### `!api_test`

**Description:** Test API connectivity

**Who can use:** Staff role members

**Output:**
- Connection test results
- Response time
- Error messages (if any)

---

## Owner Commands (Prefix Commands)

### `!reload_slash`

**Description:** Hot-reload all cogs and sync slash commands

**Who can use:** Bot owners only

**What it does:**
1. Reloads all cog files
2. Syncs slash commands
3. No bot restart needed

**Sync behavior:**
- If `DEVELOPMENT_GUILD_ID` set → syncs to that guild (instant)
- Otherwise → syncs to current guild (instant)

**Example:**
```
!reload_slash

✅ Reloaded Cogs:
├─ buildcrew
├─ invitecode
├─ help_command
├─ api
└─ bot_management

✅ Synced 8 slash commands to guild
```

---

### `!sync_guild [guild_id]`

**Description:** Sync slash commands to specific guild

**Who can use:** Bot owners only

**Syntax:**
```
!sync_guild 1234567890123456789
```

**Result:** Instant sync to specified guild

---

### `!sync_global`

**Description:** Sync slash commands globally

**Who can use:** Bot owners only

**Warning:** Takes up to 1 hour to propagate

**When to use:**
- Production deployment
- Making commands available in all servers

**Example:**
```
!sync_global

⏳ Global sync started
⚠️ Commands will appear within 1 hour
```

---

### `!status`

**Description:** Show bot status and diagnostics

**Who can use:** Bot owners only

**Output:**
```
🤖 Build Crew Bot Status
━━━━━━━━━━━━━━━━━━━━━━

⏱️ Uptime: 3d 14h 27m
💾 Memory: 127 MB
🖥️ CPU: 2.4%
📡 Latency: 45ms

📦 Loaded Cogs: 12
├─ Core: 8
├─ Admin: 2
└─ Moderation: 3

✅ Permissions: OK
📊 Guilds: 1
👥 Total Users: 1,247
```

---

### `!reload_global_slash`

**Description:** Global sync (alias for `!sync_global`)

**Who can use:** Bot owners only

Same as `!sync_global`

---

## AI-Powered Commands (Optional)

### `/wordcloud`

**Description:** Generate word cloud from channel messages

**Who can use:** Staff (if Gemini API configured)

**Requirements:**
- `GEMINI_API_KEY` must be set
- Channel must have messages

**Syntax:**
```
/wordcloud channel:[channel] limit:[number]
```

**Example:**
```
/wordcloud channel:#general limit:1000
```

---

## Hidden/System Commands

### Auto-delete Commands

**Description:** Automatically delete messages in configured channels

**Configuration:** Set up via `!configure_autodelete` (owner only)

**Features:**
- Delete after X seconds
- Per-channel configuration
- Excludes pinned messages

---

### Daily Digest

**Description:** Automated daily summary

**Configuration:** Runs automatically if configured

**Features:**
- Daily activity summary
- Top contributors
- Message statistics
- Sent to configured channel

---

### Welcome Messages

**Description:** Automated welcome for new members

**Configuration:** Auto-enabled when member joins

**Features:**
- Custom welcome message
- Role assignment instructions
- Server guidelines

---

## Command Permissions Summary

| Command | User | Staff | Owner |
|---------|------|-------|-------|
| `/buildcrew` | ✅ | ✅ | ✅ |
| `/invitecode` | ✅ | ✅ | ✅ |
| `/help` | ✅ | ✅ | ✅ |
| `/stats` | ❌ | ✅ | ✅ |
| `/kick` | ❌ | ✅ | ✅ |
| `/ban` | ❌ | ✅ | ✅ |
| `/unban` | ❌ | ✅ | ✅ |
| `/timeout` | ❌ | ✅ | ✅ |
| `/role_add` | ❌ | ✅ | ✅ |
| `/role_remove` | ❌ | ✅ | ✅ |
| `!help_staff` | ❌ | ✅ | ✅ |
| `!quickstats` | ❌ | ✅ | ✅ |
| `!api_status` | ❌ | ✅ | ✅ |
| `!reload_slash` | ❌ | ❌ | ✅ |
| `!sync_global` | ❌ | ❌ | ✅ |
| `!status` | ❌ | ❌ | ✅ |

---

## Tips & Best Practices

### For Users

- Use `/buildcrew` if you received email confirmation
- Use `/invitecode` if you have an invite code
- Check DMs for bot responses
- Contact staff if verification fails

### For Staff

- Use `/stats` regularly to monitor growth
- Use `!quickstats` for quick checks
- Moderate with `/timeout` before `/kick` or `/ban`
- Document moderation actions in staff channel

### For Owners

- Use `!status` to monitor bot health
- Use `!reload_slash` after code changes
- Use `DEVELOPMENT_GUILD_ID` for testing
- Only use `!sync_global` for production

---

## Next Steps

- [[09 - Dashboard Guide]] - Optional dashboard features
- [[10 - API Server Guide]] - API command reference
- [[06 - Data Files Setup]] - Configure user data




---
*Created: 05/11/2025, 18:01:50*
