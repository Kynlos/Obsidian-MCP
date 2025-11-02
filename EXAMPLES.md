# Obsidian MCP Examples for Amp

Real-world examples of using Amp with Obsidian for note-taking and documentation.

---

## 📝 Basic Operations

### Create a Simple Note

```
You: "Create a note in Obsidian called 'Daily Standup' with today's tasks"

Amp: [creates note]
```

**Result in Obsidian:**
```markdown
# Daily Standup

- Task 1
- Task 2
- Task 3
```

---

### Save a Code Snippet

```
You: "Save this Python function to Obsidian as a code snippet with tags: python, utils"

def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)
```

**Result in Obsidian:**
```markdown
---
tags: [python, utils, code-snippet]
created: 2025-11-02
---

# Calculate Fibonacci

## Code

```python
def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)
```

## Description

Recursive implementation of Fibonacci sequence calculator.
```

---

### Save Thread Summary

```
You: "Save a summary of our conversation about authentication to Obsidian"

Amp: [analyzes thread, creates summary]
```

**Result in Obsidian:**
```markdown
---
tags: [thread-summary, authentication, security]
date: 2025-11-02
---

# Authentication Implementation Discussion

## Summary
Discussion about implementing JWT authentication for the API...

## Key Insights
- Use HTTP-only cookies for token storage
- Implement refresh token rotation
- Add rate limiting on auth endpoints

## Code Snippets
[relevant code from discussion]

## Related Notes
- [[jwt-best-practices]]
- [[api-security]]
```

---

## 🚀 Advanced Use Cases

### 1. Document a New Project

```
You: "I'm starting a new React project. Create a project documentation structure in Obsidian"

Amp creates:
- project-overview.md
- architecture.md
- api-endpoints.md
- component-library.md
- development-setup.md
```

### 2. Learn & Take Notes

```
You: "Explain React hooks and save the explanation to Obsidian with examples"

Amp:
1. Explains React hooks
2. Creates comprehensive note
3. Adds code examples
4. Tags appropriately
```

### 3. Debug Log

```
You: "We just fixed a race condition. Save the problem, solution, and how to prevent it to Obsidian"

Amp creates:
- Problem description
- Root cause analysis
- Solution implemented
- Prevention strategies
- Tagged for future reference
```

### 4. API Documentation

```
You: "Document all the API endpoints in this FastAPI app to Obsidian"

Amp:
1. Scans your API routes
2. Creates endpoint documentation
3. Adds request/response examples
4. Links related endpoints
```

---

## 💼 Professional Workflows

### Workflow: Daily Development Log

**Morning:**
```
You: "Create today's development log in Obsidian"
```

**Throughout the day:**
```
You: "Add to today's log: Fixed bug in user authentication"
You: "Add to today's log: Implemented new dashboard widget"
```

**End of day:**
```
You: "Save a summary of today's work to Obsidian with tags: daily-log, achievements"
```

---

### Workflow: Code Review Notes

**During review:**
```
You: "Create a code review note in Obsidian for PR #123"
```

**Add findings:**
```
You: "Add to the code review note: Security concern in auth.js line 45"
You: "Add suggestion: Refactor database queries to use prepared statements"
```

**Final summary:**
```
You: "Finalize the code review note with verdict: Approved with minor changes"
```

---

### Workflow: Learning New Technology

**Step 1: Initial Research**
```
You: "I'm learning GraphQL. Create a learning roadmap in Obsidian"
```

**Step 2: Take Notes**
```
You: "Save what I learned about GraphQL schemas to Obsidian with examples"
You: "Save this GraphQL resolver pattern to Obsidian"
```

**Step 3: Build Examples**
```
You: "Document this GraphQL API I built to Obsidian"
```

**Step 4: Review**
```
You: "Search my Obsidian notes for GraphQL and create a summary"
```

---

## 🎯 Specialized Use Cases

### Use Case: Meeting Notes

```
You: "Create meeting notes in Obsidian for Sprint Planning 2025-11-02"

[During meeting, tell Amp what to capture]

You: "Add action item: John to review the authentication PR"
You: "Add decision: We're using PostgreSQL for the new service"
You: "Add attendees: John, Sarah, Mike"
```

**Result:**
```markdown
---
tags: [meeting, sprint-planning]
date: 2025-11-02
attendees: [John, Sarah, Mike]
---

# Sprint Planning - Nov 2, 2025

## Action Items
- [ ] John to review authentication PR
- [ ] Sarah to update API documentation

## Decisions
- Using PostgreSQL for new service
- Deploy to staging by Friday

## Notes
[additional notes]
```

