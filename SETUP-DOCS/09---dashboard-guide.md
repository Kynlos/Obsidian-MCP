---
title: 09 - Dashboard Guide
type: knowledge-note
created: 2025-11-05T18:02:49.627Z
tags: ["dashboard", "analytics", "AI", "optional", "gemini"]
---

# 09 - Dashboard Guide

# Dashboard Guide (Optional Feature)

Complete guide to Build Crew Bot's optional AI-powered dashboard features.

---

## Overview

The dashboard provides AI-powered analytics and insights for your Build Crew community.

**Important:** 
- Dashboard is **100% OPTIONAL**
- Bot works perfectly without it
- Requires Google Gemini API key
- Features are embedded in bot cogs

---

## Requirements

### 1. Gemini API Key

**Get your free API key:**
1. Go to https://aistudio.google.com/apikey
2. Click **"Create API Key"**
3. Choose existing Google Cloud project or create new one
4. Copy the API key

**Add to config.py:**
```python
GEMINI_API_KEY = "AIzaSyAbc123..."
```

### 2. Configuration

```python
# In config.py

# Required for dashboard
GEMINI_API_KEY = "your_gemini_api_key_here"

# Optional: Dashboard access control
DASHBOARD_GUILD_ID = 1234567890123456789  # Your server ID
DASHBOARD_ROLE_ID = 9876543210987654321   # Role that can access dashboard
DASHBOARD_SECRET_KEY = "random-secret-string-here"  # For Flask sessions
```

### 3. No Separate Launch Required

Dashboard features run as part of main bot:
```bash
python main.py
```

**That's it!** All AI features are now enabled.

---

## Dashboard Features

### 1. Word Cloud Generation

**Command:** `/wordcloud`

**Description:** Generates visual word cloud from channel messages

**Usage:**
```
/wordcloud channel:#general limit:1000
```

**Parameters:**
- `channel` - Channel to analyze
- `limit` - Number of recent messages (default: 500, max: 2000)

**Output:**
- PNG image of word cloud
- Top keywords highlighted
- Sentiment analysis

**Example:**
```
/wordcloud channel:#build-crew-chat limit:1000

[Generates word cloud showing:]
- Most common words: "build", "project", "help", "code"
- Color-coded by frequency
- Excludes common stop words
```

---

### 2. Conversation Analysis

**Feature:** Automatic analysis of channel activity

**What it does:**
- Analyzes message patterns
- Identifies discussion topics
- Tracks engagement levels
- Detects sentiment trends

**Access:**
```
!conversation_analysis [channel]
```

**Output:**
```
📊 Conversation Analysis - #general
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Activity: High
💬 Messages: 1,247 (last 7 days)
👥 Active Users: 89

🔑 Top Topics:
1. Project collaboration (23%)
2. Technical questions (18%)
3. Resource sharing (15%)

😊 Sentiment: Mostly Positive (87%)

🔥 Peak Hours: 2pm-5pm EST
```

---

### 3. Power User Detection

**Feature:** Identifies most engaged community members

**What it tracks:**
- Message frequency
- Quality of contributions
- Helping others
- Thread participation
- Voice activity

**Access:**
```
!power_users [days]
```

**Output:**
```
⭐ Power Users - Last 30 Days
━━━━━━━━━━━━━━━━━━━━━━━━━━

🥇 @JohnDoe
├─ Messages: 342
├─ Threads Started: 12
├─ Helped Others: 47 times
└─ Voice Hours: 23h

🥈 @JaneDoe
├─ Messages: 287
├─ Threads Started: 8
├─ Helped Others: 31 times
└─ Voice Hours: 15h

🥉 @Developer
├─ Messages: 234
├─ Threads Started: 15
├─ Helped Others: 29 times
└─ Voice Hours: 11h
```

---

### 4. Marketing Intelligence

**Feature:** Analyzes engagement for marketing insights

**What it provides:**
- User acquisition trends
- Engagement metrics
- Retention analysis
- Growth predictions
- Content performance

