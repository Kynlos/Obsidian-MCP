---
title: 00 - README
type: knowledge-note
created: 2025-11-05T18:04:50.203Z
tags: ["readme", "index", "overview", "navigation"]
---

# 00 - README

# Build Crew Discord Bot - Setup Documentation

Welcome to the complete setup and launch documentation for Build Crew Discord Bot.

---

## 📚 Documentation Index

### Quick Start
**[[01 - Quick Start Guide]]** - Get your bot running in 5 minutes

### Setup & Configuration
- **[[02 - Discord Developer Setup]]** - Create and configure your Discord bot application
- **[[03 - Configuration Guide]]** - Complete config.py reference
- **[[04 - Bot Permissions]]** - Understanding and setting up permissions
- **[[05 - Launch and Testing]]** - Complete launch procedures and verification
- **[[06 - Data Files Setup]]** - Configure users.txt and invcode.txt

### Troubleshooting & Reference
- **[[07 - Troubleshooting]]** - Common issues and solutions
- **[[08 - Bot Commands Reference]]** - Complete command documentation

### Optional Features
- **[[09 - Dashboard Guide]]** - AI-powered analytics (optional, requires Gemini API)
- **[[10 - API Server Guide]]** - External integrations and automation (optional)

---

## 🚀 New to Build Crew Bot?

**Start here:** [[01 - Quick Start Guide]]

This will get you from zero to a running bot in under 10 minutes.

---

## 📋 What You'll Need

### Required
- ✅ **Python 3.8+** installed
- ✅ **Discord Developer Account** (free)
- ✅ **Discord Server** with admin access
- ✅ **10 minutes** of setup time

### Optional
- 🎨 **Gemini API Key** - For AI-powered dashboard features (free tier available)
- 🌐 **SMTP Credentials** - For automated emails (optional)

---

## 🎯 What This Bot Does

### Core Features
- **Email Verification** (`/buildcrew`) - Verify users by email
- **Invite Codes** (`/invitecode`) - Code-based access system
- **Smart Cohort Assignment** - Automatic overflow to next available cohort
- **Role Management** - Automated Build Crew role assignment

### Staff Features
- **Moderation Commands** - Kick, ban, timeout, role management
- **Statistics** - Server and cohort analytics
- **Member Management** - Comprehensive member tools

### Optional Features
- **AI Dashboard** - Word clouds, conversation analysis, power user detection
- **API Server** - RESTful API for external integrations
- **Daily Digest** - Automated daily summaries
- **Analytics** - Marketing insights and growth tracking

---

## 📖 How to Use This Documentation

### First-Time Setup
Follow in order:
1. [[01 - Quick Start Guide]] - Essential 5-minute setup
2. [[02 - Discord Developer Setup]] - Detailed Discord configuration
3. [[03 - Configuration Guide]] - Configure all options
4. [[04 - Bot Permissions]] - Set up permissions correctly
5. [[05 - Launch and Testing]] - Launch and verify

### Ongoing Management
- [[06 - Data Files Setup]] - Manage users and invite codes
- [[08 - Bot Commands Reference]] - Learn all commands
- [[07 - Troubleshooting]] - When things go wrong

### Advanced Features
- [[09 - Dashboard Guide]] - Enable AI features
- [[10 - API Server Guide]] - Integrate with external systems

---

## ⚡ Quick Links

### Most Important Docs
- **[[01 - Quick Start Guide]]** ← Start here!
- **[[05 - Launch and Testing]]** - Launch procedures
- **[[07 - Troubleshooting]]** - When you need help

### Common Tasks
- **Adding users:** [[06 - Data Files Setup]]
- **Setting permissions:** [[04 - Bot Permissions]]
- **Command reference:** [[08 - Bot Commands Reference]]
- **Fixing errors:** [[07 - Troubleshooting]]

---

## 🔧 System Requirements

### Python Packages
```
discord.py >= 2.3.0
aiohttp >= 3.8.0
flask >= 3.0.0
flask-cors >= 4.0.0
email-validator >= 2.0.0
feedparser >= 6.0.10
```

Install with:
```bash
pip install -r requirements.txt
```