---

### Use Case: Troubleshooting Guide

```
You: "Create a troubleshooting guide in Obsidian for common deployment issues we've seen"

Amp:
1. Analyzes past issues
2. Creates structured guide
3. Adds solutions
4. Links to related notes
```

**Result:**
```markdown
# Deployment Troubleshooting Guide

## Issue: Database Migration Fails

**Symptoms:**
- Migration error in logs
- Service won't start

**Solution:**
1. Check database connection
2. Verify migration scripts
3. Run migrations manually

**Related:** [[database-setup]], [[migration-best-practices]]

---

## Issue: Service Not Responding

[...]
```

---

### Use Case: Personal Wiki

```
You: "Create a wiki page in Obsidian about Python asyncio"

[Over time, build it up]

You: "Add to the asyncio wiki: How to handle timeouts"
You: "Add example code to the asyncio wiki for concurrent requests"
You: "Link the asyncio wiki to my FastAPI notes"
```

---

## 🔗 Cross-Referencing Examples

### Automatic Linking

```
You: "Create a note about JWT tokens and link it to my existing authentication notes"

Amp:
1. Creates JWT note
2. Searches for related notes
3. Adds links: [[authentication-patterns]], [[api-security]]
4. Backlinks automatically created
```

### Building Knowledge Graphs

```
You: "I want to build a knowledge graph about microservices. Create connected notes for:
- Service discovery
- API Gateway
- Event sourcing
- CQRS"

Amp:
1. Creates all notes
2. Cross-links related concepts
3. Adds examples and diagrams
```

**Result in Obsidian Graph:**
```
    [API Gateway]
         ↓
  [Service Discovery] ←→ [Event Sourcing]
         ↓                      ↓
      [CQRS] ←──────────────────┘
```

---

## 📊 Templates & Structures

### Template: Project Documentation

```
You: "Use this structure to document my new project in Obsidian:
- Overview
- Tech Stack
- Architecture
- API Endpoints
- Setup Guide
- Deployment"
```

### Template: Bug Report

```
You: "Create a bug report template in Obsidian I can reuse"

Amp creates:
```markdown
---
tags: [bug-report, template]
---

# Bug: [Title]

## Description
[What's broken]

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS:
- Version:
- Browser:

## Solution
[Once fixed]

## Prevention
[How to avoid in future]
```

---

## 🎨 Creative Uses

### Use Case: Idea Journal

```
You: "Save this app idea to my Obsidian idea journal: A CLI tool that..."

Amp:
1. Adds to journal
2. Tags with: idea, cli-tool, unimplemented
3. Links to similar ideas
```

### Use Case: Learning Path

```
You: "Create a learning path in Obsidian for becoming a senior backend engineer"

Amp creates:
1. Roadmap note
2. Topic breakdowns
3. Resource links
4. Practice projects
5. Milestone tracking
```

### Use Case: Tech Stack Comparison

```
You: "Create a comparison table in Obsidian for React vs Vue vs Svelte"

Amp creates:
- Structured comparison
- Pros/cons for each
- Use cases
- Code examples
```

---

## 💡 Pro Tips

### Tip 1: Use Consistent Tags

```
Development: #dev, #code, #project-name
Learning: #learning, #tutorial, #technology-name
Meetings: #meeting, #team-name, #date
Ideas: #idea, #future, #brainstorm
```

### Tip 2: Daily Notes

```
You: "Create my daily note for today in Obsidian"

[Throughout the day]

You: "Add to today's note: Learned about X"
You: "Add to today's note: Fixed bug Y"
```

### Tip 3: Quick Capture

```
You: "Quick note in Obsidian: Remember to update the API docs tomorrow"
```

### Tip 4: Search & Retrieve

```
You: "Search my Obsidian notes for 'authentication' and summarize what I have"
You: "Find my notes about Python async patterns"
You: "What have I documented about GraphQL?"
```

---

## 🎓 Learning Scenarios

### Scenario: Learning a New Framework

**Day 1:**
```
You: "I'm learning Next.js. Create a learning log in Obsidian"
You: "Save my notes about Next.js routing to Obsidian"
```

**Day 2:**
```
You: "Add to Next.js notes: API routes patterns"
You: "Save this Next.js API example to Obsidian"
```

**Day 3:**
```
You: "Search my Next.js notes and create a summary of what I've learned"
```

---

**More examples? Ask Amp to help you explore Obsidian integration!**
