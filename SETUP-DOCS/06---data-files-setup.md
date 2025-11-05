---
title: 06 - Data Files Setup
type: knowledge-note
created: 2025-11-05T18:00:00.018Z
tags: ["data-files", "setup", "users", "invite-codes"]
---

# 06 - Data Files Setup

# Data Files Setup

Guide to configuring `users.txt` and `invcode.txt` for Build Crew Bot.

---

## Overview

Build Crew Bot uses two simple text files for data storage:

| File | Purpose | Required |
|------|---------|----------|
| `users.txt` | Email → Cohort mappings | Yes (can be empty) |
| `invcode.txt` | Invite codes with usage tracking | Yes (can be empty) |

Both files must exist, but can be empty at startup.

---

## users.txt

### Purpose

Maps email addresses to cohort roles for the `/buildcrew` command.

When a user submits their email via `/buildcrew`, the bot checks this file.

### Format

```
email@example.com :: BC1
another@email.com :: BC2
user@domain.org :: BC3
```

**Syntax:**
```
email_address :: COHORT_ROLE
```

- `email_address` - User's email (case-insensitive)
- `::`  - Separator (two colons with spaces)
- `COHORT_ROLE` - BC1, BC2, or BC3

### Example File

```
john@example.com :: BC1
sarah@company.org :: BC1
mike@domain.net :: BC2
alice@test.io :: BC3
bob@email.com :: BC1
```

### Creating the File

**Option 1: Manual Creation**

1. Create file: `users.txt` in bot directory
2. Add entries in format above
3. Save file

**Option 2: Empty File (Add Users Later)**

```bash
# Windows
type nul > users.txt

# Linux/Mac
touch users.txt
```

Then add users via Staff commands or manually edit file.

### Adding Users

**Method 1: Edit File Directly**

1. Open `users.txt` in text editor
2. Add line: `newemail@domain.com :: BC1`
3. Save file
4. No bot restart needed (file is read on each use)

**Method 2: Via API (if API server running)**

Use the API endpoints to manage users programmatically.

### Important Notes

- ⚠️ **File is read on each `/buildcrew` use** - changes take effect immediately
- ⚠️ **Email matching is case-insensitive** - `User@Email.com` matches `user@email.com`
- ⚠️ **One email per line**
- ⚠️ **Blank lines are ignored**
- ⚠️ **Lines without `::` are ignored**

### Overflow Behavior

**If a cohort is full (250 members):**

User specified as `BC1` will automatically be assigned to:
- BC2 (if BC1 is full)
- BC3 (if BC1 and BC2 are full)
- BC4, BC5, etc. (new roles created automatically if all cohorts full)

---

## invcode.txt

### Purpose

Stores invite codes for the `/invitecode` command with usage tracking.

### Format

```
CODENAME :: BC1 :: 50 :: 0
WELCOME2024 :: BC2 :: 100 :: 25
PROMO :: BC1 :: 1 :: 1
```

**Syntax:**
```
code :: STARTING_COHORT :: MAX_USES :: USED_COUNT
```

- `code` - The invite code (case-sensitive)
- `STARTING_COHORT` - Starting cohort (BC1, BC2, BC3)
- `MAX_USES` - Maximum number of times code can be used
- `USED_COUNT` - Current usage count (auto-updated by bot)

### Field Explanations

| Field | Description | Example |
|-------|-------------|---------|
| **Code** | Unique identifier users enter | `WELCOME2024` |
| **Starting Cohort** | Initial cohort assignment | `BC1` |
| **Max Uses** | Total allowed uses | `100` |
| **Used Count** | Times code has been used | `37` |

### Example File

```
BUILDCREW50 :: BC1 :: 50 :: 0
WELCOME :: BC1 :: 100 :: 23
EARLYACCESS :: BC2 :: 25 :: 25
PROMO2024 :: BC1 :: 500 :: 147
SINGLEUSE :: BC3 :: 1 :: 0
```

### Creating the File

**Option 1: Manual Creation**

```bash
# Create empty file
type nul > invcode.txt  # Windows
touch invcode.txt       # Linux/Mac

# Or create with initial codes
echo WELCOME2024 :: BC1 :: 100 :: 0 > invcode.txt
```

**Option 2: Via API Server**

If running `api_server.py`, you can generate codes via API.

### Code Types

#### Single-Use Codes

```
ACCEPT_abc123 :: BC1 :: 1 :: 0
```

Best for:
- Individual user acceptance
- Unique invitations
- Controlled access

#### Multi-Use Codes

```
BUILDCREW :: BC1 :: 500 :: 142
```

Best for:
- Public promotions
- Bulk invitations
- Open enrollment periods

#### Bulk Codes

```
BULK_xyz789 :: BC1 :: 1 :: 0
```

Generated via API bulk endpoints for mass user acceptance.

### Smart Assignment & Overflow

**Example:**
```
CODE123 :: BC1 :: 100 :: 0
```

**What happens:**
1. User enters `CODE123`
2. Bot tries to assign to BC1
3. **If BC1 is full (250 members):**
   - Assigns to BC2 instead
4. **If BC2 is also full:**
   - Assigns to BC3
5. **If BC3 is also full:**
   - Creates BC4 role and assigns
6. Code's used count increments: `100 :: 1`

**The starting cohort is just a preference** - actual assignment depends on availability.

