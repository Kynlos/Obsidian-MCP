---
title: 10 - API Server Guide
type: knowledge-note
created: 2025-11-05T18:04:06.403Z
tags: ["api", "integration", "endpoints", "automation"]
---

# 10 - API Server Guide

# API Server Guide (Optional)

Complete guide to the standalone API server for external integrations.

---

## Overview

Build Crew Bot includes a **standalone Flask API server** for external integrations.

**Key Features:**
- Generate invite codes programmatically
- Bulk user acceptance workflows
- Email-based invitations
- Usage statistics and monitoring
- RESTful JSON API

**Use cases:**
- Web forms for user registration
- Integration with external systems
- Automated user onboarding
- Custom acceptance workflows

---

## Quick Start

### 1. Configure API Settings

```python
# In config.py

# API Server Settings
API_ENABLED = True                    # Enable API server
API_HOST = "localhost"                # API host
API_PORT = 5000                       # API port
API_KEY = "your_secure_api_key_here"  # CHANGE THIS!

# Optional: Email Settings (for bulk email features)
EMAIL_ENABLED = False                 # Set True to enable email sending
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "your_email@gmail.com"
SMTP_PASSWORD = "your_app_password"
EMAIL_FROM_NAME = "Build Crew"
EMAIL_FROM_ADDRESS = "noreply@buildcrew.com"

# Discord Info (for email templates)
DISCORD_SERVER_NAME = "Build Crew"
DISCORD_SERVER_INVITE = "https://discord.gg/your-invite"
```

### 2. Launch API Server

**Option 1: Standalone (Recommended)**
```bash
python api_server.py
```

**Option 2: Integrated with Bot**
```python
# In main.py, add at the end:
from api_server import run_api_server
import threading

# Start API server in background thread
api_thread = threading.Thread(target=run_api_server, daemon=True)
api_thread.start()
```

### 3. Verify Server is Running

**Test endpoint:**
```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "Build Crew Bot API",
  "timestamp": "2024-11-05T10:30:00.000Z"
}
```

---

## Authentication

All endpoints (except `/health`) require API key authentication.

### Methods to Provide API Key

**Method 1: Header (Recommended)**
```bash
curl http://localhost:5000/list_codes \
  -H "X-API-Key: your_api_key_here"
```

**Method 2: Query Parameter**
```bash
curl http://localhost:5000/list_codes?api_key=your_api_key_here
```

**Method 3: JSON Body**
```bash
curl -X POST http://localhost:5000/add_invite_code \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your_api_key_here", "code": "TEST", "role": "BC1", "max_uses": 1}'
```

### Security Best Practices

- ✅ **Use strong, random API keys**
- ✅ **Keep API_KEY secret**
- ✅ **Use HTTPS in production**
- ✅ **Rotate keys periodically**
- ❌ **Never commit API keys to git**
- ❌ **Don't share API keys publicly**

---

## API Endpoints

### GET /health

**Description:** Health check endpoint (public - no auth required)

**Request:**
```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "Build Crew Bot API",
  "timestamp": "2024-11-05T10:30:00.000Z"
}
```

---

### GET /test_auth

**Description:** Test API key authentication

**Authentication:** Required

**Request:**
```bash
curl http://localhost:5000/test_auth \
  -H "X-API-Key: your_api_key_here"
```

**Response:**
```json
{
  "status": "authenticated",
  "message": "API key is valid!",
  "service": "Build Crew Bot API",
  "timestamp": "2024-11-05T10:30:00.000Z"
}
```

---

### POST /add_invite_code

**Description:** Add a specific invite code to the system

**Authentication:** Required

**Request Body:**
```json
{
  "code": "CUSTOM123",
  "role": "BC1",
  "max_uses": 50
}
```

**Request:**
```bash
curl -X POST http://localhost:5000/add_invite_code \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"code": "CUSTOM123", "role": "BC1", "max_uses": 50}'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Invite code added successfully",
  "code": "CUSTOM123",
  "role": "BC1",
  "max_uses": 50,
  "created_at": "2024-11-05T10:30:00.000Z"
}
```