**Access:**
```
!marketing_insights [period]
```

**Output:**
```
📊 Marketing Intelligence
━━━━━━━━━━━━━━━━━━━━━━

📈 Growth (Last 30 Days)
├─ New Members: +127
├─ Retention: 84%
├─ Active Users: 423/645 (66%)
└─ Projected Growth: +150 next month

💬 Engagement
├─ Messages/Day: 387
├─ Threads/Week: 23
├─ Voice Hours/Week: 145h
└─ Most Active Channel: #build-crew-chat

🎯 Top Acquisition Sources
1. Invite Codes: 73 (57%)
2. Email Verification: 54 (43%)

📅 Best Posting Times
├─ Weekdays: 2pm-5pm EST
└─ Weekends: 10am-2pm EST
```

---

### 5. Daily Digest

**Feature:** Automated daily summary sent to configured channel

**What it includes:**
- Daily message count
- New members
- Top contributors
- Most active channels
- Trending topics

**Configuration:**
```python
# In config.py
DAILY_DIGEST_CHANNEL_ID = 1234567890123456789
DAILY_DIGEST_TIME = "09:00"  # 24-hour format
```

**Example Output:**
```
📰 Daily Digest - November 5, 2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 New Members: 8
💬 Messages: 437
🎙️ Voice Hours: 23h

🔥 Top Contributors
1. @JohnDoe (47 messages)
2. @JaneDoe (31 messages)
3. @Developer (28 messages)

📍 Most Active Channels
1. #build-crew-chat (187 messages)
2. #cohort-1 (94 messages)
3. #help (71 messages)

💡 Trending Topics
- Next.js deployment
- Database optimization
- Project collaboration
```

---

### 6. Stage Monitor

**Feature:** Tracks and analyzes Stage channel activity

**What it monitors:**
- Stage sessions duration
- Speaker participation
- Audience engagement
- Topic discussions

**Access:**
```
!stage_stats [days]
```

**Output:**
```
🎙️ Stage Activity - Last 7 Days
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Sessions: 12
⏱️ Total Time: 34h 15m
👥 Unique Speakers: 23
📢 Avg Audience: 47

🔝 Top Sessions
1. "Building Scalable APIs" - 3h 45m
2. "React Best Practices" - 2h 30m
3. "Career in Tech Q&A" - 2h 15m
```

---

## Setup Instructions

### Minimal Setup (Just Word Cloud)

```python
# In config.py - Only this is required
GEMINI_API_KEY = "your_api_key_here"
```

Restart bot:
```bash
python main.py
```

Test:
```
/wordcloud channel:#general
```

---

### Full Dashboard Setup

```python
# In config.py

# Required
GEMINI_API_KEY = "your_gemini_api_key_here"

# Optional: Access Control
DASHBOARD_GUILD_ID = 1234567890123456789
DASHBOARD_ROLE_ID = 9876543210987654321  # Staff role ID
DASHBOARD_SECRET_KEY = "change-this-random-string"

# Optional: Daily Digest
DAILY_DIGEST_CHANNEL_ID = 1234567890123456789
DAILY_DIGEST_TIME = "09:00"  # 24-hour format

# Optional: Analytics Settings
ANALYTICS_ENABLED = True
ANALYTICS_LOOKBACK_DAYS = 30
```

---

## Dashboard Commands Summary

| Command | Description | Requires Gemini |
|---------|-------------|----------------|
| `/wordcloud` | Generate word cloud | ✅ Yes |
| `!conversation_analysis` | Analyze discussions | ✅ Yes |
| `!power_users` | Top contributors | ✅ Yes |
| `!marketing_insights` | Growth analytics | ✅ Yes |
| `!stage_stats` | Stage activity | ❌ No |

---

## API Rate Limits

### Gemini API Free Tier

- **60 requests per minute**
- **1,500 requests per day**