### Operating Systems
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu, Debian, etc.)

---

## 🎓 Documentation Structure

### Setup Phase (Required)
```
01 - Quick Start Guide
  └─ 02 - Discord Developer Setup
      └─ 03 - Configuration Guide
          └─ 04 - Bot Permissions
              └─ 05 - Launch and Testing
                  └─ 06 - Data Files Setup
```

### Reference (As Needed)
```
07 - Troubleshooting (when issues arise)
08 - Bot Commands Reference (command documentation)
```

### Optional Features
```
09 - Dashboard Guide (AI features)
10 - API Server Guide (external integrations)
```

---

## 💡 Key Concepts

### Cohort System
- Users assigned to cohorts: BC1, BC2, BC3
- Maximum 250 members per cohort (configurable)
- **Smart overflow:** BC1 full → BC2, BC2 full → BC3, etc.
- New cohorts created automatically (BC4, BC5...)

### Two Access Methods

**Method 1: Email Verification** (`/buildcrew`)
- Admin maintains `users.txt` with email → cohort mappings
- User enters email via slash command
- Bot assigns appropriate cohort role

**Method 2: Invite Codes** (`/invitecode`)
- Admin creates codes in `invcode.txt` or via API
- User enters code via slash command
- Bot assigns cohort and tracks usage

### Role Hierarchy
```
Server Admins
  ├─ Staff (moderators)
  ├─ Bot Role (must be here or higher)
  ├─ Build Crew (base role)
  ├─ BC1
  ├─ BC2
  └─ BC3
```

**Critical:** Bot role must be **above** Build Crew roles!

---

## 🔒 Security Notes

### Never Share Publicly
- ❌ Bot Token
- ❌ Client Secret
- ❌ API Keys
- ❌ Gemini API Key
- ❌ SMTP Passwords

### Best Practices
- ✅ Keep config.py in .gitignore
- ✅ Regenerate tokens if exposed
- ✅ Use environment variables in production
- ✅ Rotate API keys periodically

---

## 📞 Getting Help

### Step-by-Step
1. **Check [[07 - Troubleshooting]]** - Most issues are documented
2. **Review bot.log** - Check for error messages
3. **Verify config.py** - Ensure all values are correct
4. **Check Discord permissions** - Use `!status` command

### Common Issues
- **Bot won't start:** Check [[07 - Troubleshooting#Bot Won't Start]]
- **Commands not showing:** See [[07 - Troubleshooting#Slash Commands Not Appearing]]
- **Permission errors:** Check [[04 - Bot Permissions]]

---

## 📝 Quick Reference

### Launch Bot
```bash
python main.py
```

### Test Bot (Owner)
```
!status
```

### Reload Commands (Owner)
```
!reload_slash
```

### Check Stats (Staff)
```
/stats
!quickstats
```

---

## 🗺️ Navigation Tips

- **Internal links** are in `[[double brackets]]` - click to navigate
- **Start at the top** for first-time setup
- **Use search** to find specific topics
- **Follow the numbered guides** in order (01 → 10)

---

## 🎉 Ready to Get Started?

**Next:** [[01 - Quick Start Guide]]

This will walk you through:
1. Creating your Discord bot
2. Installing dependencies
3. Configuring the bot
4. Inviting to your server
5. Launching and testing

**Estimated time:** 5-10 minutes

---

## 📄 Documentation Metadata

**Version:** 1.0  
**Last Updated:** November 2024  
**Bot Version:** Build Crew Bot v1.0  
**Created For:** Build Crew Community  

**Tags:** #setup #documentation #discord-bot #build-crew

---

## 🌟 What's Next After Setup?

Once your bot is running:
1. **Add users** to users.txt or generate invite codes
2. **Test verification** with `/buildcrew` and `/invitecode`
3. **Configure optional features** (Dashboard, API)
4. **Train staff** on commands ([[08 - Bot Commands Reference]])
5. **Monitor** with `!status` and `/stats`

---

**Questions?** Start with **[[01 - Quick Start Guide]]** or check **[[07 - Troubleshooting]]**




---
*Created: 05/11/2025, 18:04:50*
