# AGENTS.md - Obsidian MCP Guide for AI Assistants

> **This file explains the Obsidian MCP for AI coding agents and assistants**

## What is This MCP?

The **Obsidian MCP** is a Model Context Protocol server that connects AI assistants (like Amp) to [Obsidian](https://obsidian.md/) vaults, enabling AI-powered note creation, management, and organization.

**Purpose:** Allow AI agents to create, read, update, and organize notes in Obsidian vaults automatically during coding sessions.

**Total Tools:** 61 comprehensive note management tools

---

## Quick Reference

### When to Use This MCP

✅ **Good use cases:**
- User asks to "save this to Obsidian"
- User wants to document code or architecture
- User asks to "create a note about X"
- User wants to save code snippets for later
- User asks to organize or search their notes
- User wants to export documentation
- User requests vault statistics or analytics

❌ **Don't use for:**
- General file operations (use `Read`, `create_file` instead)
- Git operations (use `Bash` tool)
- Code execution or testing

### Most Common Tools

**Create Notes:**
- `save_code_snippet` - Save code with syntax highlighting
- `save_knowledge_note` - Create general notes
- `save_thread_summary` - Archive AI conversations

**Read & Search:**
- `list_notes` - Browse vault
- `read_note` - Get note content
- `search_notes` - Find notes by content/tags

**Export:**
- `export_vault_pdf` - Beautiful PDF with table of contents
- `export_note_pdf` - Single note as PDF

---

## Complete Tool Reference

### 📝 Note Creation (4 tools)

#### save_code_snippet
Save code with metadata, syntax highlighting, and tags.

```javascript
{
  title: "Binary Search Algorithm",
  code: "function binarySearch(arr, target) {...}",
  language: "javascript",
  description: "Efficient search algorithm",
  tags: ["algorithms", "search", "javascript"]
}
```

**When to use:** User shares code they want to save for later reference.

#### save_thread_summary
Archive AI conversation with key insights and code snippets.

```javascript
{
  title: "Implementing Authentication System",
  summary: "Built JWT auth with refresh tokens...",
  key_insights: ["Used httpOnly cookies", "Implemented token rotation"],
  code_snippets: [{ language: "javascript", code: "..." }],
  tags: ["auth", "security"]
}
```

**When to use:** User asks to save the conversation or document what was discussed.

#### save_knowledge_note
Create general documentation or knowledge notes.

```javascript
{
  title: "React Hooks Best Practices",
  content: "## Overview\n\nHooks allow...",
  tags: ["react", "best-practices"]
}
```

**When to use:** User wants to document concepts, patterns, or general information.

#### create_daily_note
Create dated notes for journaling or daily logs.

```javascript
{
  template_content: "## Tasks\n- [ ]\n\n## Notes\n" // optional
}
```

**When to use:** User wants today's daily note or maintains a daily journal.

---

### ✏️ Note Management (5 tools)

#### read_note
Read the full content of a note.

```javascript
{ filename: "my-note.md" }
```

#### update_note
Replace note content (preserves frontmatter by default).

```javascript
{
  filename: "my-note.md",
  content: "# Updated Content\n\nNew text...",
  preserve_metadata: true // default
}
```

#### delete_note
Remove a note from the vault.

```javascript
{ filename: "old-note.md" }
```

#### append_to_note
Add content to the end of an existing note.

```javascript
{
  filename: "project-log.md",
  content: "\n## Update\n\nAdded new feature..."
}
```

#### rename_note
Change a note's filename.

```javascript
{
  old_filename: "draft.md",
  new_filename: "final-version"
}
```

---

### 📁 Organization (4 tools)

#### list_notes
Browse all notes, optionally filtered by tag.

```javascript
{ tag_filter: "python" } // optional
```

**Returns:** Array of notes with filenames, titles, and tags.

#### search_notes
Find notes by content or tags.

```javascript
{
  query: "authentication", // searches content
  tags: ["security", "backend"] // filters by tags
}
```

#### create_folder
Organize notes in directories.

```javascript
{ folder_path: "Projects/WebApp" }
```

#### move_note
Relocate notes between folders.

```javascript
{
  filename: "api-docs.md",
  destination_folder: "Documentation"
}
```

---

### 🏷️ Tag Management (4 tools)

#### add_tags
Add tags to existing notes.

```javascript
{
  filename: "api-guide.md",
  tags: ["tutorial", "api"]
}
```

#### remove_tags
Remove specific tags.

```javascript
{
  filename: "api-guide.md",
  tags: ["draft"]
}
```

#### list_all_tags
Get all unique tags across the vault.

```javascript
{} // no parameters
```

**Returns:** `{ total: 25, tags: ["javascript", "python", ...] }`

#### suggest_tags
AI-powered tag suggestions based on content.

```javascript
{ filename: "my-note.md" }
```

**Returns:** Suggested tags based on content analysis and existing vault tags.

---

### 🏛️ Vault Management (3 tools)

#### create_vault
Create a new vault for organizing notes.

```javascript
{
  name: "ProjectNotes",
  description: "Notes for the XYZ project"
}
```

#### list_vaults
See all available vaults.

#### switch_vault
Change to a different vault.

```javascript
{ name: "ProjectNotes" }
```

**Note:** All subsequent operations use the active vault.

---

### 🔍 Advanced Search (5 tools)

#### search_by_date
Find notes created/modified in date range.

```javascript
{
  start_date: "2025-01-01",
  end_date: "2025-12-31",
  date_type: "created" // or "modified"
}
```

#### find_orphaned_notes
Discover notes with no incoming or outgoing links.

#### find_untagged_notes
Find notes that have no tags.

#### search_regex
Advanced pattern matching.

```javascript
{
  pattern: "TODO:\\s*(.+)",
  case_sensitive: false
}
```

#### search_by_word_count
Filter notes by length.

```javascript
{
  min_words: 100,
  max_words: 500
}
```

---

### ✅ Task Management (5 tools)

#### extract_all_todos
Get all TODO items from across the vault.

```javascript
{ include_completed: false }
```

**Returns:** All `- [ ]` tasks with filename and line number.

#### mark_task_complete
Check off a specific task.

```javascript
{
  filename: "project.md",
  task_text: "Write documentation"
}
```

#### task_statistics
Get completion rates and analytics.

**Returns:** Total pending, completed, completion rate, breakdown by file.

#### create_task_note
Create dedicated task lists.

```javascript
{
  title: "Sprint Tasks",
  tasks: ["Build API", "Write tests", "Deploy"]
}
```

#### tasks_by_tag
Filter tasks from notes with specific tags.

```javascript
{ tag: "urgent" }
```

---

### 📋 Templates (3 tools)

#### create_template
Save reusable note templates.

```javascript
{
  template_name: "meeting-notes",
  content: "# {{title}}\n\nDate: {{date}}\n\n## Notes\n"
}
```

**Placeholders:** `{{title}}`, `{{date}}`, `{{datetime}}`, custom variables

#### apply_template
Create notes from templates.

```javascript
{
  template_name: "meeting-notes",
  filename: "weekly-sync.md",
  variables: { title: "Weekly Team Sync" }
}
```

#### list_templates
View available templates.

---

### 🔗 Link Intelligence (5 tools)

#### find_backlinks
See which notes link to a specific note.

```javascript
{ filename: "architecture.md" }
```

#### suggest_links
AI-powered link recommendations.

```javascript
{ filename: "new-note.md" }
```

**Returns:** Suggested internal links based on content similarity.

#### create_moc
Auto-generate Map of Content from tagged notes.

```javascript
{
  title: "Python Notes MOC",
  tag: "python"
}
```

**Creates:** Index note with links to all notes tagged "python".

#### link_graph
Get network graph data for visualization.

**Returns:** Nodes and links for graph visualization tools.

#### most_connected_notes
Find hub notes with most connections.

```javascript
{ limit: 10 }
```

---

### 📊 Analytics & Content Analysis (6 tools)

#### vault_stats
Comprehensive vault statistics.

**Returns:**
```javascript
{
  total_notes: 150,
  total_words: 45000,
  avg_words_per_note: 300,
  total_links: 423,
  total_tags: 45,
  note_types: { "code-snippet": 30, "knowledge-note": 100 }
}
```

#### broken_links
Find all broken wiki-links.

#### extract_links
Get all internal and external links from a note.

#### word_frequency
Most frequently used words.

```javascript
{
  limit: 20,
  min_length: 4
}
```

#### vault_timeline
Activity timeline.

```javascript
{ granularity: "day" } // or "week", "month"
```

#### note_complexity
Readability analysis.

**Returns:** Word count, sentences, complexity score, etc.

---

### 🎨 Content Extraction (1 tool)

#### extract_code_blocks
Pull all code blocks from a note.

**Returns:** Array of code blocks with language and line count.

---

### 💾 Backup & Safety (2 tools)

#### backup_vault
Create timestamped backup of entire vault.

```javascript
{ backup_name: "pre-refactor-backup" } // optional
```

#### list_backups
View all available backups.

---

### 📤 Import/Export (11 tools)

#### import_markdown_folder
Bulk import markdown files.

```javascript
{
  source_path: "/path/to/markdown/files",
  destination_folder: "Imported" // optional
}
```

#### export_note_pdf ⭐
Export single note as beautiful PDF.

```javascript
{
  filename: "documentation.md",
  output_path: "/path/to/output.pdf" // optional
}
```

**Features:** Professional styling, syntax highlighting, proper typography.

#### export_vault_pdf ⭐⭐⭐
**Flagship export feature!** Export entire vault as single PDF.

```javascript
{
  output_path: "/path/to/vault.pdf", // optional
  include_toc: true,
  organize_by: "folder" // or "tag", "type"
}
```

**Features:**
- Cover page with vault name and date
- Clickable table of contents
- Page numbers (X / Y)
- Each note on separate page
- Metadata displayed (tags, type)
- Professional styling
- Print-ready A4 format

**Perfect for:** Sharing entire documentation set, creating archives, publishing knowledge bases.

#### export_note_markdown
Standalone markdown export.

```javascript
{
  filename: "note.md",
  resolve_links: true // embeds linked content
}
```

#### export_note_plaintext
Clean text export (strips formatting).

#### export_vault_json
Complete vault as JSON database.

```javascript
{ include_content: true }
```

**Use for:** Programmatic access, data analysis, migration.

#### export_vault_csv
Spreadsheet index with metadata.

**Columns:** filename, title, tags, type, word_count, created, modified

**Perfect for:** Excel analysis, sorting, filtering.

#### export_vault_markdown_bundle
Portable vault copy.

**Creates:** Complete folder structure with all markdown files.

---

### 📝 Advanced Note Operations (3 tools)

#### merge_notes
Combine multiple notes into one.

```javascript
{
  filenames: ["intro.md", "details.md", "conclusion.md"],
  output_filename: "complete-guide.md",
  delete_originals: false
}
```

#### duplicate_note
Copy a note.

```javascript
{
  filename: "template.md",
  new_filename: "new-from-template"
}
```

#### archive_note
Move to Archive folder.

```javascript
{ filename: "old-project.md" }
```

---

## Best Practices for AI Agents

### 1. Always Use Descriptive Titles
```javascript
// ✅ Good
title: "JWT Authentication Implementation Guide"

// ❌ Bad
title: "auth stuff"
```

### 2. Tag Appropriately
```javascript
// ✅ Good - specific, searchable
tags: ["authentication", "jwt", "security", "backend"]

// ❌ Bad - too generic
tags: ["code", "stuff"]
```

### 3. Use Structured Content
```javascript
// ✅ Good - organized with headings
content: `## Overview\n\nJWT auth allows...\n\n## Implementation\n\n...`

// ❌ Bad - wall of text
content: "jwt auth allows users to login and..."
```

### 4. Save Thread Summaries Strategically
Save when:
- Complex problem was solved
- Important architecture decisions made
- Multiple approaches were discussed
- User explicitly asks

Don't save:
- Every trivial conversation
- Simple Q&A exchanges

### 5. Leverage Cross-Referencing
When creating notes, mention related concepts:
```javascript
content: `See also: [[related-topic]] and [[another-concept]]`
```

### 6. Use Appropriate Note Types
Set frontmatter `type:` to:
- `code-snippet` - For reusable code
- `knowledge-note` - For documentation
- `thread-summary` - For conversation archives
- `task-list` - For TODO lists
- `daily-note` - For dated entries
- `moc` - For Map of Content indices

---

## Common Workflows

### Workflow 1: Document a Feature Implementation

```javascript
// 1. Save the main code
await save_code_snippet({
  title: "User Authentication Middleware",
  code: "...",
  language: "javascript",
  description: "Express middleware for JWT verification",
  tags: ["auth", "middleware", "express"]
});

// 2. Create documentation
await save_knowledge_note({
  title: "Authentication System Architecture",
  content: "## Overview\n\nOur auth system uses...",
  tags: ["auth", "architecture"]
});

// 3. Save the conversation
await save_thread_summary({
  title: "Building Authentication System",
  summary: "Implemented JWT auth with refresh tokens...",
  key_insights: ["...", "..."],
  tags: ["auth", "implementation"]
});
```

### Workflow 2: Research Session

```javascript
// 1. Create a research note
await save_knowledge_note({
  title: "React Server Components Research",
  content: "...",
  tags: ["react", "research"]
});

// 2. Save useful code examples
await save_code_snippet({
  title: "Server Component Example",
  code: "...",
  language: "typescript",
  tags: ["react", "server-components"]
});

// 3. Create a Map of Content
await create_moc({
  title: "React Learning Path",
  tag: "react"
});
```

### Workflow 3: Project Documentation

```javascript
// 1. Create folder structure
await create_folder({ folder_path: "Projects/MyApp" });
await create_folder({ folder_path: "Projects/MyApp/Architecture" });

// 2. Create notes
await save_knowledge_note({
  title: "MyApp Overview",
  content: "...",
  tags: ["myapp", "overview"]
});

// 3. Move to project folder
await move_note({
  filename: "myapp-overview.md",
  destination_folder: "Projects/MyApp"
});

// 4. Export as PDF for sharing
await export_vault_pdf({
  include_toc: true,
  organize_by: "folder"
});
```

### Workflow 4: Weekly Review

```javascript
// 1. Get vault statistics
const stats = await vault_stats({});

// 2. Extract all TODOs
const todos = await extract_all_todos({ include_completed: false });

// 3. Create weekly summary
await save_knowledge_note({
  title: "Weekly Review - " + new Date().toISOString().split('T')[0],
  content: `## Stats\n${stats.total_notes} notes...\n\n## Pending Tasks\n${todos.total} tasks...`,
  tags: ["weekly-review"]
});
```

---

## Tool Categories & Counts

| Category | Count | Purpose |
|----------|-------|---------|
| Note Creation | 4 | Create new notes and snippets |
| Note Management | 5 | Edit, delete, update notes |
| Organization | 4 | Browse, search, organize |
| Tag Management | 4 | Add, remove, manage tags |
| Vault Management | 3 | Multiple vaults |
| Search & Discovery | 5 | Advanced search capabilities |
| Task Management | 5 | TODO tracking and completion |
| Templates | 3 | Reusable note templates |
| Link Intelligence | 5 | Backlinks, graphs, suggestions |
| Analytics | 6 | Statistics and insights |
| Content Extraction | 1 | Extract code blocks |
| Backup & Safety | 2 | Backup and restore |
| Import/Export | 11 | Multiple format support |
| Advanced Operations | 3 | Merge, duplicate, archive |

**Total: 61 tools**

---

## Export Formats Guide

### For Sharing Documentation

**Best choice:** `export_vault_pdf`
- Creates professional PDF with cover and TOC
- Perfect for sharing complete documentation
- Includes all notes with navigation

**Example:**
```javascript
await export_vault_pdf({
  include_toc: true,
  organize_by: "type"
});
```

### For Data Analysis

**Best choice:** `export_vault_csv`
- Excel/Sheets compatible
- Sortable columns
- Metadata included

### For Migration

**Best choice:** `export_vault_markdown_bundle`
- Preserves folder structure
- All markdown files included
- Ready to import elsewhere

### For Single Documents

**Best choice:** `export_note_pdf`
- Professional formatting
- Syntax highlighting
- Print-ready

---

## Technical Details

### Vault Path
- Configured via `OBSIDIAN_VAULT_PATH` environment variable
- All operations are relative to the active vault
- Can switch vaults with `switch_vault`

### File Naming
- Tools use `sanitizeFilename()` to clean titles
- Replaces special characters with hyphens
- Converts to lowercase
- Example: "My Cool Note!" → "my-cool-note.md"

### Frontmatter
Notes include YAML frontmatter:
```yaml
---
title: Note Title
type: knowledge-note
created: 2025-11-05T12:00:00.000Z
tags: ["tag1", "tag2"]
---
```

### Wiki-Links
Use `[[note-name]]` or `[[note-name|Display Text]]` for internal links.

### Related Notes
The MCP automatically links related notes based on shared tags.

---

## Error Handling

All tools return:
```javascript
{
  content: [{ type: "text", text: "Success message or error" }],
  isError: true // only if error occurred
}
```

**Common errors:**
- File not found → Check filename includes .md extension
- Vault not found → Ensure vault path is correct
- No frontmatter → Some tools require YAML frontmatter

---

## Performance Considerations

### Fast Operations
- `list_notes` - Reads frontmatter only
- `search_notes` - Scans content
- Single note operations

### Slower Operations
- `export_vault_pdf` - Generates PDF for entire vault
- `backup_vault` - Copies all files
- `find_backlinks` - Scans all notes
- `most_connected_notes` - Analyzes all connections

**Tip:** For large vaults (100+ notes), export operations may take 10-30 seconds.

---

## Version Information

**Current Version:** 3.1.0  
**Total Tools:** 61  
**Platform:** Obsidian only  
**Dependencies:** marked, puppeteer, json2csv, dotenv

---

## For Future Development

### Adding New Features
1. Add tool definition in `setupToolHandlers()`
2. Add case in `CallToolRequestSchema` handler
3. Implement method in the class
4. Test thoroughly
5. Update this AGENTS.md file

### Testing Tools
Use `npm test` to verify configuration.

All tools should:
- Include error handling
- Return structured responses
- Support optional parameters gracefully
- Include helpful error messages

---

## Questions & Troubleshooting

### "Vault not found"
- Check `OBSIDIAN_VAULT_PATH` is set in .env
- Ensure path is absolute, not relative
- Use forward slashes on all platforms

### "File not found"
- Filename must include .md extension
- Check active vault with `list_vaults`
- Use `list_notes` to see available files

### "No frontmatter"
- Some tools require YAML frontmatter
- Use `update_note` to add frontmatter
- Or create notes with MCP tools (auto-adds frontmatter)

---

## Summary for AI Agents

**This MCP is your interface to Obsidian.** Use it to:

✅ Create beautifully structured notes  
✅ Save code snippets for later reference  
✅ Document architecture and decisions  
✅ Archive important conversations  
✅ Organize knowledge with tags and links  
✅ Export documentation in multiple formats  
✅ Track tasks and TODOs  
✅ Build interconnected knowledge graphs  

**The user's Obsidian vault becomes an extension of the AI's memory - everything important can be saved, searched, and referenced later.**

---

**Last Updated:** 2025-11-05  
**MCP Version:** 3.1.0  
**Tools:** 61  
**Status:** Production Ready ✅