**If you exceed limits:**
- Error message shown
- Try again in a few minutes
- Consider upgrading to paid tier

**Optimize usage:**
- Don't generate word clouds too frequently
- Set reasonable message limits
- Cache results when possible

---

## Privacy & Data

### What Data is Processed

**For Word Cloud:**
- Channel message content (text only)
- Processed temporarily
- Not stored permanently

**For Analytics:**
- Message counts
- User activity metrics
- Aggregate statistics
- No message content stored

### What's NOT Collected

- ❌ User DMs
- ❌ Private messages
- ❌ Message content (except temporary for word cloud)
- ❌ Personal information

### Gemini API Privacy

- Data sent to Google Gemini API
- Subject to Google's privacy policy
- Read: https://ai.google.dev/gemini-api/terms

---

## Troubleshooting

### "Gemini API key not set"

**Solution:**
```python
# Add to config.py
GEMINI_API_KEY = "your_key_here"
```

### "API rate limit exceeded"

**Solution:**
- Wait a few minutes
- Reduce frequency of requests
- Check daily quota usage

### Word cloud not generating

**Possible causes:**
1. **No messages in channel**
   - Solution: Choose channel with messages
   
2. **Invalid API key**
   - Solution: Verify key in config.py
   
3. **API quota exceeded**
   - Solution: Wait or upgrade plan

### Dashboard commands not appearing

**Solution:**
1. Verify `GEMINI_API_KEY` is set
2. Restart bot: `python main.py`
3. Wait for command sync
4. Check bot.log for errors

---

## Disabling Dashboard

**To disable all AI features:**

```python
# In config.py
GEMINI_API_KEY = ""  # Leave empty
```

**Or remove specific features:**

```python
# Disable daily digest
DAILY_DIGEST_ENABLED = False

# Disable analytics
ANALYTICS_ENABLED = False
```

**Bot will work normally** without dashboard features.

---

## Cost Considerations

### Free Tier (Gemini)

- **Cost: $0/month**
- **Limits:** 60 req/min, 1,500 req/day
- **Best for:** Small to medium servers

### Paid Tier (Gemini)

- **Cost: Pay per use**
- **Limits:** Much higher
- **Best for:** Large active servers

**Typical usage costs:**
- Word cloud: ~$0.001 per generation
- Analytics: ~$0.01 per day
- **Estimated: $5-15/month** for active server

---

## Advanced Configuration

### Custom Analytics Period

```python
# In config.py
ANALYTICS_LOOKBACK_DAYS = 30  # Default: 30 days
MAX_MESSAGES_ANALYZE = 2000   # Default: 500
```

### Word Cloud Customization

```python
# In config.py
WORDCLOUD_MAX_WORDS = 100      # Default: 50
WORDCLOUD_BACKGROUND = "black" # Default: "white"
WORDCLOUD_COLORMAP = "viridis" # Default: "plasma"
```

### Daily Digest Customization

```python
# In config.py
DAILY_DIGEST_ENABLED = True
DAILY_DIGEST_CHANNEL_ID = 1234567890123456789
DAILY_DIGEST_TIME = "09:00"  # 24-hour format
DAILY_DIGEST_TIMEZONE = "America/New_York"
DAILY_DIGEST_INCLUDE_STATS = True
DAILY_DIGEST_INCLUDE_TOP_USERS = True
```

---

## Best Practices

### Frequency

- **Word clouds:** Once per week max
- **Analytics:** Daily or weekly
- **Power users:** Monthly
- **Marketing insights:** Weekly

### Performance

- Limit message analysis to 500-1000
- Run heavy analytics during off-peak hours
- Cache results when possible

### User Privacy

- Announce analytics features to users
- Allow users to opt-out if desired
- Don't share individual user data publicly

---

## Next Steps

- [[08 - Bot Commands Reference]] - All bot commands
- [[10 - API Server Guide]] - API integration
- [[07 - Troubleshooting]] - Common issues




---
*Created: 05/11/2025, 18:02:49*