**Response (Error - Code exists):**
```json
{
  "error": "Code already exists",
  "code": 409
}
```

---

### POST /generate_code

**Description:** Generate a random invite code

**Authentication:** Required

**Request Body:**
```json
{
  "role": "BC1",
  "max_uses": 1,
  "code_length": 16
}
```

**Parameters:**
- `role` (required): BC1, BC2, or BC3
- `max_uses` (optional): 1-10000, default: 1
- `code_length` (optional): 8-64, default: 16

**Request:**
```bash
curl -X POST http://localhost:5000/generate_code \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"role": "BC1", "max_uses": 1, "code_length": 16}'
```

**Response:**
```json
{
  "success": true,
  "message": "Invite code generated successfully",
  "code": "a1b2c3d4e5f6g7h8",
  "role": "BC1",
  "max_uses": 1,
  "created_at": "2024-11-05T10:30:00.000Z"
}
```

---

### GET /list_codes

**Description:** List all invite codes and usage statistics

**Authentication:** Required

**Request:**
```bash
curl http://localhost:5000/list_codes \
  -H "X-API-Key: your_api_key_here"
```

**Response:**
```json
{
  "codes": [
    {
      "code": "WELCOME2024",
      "role": "BC1",
      "max_uses": 100,
      "used_count": 37,
      "remaining": 63,
      "line_number": 1
    },
    {
      "code": "PROMO",
      "role": "BC2",
      "max_uses": 50,
      "used_count": 50,
      "remaining": 0,
      "line_number": 2
    }
  ],
  "total": 2,
  "timestamp": "2024-11-05T10:30:00.000Z"
}
```

---

### GET /stats

**Description:** Get system statistics

**Authentication:** Required

**Request:**
```bash
curl http://localhost:5000/stats \
  -H "X-API-Key: your_api_key_here"
```

**Response:**
```json
{
  "invite_codes": {
    "active": 15,
    "expired": 8,
    "total": 23,
    "total_uses": 347
  },
  "system": {
    "max_role_members": 250,
    "development_mode": true,
    "api_enabled": true
  },
  "timestamp": "2024-11-05T10:30:00.000Z"
}
```

---

### POST /accept_user

**Description:** Accept single user and generate invite code

**Authentication:** Required

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Parameters:**
- `email` (optional): User's email for tracking
- `name` (optional): User's name for tracking

**Request:**
```bash
curl -X POST http://localhost:5000/accept_user \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Acceptance code generated successfully",
  "invite_code": "ACCEPT_a1b2c3d4",
  "role": "BC1",
  "max_uses": 1,
  "instructions": "Use /invitecode in Discord and enter: ACCEPT_a1b2c3d4",
  "email_template": {
    "subject": "Welcome to Build Crew BC1!",
    "body": "Congratulations! You've been accepted...\n\nYour code: ACCEPT_a1b2c3d4"
  },
  "user_info": {
    "email": "user@example.com",
    "name": "John Doe",
    "assigned_cohort": "BC1"
  },
  "created_at": "2024-11-05T10:30:00.000Z"
}
```

---

### POST /bulk_accept

**Description:** Accept multiple users and generate codes

**Authentication:** Required

**Request Body:**
```json
{
  "users": [
    {"email": "user1@example.com", "name": "John Doe", "cohort": "BC1"},
    {"email": "user2@example.com", "name": "Jane Doe", "cohort": "BC2"},
    {"email": "user3@example.com", "name": "Bob Smith", "cohort": "BC1"}
  ]
}
```

**Parameters:**
- `users` (required): Array of user objects
- `email` (optional): User's email
- `name` (optional): User's name
- `cohort` (optional): BC1, BC2, or BC3 (default: BC1)

**Limit:** Maximum 100 users per request

**Request:**
```bash
curl -X POST http://localhost:5000/bulk_accept \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"users": [{"email": "user1@example.com", "name": "John"}]}'
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 3 codes, 0 failed",
  "results": [
    {
      "success": true,
      "invite_code": "ACCEPT_BC1_abc123",
      "role": "BC1",
      "user_email": "user1@example.com",
      "user_name": "John Doe",
      "instructions": "Use /invitecode in Discord and enter: ACCEPT_BC1_abc123"
    }
  ],
  "summary": {
    "total_requested": 3,
    "successful": 3,
    "failed": 0
  },
  "created_at": "2024-11-05T10:30:00.000Z"
}
```