### Managing Codes

#### Adding New Code Manually

1. Open `invcode.txt`
2. Add new line:
   ```
   NEWCODE :: BC1 :: 50 :: 0
   ```
3. Save file
4. Code is immediately available (no restart needed)

#### Checking Code Usage

View `invcode.txt` to see usage:

```
WELCOME2024 :: BC1 :: 100 :: 73
```

73 out of 100 uses remaining: **27 uses left**

#### Expiring a Code

Set used count to max uses:

```
EXPIRED :: BC1 :: 100 :: 100
```

Code cannot be used anymore (fully utilized).

#### Resetting a Code

Change used count back to 0:

```
WELCOME :: BC1 :: 100 :: 0
```

Code can be used 100 more times.

---

## File Validation

### users.txt Validation

✅ **Valid:**
```
user@email.com :: BC1
another@test.org :: BC2
```

❌ **Invalid:**
```
useremail.com :: BC1          # Missing @
user@email.com BC1            # Missing ::
user@email.com :: BC9         # Invalid cohort
```

### invcode.txt Validation

✅ **Valid:**
```
CODE :: BC1 :: 50 :: 0
TEST123 :: BC2 :: 1 :: 0
```

❌ **Invalid:**
```
CODE :: BC1 :: 50              # Missing used count
CODE BC1 50 0                  # Missing ::
CODE :: BC9 :: 50 :: 0         # Invalid cohort
CODE :: BC1 :: -5 :: 0         # Negative max uses
CODE :: BC1 :: 10 :: 15        # Used > Max
```

---

## Backup & Recovery

### Backup Files

**Before making major changes:**

```bash
# Windows
copy users.txt users.txt.backup
copy invcode.txt invcode.txt.backup

# Linux/Mac
cp users.txt users.txt.backup
cp invcode.txt invcode.txt.backup
```

### Restore from Backup

```bash
# Windows
copy users.txt.backup users.txt
copy invcode.txt.backup invcode.txt

# Linux/Mac
cp users.txt.backup users.txt
cp invcode.txt.backup invcode.txt
```

### Export/Import

**Export current data:**
```bash
# Create backups with timestamp
copy users.txt users_2024-11-05.txt
copy invcode.txt invcode_2024-11-05.txt
```

**Import data:**

Replace `users.txt` and `invcode.txt` with exported versions.

---

## Common Scenarios

### Scenario 1: New Server Setup

**Empty files - users will use invite codes:**

```bash
# Create empty files
type nul > users.txt
type nul > invcode.txt

# Add initial invite code
echo WELCOME :: BC1 :: 1000 :: 0 >> invcode.txt
```

### Scenario 2: Migrating Users

**You have a list of emails to import:**

```python
# Python script to generate users.txt
emails = ["user1@email.com", "user2@email.com", "user3@email.com"]

with open("users.txt", "w") as f:
    for email in emails:
        f.write(f"{email} :: BC1\n")
```

### Scenario 3: Bulk Invite Generation

**Create 100 single-use codes:**

Use API server's `/generate_code` endpoint or:

```python
import secrets

with open("invcode.txt", "a") as f:
    for i in range(100):
        code = secrets.token_urlsafe(12)
        f.write(f"{code} :: BC1 :: 1 :: 0\n")
```

### Scenario 4: Reset All Usage

**Reset all invite codes to unused:**

```python
# Read file
with open("invcode.txt", "r") as f:
    lines = f.readlines()

# Reset usage to 0
with open("invcode.txt", "w") as f:
    for line in lines:
        if "::" in line:
            parts = line.split(" :: ")
            if len(parts) == 4:
                parts[3] = "0\n"
                f.write(" :: ".join(parts))
```

---

## API Integration

### Using API Server

**Launch API server:**
```bash
python api_server.py
```

**Generate invite codes via API:**
```bash
curl -X POST http://localhost:5000/generate_code \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"role": "BC1", "max_uses": 50}'
```

**Add specific code via API:**
```bash
curl -X POST http://localhost:5000/add_invite_code \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"code": "CUSTOM", "role": "BC1", "max_uses": 100}'
```

**List all codes:**
```bash
curl http://localhost:5000/list_codes \
  -H "X-API-Key: your_api_key"
```

See [[10 - API Server Guide]] for more details.

---

## Monitoring & Analytics

### Check Code Usage

**Staff command in Discord:**
```
!api_status
```

Shows:
- Active codes
- Expired codes
- Total usage

### View All Codes

**Via API:**
```bash
curl http://localhost:5000/list_codes -H "X-API-Key: your_api_key"
```

**Manual check:**

Open `invcode.txt` and review usage counts.

---

## Security Best Practices

### Code Security

- ✅ **Use random codes** for single-use acceptance
- ✅ **Limit max uses** to prevent abuse
- ✅ **Monitor usage** regularly
- ❌ **Don't share codes publicly** unless intended for public use

### File Security

- ✅ **Backup files regularly**
- ✅ **Validate format** before deploying
- ✅ **Test with small batches** first
- ❌ **Don't expose files publicly**

---

## Next Steps

- [[08 - Bot Commands Reference]] - Learn all bot commands
- [[10 - API Server Guide]] - API-based code management
- [[07 - Troubleshooting]] - Solve data file issues




---
*Created: 05/11/2025, 18:00:00*
