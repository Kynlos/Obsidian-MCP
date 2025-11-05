#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load .env file from the same directory as this script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const VAULTS_BASE_PATH = process.env.OBSIDIAN_VAULT_PATH || __dirname;
let OBSIDIAN_VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(__dirname, "CodeSnippets");

class ObsidianMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "obsidian-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "save_code_snippet",
          description: "Save a code snippet to the Obsidian vault with metadata",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Title for the snippet",
              },
              code: {
                type: "string",
                description: "The code snippet content",
              },
              language: {
                type: "string",
                description: "Programming language (e.g., python, javascript, typescript)",
              },
              description: {
                type: "string",
                description: "Description of what the code does",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Tags for categorization",
              },
            },
            required: ["title", "code", "language"],
          },
        },
        {
          name: "save_thread_summary",
          description: "Save a summary of an AI coding thread to Obsidian",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Title for the thread summary",
              },
              summary: {
                type: "string",
                description: "Summary of the thread discussion",
              },
              key_insights: {
                type: "array",
                items: { type: "string" },
                description: "Key insights from the thread",
              },
              code_snippets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    language: { type: "string" },
                    code: { type: "string" },
                  },
                },
                description: "Code snippets from the thread",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Tags for categorization",
              },
            },
            required: ["title", "summary"],
          },
        },
        {
          name: "save_knowledge_note",
          description: "Save a general knowledge note to Obsidian",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Title for the note",
              },
              content: {
                type: "string",
                description: "Content in Markdown format",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Tags for categorization",
              },
            },
            required: ["title", "content"],
          },
        },
        {
          name: "list_notes",
          description: "List all notes in the Obsidian vault",
          inputSchema: {
            type: "object",
            properties: {
              tag_filter: {
                type: "string",
                description: "Optional tag to filter notes",
              },
            },
          },
        },
        {
          name: "read_note",
          description: "Read the full content of a note from the vault",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename of the note to read (e.g., 'my-note.md')",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "search_notes",
          description: "Search notes by content or tags",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query to match against note content",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Tags to filter by (matches notes with any of these tags)",
              },
            },
          },
        },
        {
          name: "create_vault",
          description: "Create a new vault (folder) for organizing notes",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the vault to create",
              },
              description: {
                type: "string",
                description: "Optional description for the vault",
              },
            },
            required: ["name"],
          },
        },
        {
          name: "list_vaults",
          description: "List all available vaults",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "switch_vault",
          description: "Switch to a different vault",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the vault to switch to",
              },
            },
            required: ["name"],
          },
        },
        {
          name: "update_note",
          description: "Update the content of an existing note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename of the note to update",
              },
              content: {
                type: "string",
                description: "New content for the note",
              },
              preserve_metadata: {
                type: "boolean",
                description: "Keep existing frontmatter (default: true)",
              },
            },
            required: ["filename", "content"],
          },
        },
        {
          name: "delete_note",
          description: "Delete a note from the vault",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename of the note to delete",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "append_to_note",
          description: "Append content to the end of an existing note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename of the note",
              },
              content: {
                type: "string",
                description: "Content to append",
              },
            },
            required: ["filename", "content"],
          },
        },
        {
          name: "create_folder",
          description: "Create a folder in the vault for organizing notes",
          inputSchema: {
            type: "object",
            properties: {
              folder_path: {
                type: "string",
                description: "Path of the folder to create (e.g., 'Projects/MyProject')",
              },
            },
            required: ["folder_path"],
          },
        },
        {
          name: "move_note",
          description: "Move a note to a different folder",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Current filename",
              },
              destination_folder: {
                type: "string",
                description: "Destination folder path",
              },
            },
            required: ["filename", "destination_folder"],
          },
        },
        {
          name: "rename_note",
          description: "Rename a note file",
          inputSchema: {
            type: "object",
            properties: {
              old_filename: {
                type: "string",
                description: "Current filename",
              },
              new_filename: {
                type: "string",
                description: "New filename (without .md extension)",
              },
            },
            required: ["old_filename", "new_filename"],
          },
        },
        {
          name: "add_tags",
          description: "Add tags to an existing note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename of the note",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Tags to add",
              },
            },
            required: ["filename", "tags"],
          },
        },
        {
          name: "remove_tags",
          description: "Remove tags from an existing note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename of the note",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Tags to remove",
              },
            },
            required: ["filename", "tags"],
          },
        },
        {
          name: "list_all_tags",
          description: "Get all unique tags used across the vault",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "find_backlinks",
          description: "Find all notes that link to a specific note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename to find backlinks for",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "create_daily_note",
          description: "Create a daily note with today's date",
          inputSchema: {
            type: "object",
            properties: {
              template_content: {
                type: "string",
                description: "Optional template content for the daily note",
              },
            },
          },
        },
        {
          name: "vault_stats",
          description: "Get statistics about the vault (total notes, tags, etc.)",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "broken_links",
          description: "Find all broken wiki-links in the vault",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "export_note_html",
          description: "Export a note as HTML",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename of the note to export",
              },
              output_path: {
                type: "string",
                description: "Optional output path for HTML file",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "suggest_tags",
          description: "Suggest tags for a note based on its content",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename of the note",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "search_by_date",
          description: "Find notes created or modified within a date range",
          inputSchema: {
            type: "object",
            properties: {
              start_date: {
                type: "string",
                description: "Start date (YYYY-MM-DD)",
              },
              end_date: {
                type: "string",
                description: "End date (YYYY-MM-DD)",
              },
              date_type: {
                type: "string",
                description: "Search by 'created' or 'modified' date",
                enum: ["created", "modified"],
              },
            },
            required: ["start_date", "end_date"],
          },
        },
        {
          name: "find_orphaned_notes",
          description: "Find notes with no incoming or outgoing links",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "find_untagged_notes",
          description: "Find notes that have no tags",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "search_regex",
          description: "Search notes using regular expressions",
          inputSchema: {
            type: "object",
            properties: {
              pattern: {
                type: "string",
                description: "Regular expression pattern",
              },
              case_sensitive: {
                type: "boolean",
                description: "Case sensitive search (default: false)",
              },
            },
            required: ["pattern"],
          },
        },
        {
          name: "search_by_word_count",
          description: "Find notes by word count range",
          inputSchema: {
            type: "object",
            properties: {
              min_words: {
                type: "number",
                description: "Minimum word count",
              },
              max_words: {
                type: "number",
                description: "Maximum word count",
              },
            },
            required: ["min_words", "max_words"],
          },
        },
        {
          name: "extract_all_todos",
          description: "Extract all TODO items from all notes",
          inputSchema: {
            type: "object",
            properties: {
              include_completed: {
                type: "boolean",
                description: "Include completed tasks (default: false)",
              },
            },
          },
        },
        {
          name: "mark_task_complete",
          description: "Mark a task as complete in a note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename containing the task",
              },
              task_text: {
                type: "string",
                description: "The text of the task to mark complete",
              },
            },
            required: ["filename", "task_text"],
          },
        },
        {
          name: "task_statistics",
          description: "Get statistics about tasks across the vault",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "create_task_note",
          description: "Create a dedicated task list note",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Title for the task note",
              },
              tasks: {
                type: "array",
                items: { type: "string" },
                description: "List of tasks",
              },
            },
            required: ["title", "tasks"],
          },
        },
        {
          name: "tasks_by_tag",
          description: "Get all tasks from notes with specific tags",
          inputSchema: {
            type: "object",
            properties: {
              tag: {
                type: "string",
                description: "Tag to filter tasks by",
              },
            },
            required: ["tag"],
          },
        },
        {
          name: "create_template",
          description: "Create a reusable note template",
          inputSchema: {
            type: "object",
            properties: {
              template_name: {
                type: "string",
                description: "Name for the template",
              },
              content: {
                type: "string",
                description: "Template content with placeholders",
              },
            },
            required: ["template_name", "content"],
          },
        },
        {
          name: "apply_template",
          description: "Create a note from a template",
          inputSchema: {
            type: "object",
            properties: {
              template_name: {
                type: "string",
                description: "Name of the template to use",
              },
              filename: {
                type: "string",
                description: "Filename for the new note",
              },
              variables: {
                type: "object",
                description: "Variables to replace in template (e.g., {title: 'My Note'})",
              },
            },
            required: ["template_name", "filename"],
          },
        },
        {
          name: "list_templates",
          description: "List all available templates",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "suggest_links",
          description: "AI-powered suggestions for internal links",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename to suggest links for",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "create_moc",
          description: "Create a Map of Content note from related notes",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Title for the MOC",
              },
              tag: {
                type: "string",
                description: "Tag to gather notes from",
              },
            },
            required: ["title", "tag"],
          },
        },
        {
          name: "link_graph",
          description: "Get graph data of note connections",
          inputSchema: {
            type: "object",
            properties: {
              max_depth: {
                type: "number",
                description: "Maximum depth to traverse (default: 2)",
              },
            },
          },
        },
        {
          name: "most_connected_notes",
          description: "Find notes with the most connections",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Number of notes to return (default: 10)",
              },
            },
          },
        },
        {
          name: "extract_links",
          description: "Extract all links (internal and external) from a note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename to extract links from",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "word_frequency",
          description: "Get most frequently used words across vault",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Number of words to return (default: 20)",
              },
              min_length: {
                type: "number",
                description: "Minimum word length (default: 4)",
              },
            },
          },
        },
        {
          name: "extract_code_blocks",
          description: "Extract all code blocks from a note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename to extract code from",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "vault_timeline",
          description: "Get creation/modification timeline of notes",
          inputSchema: {
            type: "object",
            properties: {
              granularity: {
                type: "string",
                description: "Timeline granularity: 'day', 'week', 'month'",
                enum: ["day", "week", "month"],
              },
            },
          },
        },
        {
          name: "note_complexity",
          description: "Analyze note complexity and readability",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename to analyze",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "backup_vault",
          description: "Create a timestamped backup of the entire vault",
          inputSchema: {
            type: "object",
            properties: {
              backup_name: {
                type: "string",
                description: "Optional name for the backup",
              },
            },
          },
        },
        {
          name: "list_backups",
          description: "List all available vault backups",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "import_markdown_folder",
          description: "Import all markdown files from a folder",
          inputSchema: {
            type: "object",
            properties: {
              source_path: {
                type: "string",
                description: "Path to folder containing markdown files",
              },
              destination_folder: {
                type: "string",
                description: "Optional destination folder in vault",
              },
            },
            required: ["source_path"],
          },
        },
        {
          name: "export_to_pdf",
          description: "Export a note as PDF (requires markdown-pdf)",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename to export",
              },
              output_path: {
                type: "string",
                description: "Optional output path for PDF",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "export_vault_archive",
          description: "Create a ZIP archive of the entire vault",
          inputSchema: {
            type: "object",
            properties: {
              output_path: {
                type: "string",
                description: "Optional path for the ZIP file",
              },
            },
          },
        },
        {
          name: "merge_notes",
          description: "Merge multiple notes into one",
          inputSchema: {
            type: "object",
            properties: {
              filenames: {
                type: "array",
                items: { type: "string" },
                description: "Array of filenames to merge",
              },
              output_filename: {
                type: "string",
                description: "Filename for the merged note",
              },
              delete_originals: {
                type: "boolean",
                description: "Delete original notes after merge (default: false)",
              },
            },
            required: ["filenames", "output_filename"],
          },
        },
        {
          name: "duplicate_note",
          description: "Create a copy of a note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename to duplicate",
              },
              new_filename: {
                type: "string",
                description: "Filename for the duplicate",
              },
            },
            required: ["filename", "new_filename"],
          },
        },
        {
          name: "archive_note",
          description: "Move a note to the archive folder",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename to archive",
              },
            },
            required: ["filename"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "save_code_snippet":
          return await this.saveCodeSnippet(request.params.arguments);
        case "save_thread_summary":
          return await this.saveThreadSummary(request.params.arguments);
        case "save_knowledge_note":
          return await this.saveKnowledgeNote(request.params.arguments);
        case "list_notes":
          return await this.listNotes(request.params.arguments);
        case "read_note":
          return await this.readNote(request.params.arguments);
        case "search_notes":
          return await this.searchNotes(request.params.arguments);
        case "create_vault":
          return await this.createVault(request.params.arguments);
        case "list_vaults":
          return await this.listVaults(request.params.arguments);
        case "switch_vault":
          return await this.switchVault(request.params.arguments);
        case "update_note":
          return await this.updateNote(request.params.arguments);
        case "delete_note":
          return await this.deleteNote(request.params.arguments);
        case "append_to_note":
          return await this.appendToNote(request.params.arguments);
        case "create_folder":
          return await this.createFolder(request.params.arguments);
        case "move_note":
          return await this.moveNote(request.params.arguments);
        case "rename_note":
          return await this.renameNote(request.params.arguments);
        case "add_tags":
          return await this.addTags(request.params.arguments);
        case "remove_tags":
          return await this.removeTags(request.params.arguments);
        case "list_all_tags":
          return await this.listAllTags(request.params.arguments);
        case "find_backlinks":
          return await this.findBacklinks(request.params.arguments);
        case "create_daily_note":
          return await this.createDailyNote(request.params.arguments);
        case "vault_stats":
          return await this.vaultStats(request.params.arguments);
        case "broken_links":
          return await this.brokenLinks(request.params.arguments);
        case "export_note_html":
          return await this.exportNoteHtml(request.params.arguments);
        case "suggest_tags":
          return await this.suggestTags(request.params.arguments);
        case "search_by_date":
          return await this.searchByDate(request.params.arguments);
        case "find_orphaned_notes":
          return await this.findOrphanedNotes(request.params.arguments);
        case "find_untagged_notes":
          return await this.findUntaggedNotes(request.params.arguments);
        case "search_regex":
          return await this.searchRegex(request.params.arguments);
        case "search_by_word_count":
          return await this.searchByWordCount(request.params.arguments);
        case "extract_all_todos":
          return await this.extractAllTodos(request.params.arguments);
        case "mark_task_complete":
          return await this.markTaskComplete(request.params.arguments);
        case "task_statistics":
          return await this.taskStatistics(request.params.arguments);
        case "create_task_note":
          return await this.createTaskNote(request.params.arguments);
        case "tasks_by_tag":
          return await this.tasksByTag(request.params.arguments);
        case "create_template":
          return await this.createTemplate(request.params.arguments);
        case "apply_template":
          return await this.applyTemplate(request.params.arguments);
        case "list_templates":
          return await this.listTemplates(request.params.arguments);
        case "suggest_links":
          return await this.suggestLinks(request.params.arguments);
        case "create_moc":
          return await this.createMoc(request.params.arguments);
        case "link_graph":
          return await this.linkGraph(request.params.arguments);
        case "most_connected_notes":
          return await this.mostConnectedNotes(request.params.arguments);
        case "extract_links":
          return await this.extractLinks(request.params.arguments);
        case "word_frequency":
          return await this.wordFrequency(request.params.arguments);
        case "extract_code_blocks":
          return await this.extractCodeBlocks(request.params.arguments);
        case "vault_timeline":
          return await this.vaultTimeline(request.params.arguments);
        case "note_complexity":
          return await this.noteComplexity(request.params.arguments);
        case "backup_vault":
          return await this.backupVault(request.params.arguments);
        case "list_backups":
          return await this.listBackups(request.params.arguments);
        case "import_markdown_folder":
          return await this.importMarkdownFolder(request.params.arguments);
        case "export_to_pdf":
          return await this.exportToPdf(request.params.arguments);
        case "export_vault_archive":
          return await this.exportVaultArchive(request.params.arguments);
        case "merge_notes":
          return await this.mergeNotes(request.params.arguments);
        case "duplicate_note":
          return await this.duplicateNote(request.params.arguments);
        case "archive_note":
          return await this.archiveNote(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async saveCodeSnippet(args) {
    const { title, code, language, description, tags = [] } = args;
    const timestamp = new Date().toISOString();
    const filename = this.sanitizeFilename(title) + ".md";
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    const relatedNotes = await this.findRelatedNotes(tags, language);

    const content = `---
title: ${title}
type: code-snippet
language: ${language}
created: ${timestamp}
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
---

# ${title}

${description ? `## Description\n\n${description}\n\n` : ""}## Code

\`\`\`${language}
${code}
\`\`\`

## Metadata
- **Language**: ${language}
- **Created**: ${new Date(timestamp).toLocaleString()}
${tags.length > 0 ? `- **Tags**: ${tags.join(", ")}` : ""}

${relatedNotes.length > 0 ? `## Related Notes\n\n${relatedNotes.map(note => `- [[${note.filename.replace('.md', '')}|${note.title}]]`).join('\n')}\n` : ""}
`;

    await fs.writeFile(filepath, content, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: `Successfully saved code snippet to ${filename}${relatedNotes.length > 0 ? ` with ${relatedNotes.length} related note(s) linked` : ""}`,
        },
      ],
    };
  }

  async saveThreadSummary(args) {
    const { title, summary, key_insights = [], code_snippets = [], tags = [] } = args;
    const timestamp = new Date().toISOString();
    const filename = this.sanitizeFilename(title) + ".md";
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    const languages = [...new Set(code_snippets.map(s => s.language).filter(Boolean))];
    const relatedNotes = await this.findRelatedNotes(tags, languages.join(','));

    let content = `---
title: ${title}
type: thread-summary
created: ${timestamp}
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
---

# ${title}

## Summary

${summary}

`;

    if (key_insights.length > 0) {
      content += `## Key Insights\n\n`;
      key_insights.forEach((insight) => {
        content += `- ${insight}\n`;
      });
      content += `\n`;
    }

    if (code_snippets.length > 0) {
      content += `## Code Snippets\n\n`;
      code_snippets.forEach((snippet, idx) => {
        content += `### Snippet ${idx + 1}\n\n\`\`\`${snippet.language || ""}\n${snippet.code}\n\`\`\`\n\n`;
      });
    }

    content += `## Metadata
- **Created**: ${new Date(timestamp).toLocaleString()}
${tags.length > 0 ? `- **Tags**: ${tags.join(", ")}` : ""}

${relatedNotes.length > 0 ? `## Related Notes\n\n${relatedNotes.map(note => `- [[${note.filename.replace('.md', '')}|${note.title}]]`).join('\n')}\n` : ""}
`;

    await fs.writeFile(filepath, content, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: `Successfully saved thread summary to ${filename}${relatedNotes.length > 0 ? ` with ${relatedNotes.length} related note(s) linked` : ""}`,
        },
      ],
    };
  }

  async saveKnowledgeNote(args) {
    const { title, content, tags = [] } = args;
    const timestamp = new Date().toISOString();
    const filename = this.sanitizeFilename(title) + ".md";
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    const relatedNotes = await this.findRelatedNotes(tags, null);

    const noteContent = `---
title: ${title}
type: knowledge-note
created: ${timestamp}
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
---

# ${title}

${content}

${relatedNotes.length > 0 ? `\n## Related Notes\n\n${relatedNotes.map(note => `- [[${note.filename.replace('.md', '')}|${note.title}]]`).join('\n')}\n` : ""}

---
*Created: ${new Date(timestamp).toLocaleString()}*
`;

    await fs.writeFile(filepath, noteContent, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: `Successfully saved knowledge note to ${filename}${relatedNotes.length > 0 ? ` with ${relatedNotes.length} related note(s) linked` : ""}`,
        },
      ],
    };
  }

  async listNotes(args) {
    const { tag_filter } = args || {};
    const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    let notes = [];
    for (const file of mdFiles) {
      const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
      const content = await fs.readFile(filepath, "utf-8");
      
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const titleMatch = frontmatter.match(/title:\s*(.+)/);
        const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
        
        const title = titleMatch ? titleMatch[1] : file;
        const tags = tagsMatch ? tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, "")) : [];

        if (!tag_filter || tags.some((t) => t.includes(tag_filter))) {
          notes.push({
            filename: file,
            title,
            tags,
          });
        }
      } else {
        notes.push({
          filename: file,
          title: file,
          tags: [],
        });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(notes, null, 2),
        },
      ],
    };
  }

  async readNote(args) {
    const { filename } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading note: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async searchNotes(args) {
    const { query, tags } = args || {};
    const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    let results = [];
    for (const file of mdFiles) {
      const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
      const content = await fs.readFile(filepath, "utf-8");

      let matches = false;

      if (tags && tags.length > 0) {
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
          if (tagsMatch) {
            const noteTags = tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
            matches = tags.some((searchTag) => 
              noteTags.some((noteTag) => noteTag.toLowerCase().includes(searchTag.toLowerCase()))
            );
          }
        }
      }

      if (query && content.toLowerCase().includes(query.toLowerCase())) {
        matches = true;
      }

      if (matches || (!query && (!tags || tags.length === 0))) {
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        const titleMatch = frontmatterMatch ? frontmatterMatch[1].match(/title:\s*(.+)/) : null;
        const title = titleMatch ? titleMatch[1] : file;

        const preview = content
          .replace(/^---\n[\s\S]*?\n---/, "")
          .trim()
          .substring(0, 200);

        results.push({
          filename: file,
          title,
          preview: preview + (preview.length >= 200 ? "..." : ""),
        });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: results.length > 0 
            ? JSON.stringify(results, null, 2)
            : "No matching notes found",
        },
      ],
    };
  }

  async createVault(args) {
    const { name, description } = args;
    const vaultPath = path.join(VAULTS_BASE_PATH, name);

    try {
      await fs.mkdir(vaultPath, { recursive: true });

      const welcomeContent = `# Welcome to ${name}

${description ? `${description}\n\n` : ""}This vault was created on ${new Date().toLocaleString()}.

## Getting Started

You can organize your notes with:
- Tags for categorization
- Folders for structure
- Links between notes

Start saving code snippets, thread summaries, and knowledge notes!
`;

      await fs.writeFile(path.join(vaultPath, "Welcome.md"), welcomeContent, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `Successfully created vault "${name}" at ${vaultPath}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating vault: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async listVaults(args) {
    try {
      const entries = await fs.readdir(VAULTS_BASE_PATH, { withFileTypes: true });
      const vaults = entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules")
        .map((entry) => entry.name);

      const currentVault = path.basename(OBSIDIAN_VAULT_PATH);

      const vaultInfo = vaults.map((vault) => ({
        name: vault,
        active: vault === currentVault,
        path: path.join(VAULTS_BASE_PATH, vault),
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(vaultInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing vaults: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async switchVault(args) {
    const { name } = args;
    const vaultPath = path.join(VAULTS_BASE_PATH, name);

    try {
      const stats = await fs.stat(vaultPath);
      if (!stats.isDirectory()) {
        throw new Error(`${name} is not a directory`);
      }

      OBSIDIAN_VAULT_PATH = vaultPath;

      return {
        content: [
          {
            type: "text",
            text: `Switched to vault "${name}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error switching vault: ${error.message}. Vault may not exist.`,
          },
        ],
        isError: true,
      };
    }
  }

  async findRelatedNotes(tags = [], language = null) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md") && f !== "Welcome.md");

      const relatedNotes = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");

        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const titleMatch = frontmatter.match(/title:\s*(.+)/);
          const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
          const languageMatch = frontmatter.match(/language:\s*(.+)/);

          const title = titleMatch ? titleMatch[1] : file;
          const noteTags = tagsMatch
            ? tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""))
            : [];
          const noteLanguage = languageMatch ? languageMatch[1].trim() : null;

          let relevanceScore = 0;

          if (tags.length > 0 && noteTags.length > 0) {
            const matchingTags = tags.filter((tag) =>
              noteTags.some((noteTag) => noteTag.toLowerCase().includes(tag.toLowerCase()))
            );
            relevanceScore += matchingTags.length * 2;
          }

          if (language && noteLanguage && noteLanguage.toLowerCase() === language.toLowerCase()) {
            relevanceScore += 1;
          }

          if (relevanceScore > 0) {
            relatedNotes.push({
              filename: file,
              title,
              relevanceScore,
            });
          }
        }
      }

      return relatedNotes
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);
    } catch (error) {
      console.error("Error finding related notes:", error);
      return [];
    }
  }

  sanitizeFilename(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, "-")
      .replace(/\s+/g, "-")
      .toLowerCase();
  }

  async updateNote(args) {
    const { filename, content, preserve_metadata = true } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      let finalContent = content;

      if (preserve_metadata) {
        const existingContent = await fs.readFile(filepath, "utf-8");
        const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[0];
          finalContent = `${frontmatter}\n\n${content}`;
        }
      }

      await fs.writeFile(filepath, finalContent, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Successfully updated ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error updating note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async deleteNote(args) {
    const { filename } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      await fs.unlink(filepath);
      return {
        content: [{
          type: "text",
          text: `Successfully deleted ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error deleting note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async appendToNote(args) {
    const { filename, content } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const existingContent = await fs.readFile(filepath, "utf-8");
      const newContent = existingContent + "\n\n" + content;
      await fs.writeFile(filepath, newContent, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Successfully appended content to ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error appending to note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createFolder(args) {
    const { folder_path } = args;
    const fullPath = path.join(OBSIDIAN_VAULT_PATH, folder_path);

    try {
      await fs.mkdir(fullPath, { recursive: true });
      return {
        content: [{
          type: "text",
          text: `Successfully created folder: ${folder_path}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating folder: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async moveNote(args) {
    const { filename, destination_folder } = args;
    const sourcePath = path.join(OBSIDIAN_VAULT_PATH, filename);
    const destFolder = path.join(OBSIDIAN_VAULT_PATH, destination_folder);
    const destPath = path.join(destFolder, filename);

    try {
      await fs.mkdir(destFolder, { recursive: true });
      await fs.rename(sourcePath, destPath);
      
      return {
        content: [{
          type: "text",
          text: `Successfully moved ${filename} to ${destination_folder}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error moving note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async renameNote(args) {
    const { old_filename, new_filename } = args;
    const oldPath = path.join(OBSIDIAN_VAULT_PATH, old_filename);
    const newFilename = new_filename.endsWith('.md') ? new_filename : `${new_filename}.md`;
    const newPath = path.join(OBSIDIAN_VAULT_PATH, newFilename);

    try {
      await fs.rename(oldPath, newPath);
      
      return {
        content: [{
          type: "text",
          text: `Successfully renamed ${old_filename} to ${newFilename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error renaming note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async addTags(args) {
    const { filename, tags } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      if (!frontmatterMatch) {
        return {
          content: [{
            type: "text",
            text: `Note ${filename} has no frontmatter. Cannot add tags.`,
          }],
          isError: true,
        };
      }

      const frontmatter = frontmatterMatch[1];
      const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
      
      let existingTags = [];
      if (tagsMatch) {
        existingTags = tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
      }

      const newTags = [...new Set([...existingTags, ...tags])];
      const tagsString = newTags.map((t) => `"${t}"`).join(", ");
      
      let newFrontmatter;
      if (tagsMatch) {
        newFrontmatter = frontmatter.replace(/tags:\s*\[.*?\]/, `tags: [${tagsString}]`);
      } else {
        newFrontmatter = frontmatter + `\ntags: [${tagsString}]`;
      }

      const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFrontmatter}\n---`);
      await fs.writeFile(filepath, newContent, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Successfully added tags to ${filename}: ${tags.join(", ")}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error adding tags: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async removeTags(args) {
    const { filename, tags } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      if (!frontmatterMatch) {
        return {
          content: [{
            type: "text",
            text: `Note ${filename} has no frontmatter.`,
          }],
          isError: true,
        };
      }

      const frontmatter = frontmatterMatch[1];
      const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
      
      if (!tagsMatch) {
        return {
          content: [{
            type: "text",
            text: `Note ${filename} has no tags to remove.`,
          }],
        };
      }

      const existingTags = tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
      const remainingTags = existingTags.filter(t => !tags.includes(t));
      const tagsString = remainingTags.map((t) => `"${t}"`).join(", ");
      
      const newFrontmatter = frontmatter.replace(/tags:\s*\[.*?\]/, `tags: [${tagsString}]`);
      const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFrontmatter}\n---`);
      await fs.writeFile(filepath, newContent, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Successfully removed tags from ${filename}: ${tags.join(", ")}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error removing tags: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async listAllTags(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const allTags = new Set();

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
          const tagsMatch = frontmatterMatch[1].match(/tags:\s*\[(.*?)\]/);
          if (tagsMatch) {
            const tags = tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
            tags.forEach(tag => allTags.add(tag));
          }
        }
      }

      const sortedTags = Array.from(allTags).sort();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ 
            total: sortedTags.length,
            tags: sortedTags 
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing tags: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async findBacklinks(args) {
    const { filename } = args;
    const noteName = filename.replace('.md', '');
    const backlinks = [];

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md") && f !== filename);

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        
        const linkPattern = new RegExp(`\\[\\[${noteName}[\\]|]`, 'g');
        if (linkPattern.test(content)) {
          const matches = content.match(linkPattern);
          backlinks.push({
            filename: file,
            occurrences: matches.length,
          });
        }
      }

      return {
        content: [{
          type: "text",
          text: backlinks.length > 0 
            ? JSON.stringify({ 
                note: filename,
                backlinks: backlinks,
                total: backlinks.length 
              }, null, 2)
            : `No backlinks found for ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding backlinks: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createDailyNote(args) {
    const { template_content } = args || {};
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const filename = `${dateStr}.md`;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const exists = await fs.access(filepath).then(() => true).catch(() => false);
      if (exists) {
        return {
          content: [{
            type: "text",
            text: `Daily note for ${dateStr} already exists`,
          }],
        };
      }

      const content = template_content || `---
title: Daily Note ${dateStr}
type: daily-note
created: ${today.toISOString()}
tags: ["daily"]
---

# ${dateStr}

## Tasks
- [ ] 

## Notes


## Summary

`;

      await fs.writeFile(filepath, content, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Successfully created daily note: ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating daily note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async vaultStats(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      
      let totalWords = 0;
      let totalLinks = 0;
      const allTags = new Set();
      const noteTypes = {};

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        
        const words = content.split(/\s+/).length;
        totalWords += words;
        
        const links = content.match(/\[\[.*?\]\]/g) || [];
        totalLinks += links.length;
        
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          
          const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
          if (tagsMatch) {
            const tags = tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
            tags.forEach(tag => allTags.add(tag));
          }
          
          const typeMatch = frontmatter.match(/type:\s*(.+)/);
          if (typeMatch) {
            const type = typeMatch[1].trim();
            noteTypes[type] = (noteTypes[type] || 0) + 1;
          }
        }
      }

      const stats = {
        total_notes: mdFiles.length,
        total_words: totalWords,
        avg_words_per_note: Math.round(totalWords / mdFiles.length),
        total_links: totalLinks,
        total_tags: allTags.size,
        note_types: noteTypes,
        vault_path: OBSIDIAN_VAULT_PATH,
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(stats, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting vault stats: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async brokenLinks(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const noteNames = new Set(mdFiles.map(f => f.replace('.md', '')));
      const brokenLinks = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        
        const links = content.match(/\[\[(.*?)\]\]/g) || [];
        
        for (const link of links) {
          const linkName = link.slice(2, -2).split('|')[0].trim();
          if (!noteNames.has(linkName)) {
            brokenLinks.push({
              in_file: file,
              broken_link: linkName,
              full_syntax: link,
            });
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: brokenLinks.length > 0
            ? JSON.stringify({ 
                total_broken: brokenLinks.length,
                broken_links: brokenLinks 
              }, null, 2)
            : "No broken links found!",
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding broken links: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async exportNoteHtml(args) {
    const { filename, output_path } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      
      let bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      
      bodyContent = bodyContent
        .replace(/\[\[(.*?)\|(.*?)\]\]/g, '<a href="#$1">$2</a>')
        .replace(/\[\[(.*?)\]\]/g, '<a href="#$1">$1</a>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/\n/g, '<br>\n');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename.replace('.md', '')}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3 { margin-top: 24px; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
${bodyContent}
</body>
</html>`;

      const outputFile = output_path || filepath.replace('.md', '.html');
      await fs.writeFile(outputFile, html, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Successfully exported ${filename} to ${outputFile}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error exporting to HTML: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async suggestTags(args) {
    const { filename } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '').toLowerCase();
      
      const allFiles = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = allFiles.filter((f) => f.endsWith(".md"));
      const existingTags = new Set();

      for (const file of mdFiles) {
        const fp = path.join(OBSIDIAN_VAULT_PATH, file);
        const fc = await fs.readFile(fp, "utf-8");
        const fm = fc.match(/^---\n([\s\S]*?)\n---/);
        if (fm) {
          const tm = fm[1].match(/tags:\s*\[(.*?)\]/);
          if (tm) {
            const tags = tm[1].split(",").map((t) => t.trim().replace(/"/g, ""));
            tags.forEach(tag => existingTags.add(tag));
          }
        }
      }

      const suggestions = [];
      for (const tag of existingTags) {
        if (bodyContent.includes(tag.toLowerCase())) {
          suggestions.push(tag);
        }
      }

      const keywords = bodyContent.match(/\b[a-z]{4,}\b/g) || [];
      const wordFreq = {};
      keywords.forEach(word => {
        if (!['that', 'this', 'with', 'from', 'have', 'been', 'were', 'will'].includes(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });

      const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word)
        .filter(word => !suggestions.includes(word));

      const allSuggestions = [...suggestions, ...topWords];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            filename: filename,
            suggested_tags: allSuggestions.slice(0, 10),
            existing_tag_matches: suggestions.length,
            new_suggestions: topWords.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error suggesting tags: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async searchByDate(args) {
    const { start_date, end_date, date_type = "created" } = args;
    
    try {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const results = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const stats = await fs.stat(filepath);
        const content = await fs.readFile(filepath, "utf-8");
        
        let dateToCheck;
        if (date_type === "created") {
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (frontmatterMatch) {
            const createdMatch = frontmatterMatch[1].match(/created:\s*(.+)/);
            dateToCheck = createdMatch ? new Date(createdMatch[1]) : stats.birthtime;
          } else {
            dateToCheck = stats.birthtime;
          }
        } else {
          dateToCheck = stats.mtime;
        }

        if (dateToCheck >= startDate && dateToCheck <= endDate) {
          results.push({
            filename: file,
            date: dateToCheck.toISOString(),
          });
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            results: results,
            total: results.length,
            date_range: `${start_date} to ${end_date}`,
            type: date_type,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching by date: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async findOrphanedNotes(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md") && f !== "Welcome.md");
      const noteNames = new Set(mdFiles.map(f => f.replace('.md', '')));
      const orphans = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const noteName = file.replace('.md', '');
        
        const outgoingLinks = content.match(/\[\[(.*?)\]\]/g) || [];
        
        let hasIncomingLinks = false;
        for (const otherFile of mdFiles) {
          if (otherFile === file) continue;
          const otherPath = path.join(OBSIDIAN_VAULT_PATH, otherFile);
          const otherContent = await fs.readFile(otherPath, "utf-8");
          if (otherContent.includes(`[[${noteName}`)) {
            hasIncomingLinks = true;
            break;
          }
        }

        if (outgoingLinks.length === 0 && !hasIncomingLinks) {
          orphans.push(file);
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            orphaned_notes: orphans,
            total: orphans.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding orphaned notes: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async findUntaggedNotes(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const untagged = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (!frontmatterMatch) {
          untagged.push(file);
          continue;
        }

        const tagsMatch = frontmatterMatch[1].match(/tags:\s*\[(.*?)\]/);
        if (!tagsMatch || tagsMatch[1].trim() === '') {
          untagged.push(file);
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            untagged_notes: untagged,
            total: untagged.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding untagged notes: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async searchRegex(args) {
    const { pattern, case_sensitive = false } = args;
    
    try {
      const regex = new RegExp(pattern, case_sensitive ? 'g' : 'gi');
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const results = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const matches = content.match(regex);
        
        if (matches && matches.length > 0) {
          results.push({
            filename: file,
            matches: matches.length,
            unique_matches: [...new Set(matches)],
          });
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            pattern: pattern,
            results: results,
            total_files: results.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching with regex: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async searchByWordCount(args) {
    const { min_words, max_words } = args;
    
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const results = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const wordCount = content.split(/\s+/).length;
        
        if (wordCount >= min_words && wordCount <= max_words) {
          results.push({
            filename: file,
            word_count: wordCount,
          });
        }
      }

      results.sort((a, b) => b.word_count - a.word_count);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            range: `${min_words}-${max_words} words`,
            results: results,
            total: results.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching by word count: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async extractAllTodos(args) {
    const { include_completed = false } = args || {};
    
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const todos = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          const unchecked = line.match(/^[-*]\s+\[ \]\s+(.+)/);
          const checked = line.match(/^[-*]\s+\[x\]\s+(.+)/i);
          
          if (unchecked) {
            todos.push({
              filename: file,
              line: index + 1,
              task: unchecked[1],
              completed: false,
            });
          } else if (checked && include_completed) {
            todos.push({
              filename: file,
              line: index + 1,
              task: checked[1],
              completed: true,
            });
          }
        });
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            todos: todos,
            total: todos.length,
            pending: todos.filter(t => !t.completed).length,
            completed: todos.filter(t => t.completed).length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error extracting todos: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async markTaskComplete(args) {
    const { filename, task_text } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      const updatedContent = content.replace(
        new RegExp(`^([-*]\\s+)\\[ \\]\\s+${task_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'),
        `$1[x] ${task_text}`
      );

      if (content === updatedContent) {
        return {
          content: [{
            type: "text",
            text: `Task not found: "${task_text}"`,
          }],
          isError: true,
        };
      }

      await fs.writeFile(filepath, updatedContent, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Marked task complete in ${filename}: "${task_text}"`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error marking task complete: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async taskStatistics(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      let totalPending = 0;
      let totalCompleted = 0;
      const tasksByFile = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const pending = (content.match(/^[-*]\s+\[ \]/gm) || []).length;
        const completed = (content.match(/^[-*]\s+\[x\]/gim) || []).length;
        
        if (pending + completed > 0) {
          tasksByFile.push({
            filename: file,
            pending: pending,
            completed: completed,
            total: pending + completed,
          });
          totalPending += pending;
          totalCompleted += completed;
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            total_pending: totalPending,
            total_completed: totalCompleted,
            total_tasks: totalPending + totalCompleted,
            completion_rate: totalPending + totalCompleted > 0 
              ? Math.round((totalCompleted / (totalPending + totalCompleted)) * 100) + '%'
              : '0%',
            by_file: tasksByFile,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting task statistics: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createTaskNote(args) {
    const { title, tasks } = args;
    const filename = this.sanitizeFilename(title) + ".md";
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);
    const timestamp = new Date().toISOString();

    const taskList = tasks.map(task => `- [ ] ${task}`).join('\n');
    
    const content = `---
title: ${title}
type: task-list
created: ${timestamp}
tags: ["tasks"]
---

# ${title}

${taskList}

---
*Created: ${new Date(timestamp).toLocaleString()}*
`;

    try {
      await fs.writeFile(filepath, content, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Created task note: ${filename} with ${tasks.length} tasks`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating task note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async tasksByTag(args) {
    const { tag } = args;
    
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const todos = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          const tagsMatch = frontmatterMatch[1].match(/tags:\s*\[(.*?)\]/);
          if (tagsMatch) {
            const noteTags = tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
            if (noteTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
              const lines = content.split('\n');
              lines.forEach((line, index) => {
                const unchecked = line.match(/^[-*]\s+\[ \]\s+(.+)/);
                const checked = line.match(/^[-*]\s+\[x\]\s+(.+)/i);
                
                if (unchecked || checked) {
                  todos.push({
                    filename: file,
                    line: index + 1,
                    task: (unchecked || checked)[1],
                    completed: !!checked,
                  });
                }
              });
            }
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            tag: tag,
            tasks: todos,
            total: todos.length,
            pending: todos.filter(t => !t.completed).length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting tasks by tag: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createTemplate(args) {
    const { template_name, content } = args;
    const templateDir = path.join(OBSIDIAN_VAULT_PATH, '.templates');
    const filepath = path.join(templateDir, `${this.sanitizeFilename(template_name)}.template.md`);

    try {
      await fs.mkdir(templateDir, { recursive: true });
      await fs.writeFile(filepath, content, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Created template: ${template_name}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating template: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async applyTemplate(args) {
    const { template_name, filename, variables = {} } = args;
    const templateDir = path.join(OBSIDIAN_VAULT_PATH, '.templates');
    const templatePath = path.join(templateDir, `${this.sanitizeFilename(template_name)}.template.md`);
    const outputPath = path.join(OBSIDIAN_VAULT_PATH, filename.endsWith('.md') ? filename : `${filename}.md`);

    try {
      let content = await fs.readFile(templatePath, "utf-8");
      
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
      });

      content = content.replace(/{{date}}/g, new Date().toISOString().split('T')[0]);
      content = content.replace(/{{datetime}}/g, new Date().toISOString());

      await fs.writeFile(outputPath, content, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Created note from template: ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error applying template: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async listTemplates(args) {
    const templateDir = path.join(OBSIDIAN_VAULT_PATH, '.templates');

    try {
      const exists = await fs.access(templateDir).then(() => true).catch(() => false);
      if (!exists) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ templates: [], total: 0 }, null, 2),
          }],
        };
      }

      const files = await fs.readdir(templateDir);
      const templates = files
        .filter(f => f.endsWith('.template.md'))
        .map(f => f.replace('.template.md', ''));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ templates: templates, total: templates.length }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing templates: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async suggestLinks(args) {
    const { filename } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '').toLowerCase();
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md") && f !== filename);
      const suggestions = [];

      for (const file of mdFiles) {
        const noteName = file.replace('.md', '');
        if (bodyContent.includes(noteName.toLowerCase()) && !content.includes(`[[${noteName}`)) {
          const otherPath = path.join(OBSIDIAN_VAULT_PATH, file);
          const otherContent = await fs.readFile(otherPath, "utf-8");
          const otherWords = new Set(otherContent.toLowerCase().split(/\s+/));
          const thisWords = new Set(bodyContent.split(/\s+/));
          const commonWords = [...thisWords].filter(w => otherWords.has(w) && w.length > 4).length;
          
          suggestions.push({
            note: noteName,
            reason: `Name appears in text`,
            similarity: commonWords,
          });
        }
      }

      suggestions.sort((a, b) => b.similarity - a.similarity);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            filename: filename,
            suggestions: suggestions.slice(0, 10),
            total: suggestions.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error suggesting links: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createMoc(args) {
    const { title, tag } = args;
    const filename = this.sanitizeFilename(title) + ".md";
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const relatedNotes = [];

      for (const file of mdFiles) {
        const filePath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filePath, "utf-8");
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
          const tagsMatch = frontmatterMatch[1].match(/tags:\s*\[(.*?)\]/);
          if (tagsMatch) {
            const noteTags = tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
            if (noteTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
              const titleMatch = frontmatterMatch[1].match(/title:\s*(.+)/);
              relatedNotes.push({
                filename: file,
                title: titleMatch ? titleMatch[1] : file.replace('.md', ''),
              });
            }
          }
        }
      }

      const noteLinks = relatedNotes.map(note => `- [[${note.filename.replace('.md', '')}|${note.title}]]`).join('\n');
      
      const content = `---
title: ${title}
type: moc
created: ${new Date().toISOString()}
tags: ["${tag}", "moc"]
---

# ${title}

> A Map of Content for notes tagged with #${tag}

## Notes (${relatedNotes.length})

${noteLinks}

---
*This MOC was auto-generated on ${new Date().toLocaleString()}*
`;

      await fs.writeFile(filepath, content, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Created MOC: ${filename} with ${relatedNotes.length} linked notes`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating MOC: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async linkGraph(args) {
    const { max_depth = 2 } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const graph = { nodes: [], links: [] };

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const noteName = file.replace('.md', '');
        
        graph.nodes.push({ id: noteName, label: noteName });
        
        const links = content.match(/\[\[(.*?)\]\]/g) || [];
        links.forEach(link => {
          const target = link.slice(2, -2).split('|')[0];
          graph.links.push({ source: noteName, target: target });
        });
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            graph: graph,
            nodes_count: graph.nodes.length,
            links_count: graph.links.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error generating link graph: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async mostConnectedNotes(args) {
    const { limit = 10 } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const connections = new Map();

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const noteName = file.replace('.md', '');
        
        const outgoing = (content.match(/\[\[.*?\]\]/g) || []).length;
        
        let incoming = 0;
        for (const otherFile of mdFiles) {
          if (otherFile === file) continue;
          const otherPath = path.join(OBSIDIAN_VAULT_PATH, otherFile);
          const otherContent = await fs.readFile(otherPath, "utf-8");
          if (otherContent.includes(`[[${noteName}`)) {
            incoming++;
          }
        }

        connections.set(noteName, {
          filename: file,
          outgoing: outgoing,
          incoming: incoming,
          total: outgoing + incoming,
        });
      }

      const sorted = Array.from(connections.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            most_connected: sorted,
            total: sorted.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding most connected notes: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async extractLinks(args) {
    const { filename } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      
      const wikiLinks = content.match(/\[\[(.*?)\]\]/g) || [];
      const internalLinks = wikiLinks.map(link => {
        const parts = link.slice(2, -2).split('|');
        return {
          target: parts[0],
          display: parts[1] || parts[0],
        };
      });

      const externalLinks = content.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g) || [];
      const external = externalLinks.map(link => {
        const match = link.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
        return {
          text: match[1],
          url: match[2],
        };
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            filename: filename,
            internal_links: internalLinks,
            external_links: external,
            total_internal: internalLinks.length,
            total_external: external.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error extracting links: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async wordFrequency(args) {
    const { limit = 20, min_length = 4 } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const wordCounts = {};
      const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'were', 'will', 'your', 'there', 'their', 'what', 'when', 'where', 'which', 'while', 'would', 'could', 'should']);

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
        const words = bodyContent.toLowerCase().match(/\b[a-z]+\b/g) || [];
        
        words.forEach(word => {
          if (word.length >= min_length && !stopWords.has(word)) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
          }
        });
      }

      const sorted = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word, count]) => ({ word, count }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            top_words: sorted,
            total_unique_words: Object.keys(wordCounts).length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error calculating word frequency: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async extractCodeBlocks(args) {
    const { filename } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      const codeBlocks = [];
      const regex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;

      while ((match = regex.exec(content)) !== null) {
        codeBlocks.push({
          language: match[1] || 'unknown',
          code: match[2].trim(),
          length: match[2].trim().split('\n').length,
        });
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            filename: filename,
            code_blocks: codeBlocks,
            total: codeBlocks.length,
            by_language: codeBlocks.reduce((acc, block) => {
              acc[block.language] = (acc[block.language] || 0) + 1;
              return acc;
            }, {}),
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error extracting code blocks: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async vaultTimeline(args) {
    const { granularity = 'day' } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const timeline = {};

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
          const createdMatch = frontmatterMatch[1].match(/created:\s*(.+)/);
          if (createdMatch) {
            const date = new Date(createdMatch[1]);
            let key;
            
            if (granularity === 'month') {
              key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else if (granularity === 'week') {
              const week = Math.ceil((date.getDate()) / 7);
              key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${week}`;
            } else {
              key = date.toISOString().split('T')[0];
            }
            
            timeline[key] = (timeline[key] || 0) + 1;
          }
        }
      }

      const sorted = Object.entries(timeline)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, notes_created: count }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            granularity: granularity,
            timeline: sorted,
            total_periods: sorted.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error generating timeline: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async noteComplexity(args) {
    const { filename } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      
      const sentences = bodyContent.split(/[.!?]+/).length;
      const words = bodyContent.split(/\s+/).length;
      const avgWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0;
      const longWords = (bodyContent.match(/\b\w{7,}\b/g) || []).length;
      const links = (bodyContent.match(/\[\[.*?\]\]/g) || []).length;
      const headings = (bodyContent.match(/^#+\s/gm) || []).length;
      const codeBlocks = (bodyContent.match(/```/g) || []).length / 2;

      let complexity = 'simple';
      if (avgWordsPerSentence > 20 || longWords / words > 0.3) complexity = 'complex';
      else if (avgWordsPerSentence > 15 || longWords / words > 0.2) complexity = 'moderate';

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            filename: filename,
            words: words,
            sentences: sentences,
            avg_words_per_sentence: avgWordsPerSentence,
            long_words: longWords,
            headings: headings,
            links: links,
            code_blocks: codeBlocks,
            complexity: complexity,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error analyzing complexity: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async backupVault(args) {
    const { backup_name } = args || {};
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups');
    const backupPath = path.join(backupDir, backup_name || `backup-${timestamp}`);

    try {
      await fs.mkdir(backupDir, { recursive: true });
      await fs.mkdir(backupPath, { recursive: true });

      async function copyDir(src, dest) {
        const entries = await fs.readdir(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            await fs.mkdir(destPath, { recursive: true });
            await copyDir(srcPath, destPath);
          } else {
            await fs.copyFile(srcPath, destPath);
          }
        }
      }

      await copyDir(OBSIDIAN_VAULT_PATH, backupPath);

      return {
        content: [{
          type: "text",
          text: `Backup created: ${path.basename(backupPath)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating backup: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async listBackups(args) {
    const backupDir = path.join(__dirname, 'backups');

    try {
      const exists = await fs.access(backupDir).then(() => true).catch(() => false);
      if (!exists) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ backups: [], total: 0 }, null, 2),
          }],
        };
      }

      const entries = await fs.readdir(backupDir, { withFileTypes: true });
      const backups = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const stats = await fs.stat(path.join(backupDir, entry.name));
          backups.push({
            name: entry.name,
            created: stats.birthtime.toISOString(),
            size_mb: Math.round(stats.size / 1024 / 1024 * 100) / 100,
          });
        }
      }

      backups.sort((a, b) => b.created.localeCompare(a.created));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ backups: backups, total: backups.length }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing backups: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async importMarkdownFolder(args) {
    const { source_path, destination_folder = '' } = args;

    try {
      const destPath = destination_folder 
        ? path.join(OBSIDIAN_VAULT_PATH, destination_folder)
        : OBSIDIAN_VAULT_PATH;

      await fs.mkdir(destPath, { recursive: true });

      const files = await fs.readdir(source_path);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      let imported = 0;

      for (const file of mdFiles) {
        const sourcePath = path.join(source_path, file);
        const targetPath = path.join(destPath, file);
        await fs.copyFile(sourcePath, targetPath);
        imported++;
      }

      return {
        content: [{
          type: "text",
          text: `Imported ${imported} markdown files from ${source_path}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error importing markdown folder: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async exportToPdf(args) {
    const { filename, output_path } = args;

    return {
      content: [{
        type: "text",
        text: `PDF export requires additional package. Use export_note_html instead and convert to PDF using a browser or tool.`,
      }],
      isError: true,
    };
  }

  async exportVaultArchive(args) {
    const { output_path } = args || {};
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `vault-export-${timestamp}.tar`;
    const archivePath = output_path || path.join(__dirname, archiveName);

    try {
      return {
        content: [{
          type: "text",
          text: `Archive export requires tar/zip package. Use backup_vault for now, which creates a full copy.`,
        }],
        isError: true,
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating archive: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async mergeNotes(args) {
    const { filenames, output_filename, delete_originals = false } = args;
    const outputPath = path.join(OBSIDIAN_VAULT_PATH, output_filename.endsWith('.md') ? output_filename : `${output_filename}.md`);

    try {
      let mergedContent = `---
title: ${output_filename.replace('.md', '')}
type: merged-note
created: ${new Date().toISOString()}
tags: ["merged"]
merged_from: [${filenames.map(f => `"${f}"`).join(', ')}]
---

# ${output_filename.replace('.md', '')}

`;

      for (const filename of filenames) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);
        const content = await fs.readFile(filepath, "utf-8");
        const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
        
        mergedContent += `## From: ${filename.replace('.md', '')}\n\n`;
        mergedContent += bodyContent + '\n\n---\n\n';
      }

      await fs.writeFile(outputPath, mergedContent, "utf-8");

      if (delete_originals) {
        for (const filename of filenames) {
          await fs.unlink(path.join(OBSIDIAN_VAULT_PATH, filename));
        }
      }

      return {
        content: [{
          type: "text",
          text: `Merged ${filenames.length} notes into ${output_filename}${delete_originals ? ' (originals deleted)' : ''}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error merging notes: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async duplicateNote(args) {
    const { filename, new_filename } = args;
    const sourcePath = path.join(OBSIDIAN_VAULT_PATH, filename);
    const destFilename = new_filename.endsWith('.md') ? new_filename : `${new_filename}.md`;
    const destPath = path.join(OBSIDIAN_VAULT_PATH, destFilename);

    try {
      await fs.copyFile(sourcePath, destPath);

      return {
        content: [{
          type: "text",
          text: `Duplicated ${filename} to ${destFilename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error duplicating note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async archiveNote(args) {
    const { filename } = args;
    const sourcePath = path.join(OBSIDIAN_VAULT_PATH, filename);
    const archiveDir = path.join(OBSIDIAN_VAULT_PATH, 'Archive');
    const destPath = path.join(archiveDir, filename);

    try {
      await fs.mkdir(archiveDir, { recursive: true });
      await fs.rename(sourcePath, destPath);

      return {
        content: [{
          type: "text",
          text: `Archived ${filename} to Archive folder`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error archiving note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Obsidian MCP server running on stdio");
  }
}

const server = new ObsidianMCPServer();
server.run().catch(console.error);