---

### POST /bulk_email_accept

**Description:** Process bulk email list and optionally send acceptance emails

**Authentication:** Required

**Request Body:**
```json
{
  "emails": "john@example.com\njane@company.org\nName <user@domain.com>",
  "send_emails": false
}
```

**Parameters:**
- `emails` (required): Text with emails (various formats supported)
- `send_emails` (optional): true to send emails, false to just generate codes

**Supported email formats:**
```
email@example.com
Name <email@example.com>
email@example.com,Name
```

**Limit:** Maximum 500 emails per request

**Request:**
```bash
curl -X POST http://localhost:5000/bulk_email_accept \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"emails": "user@example.com\njohn@test.org", "send_emails": false}'
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 2 emails",
  "results": [
    {
      "email": "user@example.com",
      "name": "",
      "invite_code": "BULK_abc123xyz",
      "assigned_to": "Auto-assigned to next available cohort",
      "success": true,
      "email_sent": false
    }
  ],
  "summary": {
    "total_processed": 2,
    "codes_generated": 2,
    "emails_sent": 0,
    "email_failures": 0,
    "assignment_method": "Auto-overflow from BC1 to next available cohort",
    "email_sending_enabled": false
  },
  "discord_info": {
    "server_invite": "https://discord.gg/your-invite",
    "server_name": "Build Crew",
    "command_to_use": "/invitecode"
  },
  "created_at": "2024-11-05T10:30:00.000Z"
}
```

---

## Web Interface

### Test Form

**URL:** http://localhost:5000/

**Description:** Interactive web form for testing API endpoints

**Features:**
- Add custom invite codes
- Generate random codes
- List all codes
- View system stats

### API Documentation

**URL:** http://localhost:5000/docs

**Description:** Complete API documentation

---

## Integration Examples

### Python

```python
import requests

API_URL = "http://localhost:5000"
API_KEY = "your_api_key_here"
HEADERS = {"X-API-Key": API_KEY}

# Generate invite code
response = requests.post(
    f"{API_URL}/generate_code",
    headers=HEADERS,
    json={"role": "BC1", "max_uses": 1}
)

data = response.json()
invite_code = data["code"]
print(f"Generated code: {invite_code}")

# Add to email template
email_body = f"""
Welcome to Build Crew!

Your invite code: {invite_code}

Join our Discord: https://discord.gg/buildcrew
Use /invitecode command and enter your code.
"""
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:5000';
const API_KEY = 'your_api_key_here';

async function generateCode() {
  const response = await axios.post(
    `${API_URL}/generate_code`,
    { role: 'BC1', max_uses: 1 },
    { headers: { 'X-API-Key': API_KEY } }
  );
  
  return response.data.code;
}

// Usage
generateCode().then(code => {
  console.log(`Generated code: ${code}`);
});
```

### cURL

```bash
# Generate code
curl -X POST http://localhost:5000/generate_code \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"role": "BC1", "max_uses": 1}'

# Add specific code
curl -X POST http://localhost:5000/add_invite_code \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"code": "WELCOME", "role": "BC1", "max_uses": 100}'

# List codes
curl http://localhost:5000/list_codes \
  -H "X-API-Key: your_api_key_here"
```

---

## Use Case Examples

### Scenario 1: Web Form Registration

**Flow:**
1. User fills out web form
2. Form submits to `/accept_user` endpoint
3. API generates unique code
4. Email sent to user with code
5. User joins Discord and uses `/invitecode`

**Implementation:**
```python
# Backend (Python/Flask)
@app.route('/register', methods=['POST'])
def register_user():
    email = request.form['email']
    name = request.form['name']
    
    # Generate invite code via API
    response = requests.post(
        "http://localhost:5000/accept_user",
        headers={"X-API-Key": API_KEY},
        json={"email": email, "name": name}
    )
    
    code_data = response.json()
    
    # Send email with code
    send_email(
        to=email,
        subject=code_data['email_template']['subject'],
        body=code_data['email_template']['body']
    )
    
    return "Check your email for invite code!"
```

### Scenario 2: Bulk User Import

**Flow:**
1. Admin uploads CSV of users
2. System processes each user
3. Generates unique codes
4. Sends acceptance emails

**Implementation:**
```python
import csv

# Read CSV
with open('users.csv', 'r') as f:
    reader = csv.DictReader(f)
    users = [{"email": row['email'], "name": row['name']} for row in reader]

# Bulk accept (100 at a time)
for i in range(0, len(users), 100):
    batch = users[i:i+100]
    
    response = requests.post(
        "http://localhost:5000/bulk_accept",
        headers={"X-API-Key": API_KEY},
        json={"users": batch}
    )
    
    results = response.json()
    
    # Send emails
    for result in results['results']:
        if result['success']:
            send_email(result['user_email'], result['invite_code'])
```

### Scenario 3: Integration with External System

**Flow:**
1. User completes action in external system
2. System calls API to generate code
3. Code displayed to user
4. User redeems in Discord

**Implementation:**
```python
# When user achieves milestone
def on_user_milestone_complete(user_id):
    user = get_user(user_id)
    
    # Generate code
    response = requests.post(
        "http://localhost:5000/generate_code",
        headers={"X-API-Key": API_KEY},
        json={"role": "BC1", "max_uses": 1, "code_length": 12}
    )
    
    code = response.json()['code']
    
    # Show to user
    notify_user(user_id, f"Congratulations! Your Discord invite code: {code}")
```

---

## Email Integration

### Setup SMTP

```python
# In config.py
EMAIL_ENABLED = True
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "your_email@gmail.com"
SMTP_PASSWORD = "your_app_password"  # Use App Password, not regular password
EMAIL_FROM_NAME = "Build Crew"
EMAIL_FROM_ADDRESS = "noreply@buildcrew.com"

DISCORD_SERVER_NAME = "Build Crew"
DISCORD_SERVER_INVITE = "https://discord.gg/your-invite-link"
```

### Gmail App Password

1. Enable 2FA on Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate app password
4. Use in `SMTP_PASSWORD`

### Send Emails via API

```bash
curl -X POST http://localhost:5000/bulk_email_accept \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": "user@example.com\njohn@test.org",
    "send_emails": true
  }'
```

---

## Monitoring & Logging

### API Logs

API server logs to console and can be redirected to file:

```bash
# Run with logging
python api_server.py > api.log 2>&1
```

### Check API Status

```bash
curl http://localhost:5000/health
curl http://localhost:5000/stats -H "X-API-Key: your_api_key"
```

---

## Production Deployment

### 1. Use HTTPS

**Never use HTTP in production!**

Options:
- Nginx reverse proxy with SSL
- Apache with SSL
- Cloudflare
- AWS ALB

### 2. Secure API Key

```python
# Use environment variable
import os
API_KEY = os.getenv('BUILD_CREW_API_KEY')
```

### 3. Rate Limiting

Add rate limiting to prevent abuse:

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.headers.get('X-API-Key'))

@app.route('/generate_code', methods=['POST'])
@limiter.limit("10 per minute")
def generate_code():
    # ...
```

### 4. CORS Configuration

```python
from flask_cors import CORS

# Restrict to specific origins
CORS(app, origins=["https://yourdomain.com"])
```

---

## Troubleshooting

### Port already in use

```bash
# Change port in config.py
API_PORT = 5001
```

### API server won't start

Check:
- `API_ENABLED = True` in config.py
- Port is not in use
- No firewall blocking

### 401 Unauthorized

Ensure API key is correct:
```bash
curl http://localhost:5000/test_auth -H "X-API-Key: your_api_key"
```

---

## Next Steps

- [[06 - Data Files Setup]] - Understanding invite code format
- [[08 - Bot Commands Reference]] - Bot commands
- [[07 - Troubleshooting]] - Common issues




---
*Created: 05/11/2025, 18:04:06*
