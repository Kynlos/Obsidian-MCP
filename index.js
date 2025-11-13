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
import { marked } from "marked";
import puppeteer from "puppeteer";
import { parse } from "json2csv";

// Load .env file from the same directory as this script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

// Support workspace-relative vaults
// VAULTS_BASE_PATH: where to create new vaults (defaults to current working directory)
// OBSIDIAN_VAULT_PATH: the currently active vault
const VAULTS_BASE_PATH = process.env.VAULTS_BASE_PATH || process.cwd();
let OBSIDIAN_VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || path.join(VAULTS_BASE_PATH, "CodeSnippets");

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
        {
          name: "export_note_pdf",
          description: "Export a single note as a beautifully formatted PDF",
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
          name: "export_vault_pdf",
          description: "Export entire vault as a single PDF with table of contents and navigation",
          inputSchema: {
            type: "object",
            properties: {
              output_path: {
                type: "string",
                description: "Optional output path for PDF",
              },
              include_toc: {
                type: "boolean",
                description: "Include table of contents (default: true)",
              },
              organize_by: {
                type: "string",
                description: "Organization: 'folder', 'tag', or 'type' (default: 'folder')",
              },
            },
          },
        },
        {
          name: "export_note_markdown",
          description: "Export note as standalone markdown with embedded content",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename to export",
              },
              output_path: {
                type: "string",
                description: "Optional output path",
              },
              resolve_links: {
                type: "boolean",
                description: "Resolve wiki-links to full content (default: false)",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "export_vault_json",
          description: "Export entire vault as structured JSON database",
          inputSchema: {
            type: "object",
            properties: {
              output_path: {
                type: "string",
                description: "Optional output path for JSON file",
              },
              include_content: {
                type: "boolean",
                description: "Include full note content (default: true)",
              },
            },
          },
        },
        {
          name: "export_vault_csv",
          description: "Export vault index as CSV spreadsheet",
          inputSchema: {
            type: "object",
            properties: {
              output_path: {
                type: "string",
                description: "Optional output path for CSV file",
              },
            },
          },
        },
        {
          name: "export_note_plaintext",
          description: "Export note as plain text (strips markdown formatting)",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "The filename to export",
              },
              output_path: {
                type: "string",
                description: "Optional output path",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "export_vault_markdown_bundle",
          description: "Export vault as markdown bundle with all links preserved",
          inputSchema: {
            type: "object",
            properties: {
              output_path: {
                type: "string",
                description: "Optional output directory path",
              },
            },
          },
        },
        // Canvas Integration Tools
        {
          name: "create_canvas",
          description: "Create a new canvas JSON file",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the canvas file",
              },
            },
            required: ["name"],
          },
        },
        {
          name: "add_card_to_canvas",
          description: "Add text/note/media card to canvas",
          inputSchema: {
            type: "object",
            properties: {
              canvas_name: {
                type: "string",
                description: "Canvas filename",
              },
              card_type: {
                type: "string",
                enum: ["text", "file", "link"],
                description: "Type of card",
              },
              content: {
                type: "string",
                description: "Card content or file reference",
              },
              x: {
                type: "number",
                description: "X position",
              },
              y: {
                type: "number",
                description: "Y position",
              },
              width: {
                type: "number",
                description: "Card width",
              },
              height: {
                type: "number",
                description: "Card height",
              },
            },
            required: ["canvas_name", "card_type", "content"],
          },
        },
        {
          name: "add_connection_to_canvas",
          description: "Connect cards with lines/arrows",
          inputSchema: {
            type: "object",
            properties: {
              canvas_name: {
                type: "string",
                description: "Canvas filename",
              },
              from_id: {
                type: "string",
                description: "Source card ID",
              },
              to_id: {
                type: "string",
                description: "Target card ID",
              },
            },
            required: ["canvas_name", "from_id", "to_id"],
          },
        },
        {
          name: "create_canvas_group",
          description: "Group cards together in canvas",
          inputSchema: {
            type: "object",
            properties: {
              canvas_name: {
                type: "string",
                description: "Canvas filename",
              },
              label: {
                type: "string",
                description: "Group label",
              },
              card_ids: {
                type: "array",
                items: { type: "string" },
                description: "IDs of cards to group",
              },
            },
            required: ["canvas_name", "label", "card_ids"],
          },
        },
        {
          name: "read_canvas",
          description: "Parse and read canvas structure",
          inputSchema: {
            type: "object",
            properties: {
              canvas_name: {
                type: "string",
                description: "Canvas filename",
              },
            },
            required: ["canvas_name"],
          },
        },
        {
          name: "update_canvas_card",
          description: "Modify existing canvas card",
          inputSchema: {
            type: "object",
            properties: {
              canvas_name: {
                type: "string",
                description: "Canvas filename",
              },
              card_id: {
                type: "string",
                description: "Card ID to update",
              },
              updates: {
                type: "object",
                description: "Properties to update",
              },
            },
            required: ["canvas_name", "card_id", "updates"],
          },
        },
        // Dataview Query Execution Tools
        {
          name: "execute_dataview_query",
          description: "Run Dataview DQL query and return results",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Dataview DQL query",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "create_dataview_codeblock",
          description: "Generate dataview query block in note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Target note filename",
              },
              query: {
                type: "string",
                description: "Dataview query",
              },
            },
            required: ["filename", "query"],
          },
        },
        {
          name: "validate_dataview_query",
          description: "Check if dataview query syntax is valid",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Dataview query to validate",
              },
            },
            required: ["query"],
          },
        },
        // Graph Analysis Tools
        {
          name: "generate_graph_data",
          description: "Build graph structure from vault links (nodes/edges)",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "find_note_clusters",
          description: "Identify groups of related notes",
          inputSchema: {
            type: "object",
            properties: {
              min_cluster_size: {
                type: "number",
                description: "Minimum notes per cluster",
              },
            },
          },
        },
        {
          name: "calculate_note_centrality",
          description: "Find most connected/important notes",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Number of top notes to return",
              },
            },
          },
        },
        {
          name: "get_shortest_path",
          description: "Find link path between two notes",
          inputSchema: {
            type: "object",
            properties: {
              from_note: {
                type: "string",
                description: "Starting note filename",
              },
              to_note: {
                type: "string",
                description: "Target note filename",
              },
            },
            required: ["from_note", "to_note"],
          },
        },
        {
          name: "find_isolated_notes",
          description: "Notes with few/no connections",
          inputSchema: {
            type: "object",
            properties: {
              max_connections: {
                type: "number",
                description: "Maximum connection threshold",
              },
            },
          },
        },
        // Advanced URI Generation Tools
        {
          name: "generate_obsidian_uri",
          description: "Create obsidian:// URI for deep linking",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Note filename",
              },
              heading: {
                type: "string",
                description: "Optional heading to link to",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "create_workspace_uri",
          description: "Generate URI to open workspace",
          inputSchema: {
            type: "object",
            properties: {
              workspace_name: {
                type: "string",
                description: "Workspace name",
              },
            },
            required: ["workspace_name"],
          },
        },
        {
          name: "create_append_uri",
          description: "Generate URI to append text to note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Target note",
              },
              text: {
                type: "string",
                description: "Text to append",
              },
            },
            required: ["filename", "text"],
          },
        },
        {
          name: "create_search_uri",
          description: "Generate URI to search vault",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query",
              },
            },
            required: ["query"],
          },
        },
        // Attachments & Media Management Tools
        {
          name: "list_attachments",
          description: "List all media files in vault",
          inputSchema: {
            type: "object",
            properties: {
              file_types: {
                type: "array",
                items: { type: "string" },
                description: "Filter by file types (e.g., ['png', 'jpg'])",
              },
            },
          },
        },
        {
          name: "attach_file",
          description: "Copy external file into vault attachments folder",
          inputSchema: {
            type: "object",
            properties: {
              source_path: {
                type: "string",
                description: "External file path",
              },
              dest_name: {
                type: "string",
                description: "Optional destination filename",
              },
            },
            required: ["source_path"],
          },
        },
        {
          name: "delete_attachment",
          description: "Remove attachment file",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Attachment filename",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "find_orphaned_attachments",
          description: "Find unused media files",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_attachment_references",
          description: "Find which notes use an attachment",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Attachment filename",
              },
            },
            required: ["filename"],
          },
        },
        // Advanced Search & Replace Tools
        {
          name: "regex_search_and_replace",
          description: "Find and replace with regex across vault",
          inputSchema: {
            type: "object",
            properties: {
              pattern: {
                type: "string",
                description: "Regex pattern to find",
              },
              replacement: {
                type: "string",
                description: "Replacement text",
              },
              filenames: {
                type: "array",
                items: { type: "string" },
                description: "Optional specific files to process",
              },
            },
            required: ["pattern", "replacement"],
          },
        },
        {
          name: "search_in_frontmatter",
          description: "Search YAML frontmatter specifically",
          inputSchema: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "Frontmatter field to search",
              },
              value: {
                type: "string",
                description: "Value to search for",
              },
            },
            required: ["field"],
          },
        },
        {
          name: "search_by_link_type",
          description: "Find specific link patterns (wiki vs markdown)",
          inputSchema: {
            type: "object",
            properties: {
              link_type: {
                type: "string",
                enum: ["wiki", "markdown", "external"],
                description: "Type of links to find",
              },
            },
            required: ["link_type"],
          },
        },
        {
          name: "multi_file_replace",
          description: "Batch find/replace across multiple notes",
          inputSchema: {
            type: "object",
            properties: {
              find: {
                type: "string",
                description: "Text to find",
              },
              replace: {
                type: "string",
                description: "Replacement text",
              },
              filenames: {
                type: "array",
                items: { type: "string" },
                description: "Files to process",
              },
            },
            required: ["find", "replace", "filenames"],
          },
        },
        // Enhanced Metadata/Frontmatter Tools
        {
          name: "update_frontmatter_field",
          description: "Edit specific YAML field without rewriting note",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Note filename",
              },
              field: {
                type: "string",
                description: "Frontmatter field name",
              },
              value: {
                description: "New value for field",
              },
            },
            required: ["filename", "field", "value"],
          },
        },
        {
          name: "batch_update_metadata",
          description: "Update property across multiple notes",
          inputSchema: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "Property to update",
              },
              value: {
                description: "New value",
              },
              filenames: {
                type: "array",
                items: { type: "string" },
                description: "Notes to update",
              },
            },
            required: ["field", "value", "filenames"],
          },
        },
        {
          name: "validate_frontmatter_schema",
          description: "Check frontmatter against schema",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Note to validate",
              },
              schema: {
                type: "object",
                description: "Schema definition",
              },
            },
            required: ["filename", "schema"],
          },
        },
        {
          name: "list_all_properties",
          description: "Get all unique property keys in vault",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "rename_property_globally",
          description: "Rename property across all notes",
          inputSchema: {
            type: "object",
            properties: {
              old_name: {
                type: "string",
                description: "Current property name",
              },
              new_name: {
                type: "string",
                description: "New property name",
              },
            },
            required: ["old_name", "new_name"],
          },
        },
        {
          name: "get_property_values",
          description: "List all values for a property",
          inputSchema: {
            type: "object",
            properties: {
              property: {
                type: "string",
                description: "Property name",
              },
            },
            required: ["property"],
          },
        },
        // Structured Content Templates Tools
        {
          name: "create_from_template_with_prompts",
          description: "Template with variable substitution",
          inputSchema: {
            type: "object",
            properties: {
              template_name: {
                type: "string",
                description: "Template to use",
              },
              filename: {
                type: "string",
                description: "Output filename",
              },
              variables: {
                type: "object",
                description: "Variable substitutions",
              },
            },
            required: ["template_name", "filename"],
          },
        },
        {
          name: "create_book_note",
          description: "Structured book/literature note",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Book title",
              },
              author: {
                type: "string",
                description: "Author name",
              },
              genre: {
                type: "string",
                description: "Book genre",
              },
            },
            required: ["title", "author"],
          },
        },
        {
          name: "create_person_note",
          description: "Person/contact note structure",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Person's name",
              },
              relation: {
                type: "string",
                description: "Relationship/context",
              },
            },
            required: ["name"],
          },
        },
        {
          name: "create_meeting_note",
          description: "Meeting notes with agenda/action items",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Meeting title",
              },
              date: {
                type: "string",
                description: "Meeting date",
              },
              attendees: {
                type: "array",
                items: { type: "string" },
                description: "Attendee names",
              },
            },
            required: ["title"],
          },
        },
        {
          name: "create_project_note",
          description: "Project planning note structure",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Project name",
              },
              goal: {
                type: "string",
                description: "Project goal",
              },
              deadline: {
                type: "string",
                description: "Project deadline",
              },
            },
            required: ["name"],
          },
        },
        // Enhanced Task Management Tools
        {
          name: "get_tasks_by_criteria",
          description: "Filter tasks by status, date, priority, tags",
          inputSchema: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["pending", "completed", "all"],
                description: "Task status",
              },
              priority: {
                type: "string",
                description: "Priority level",
              },
              tag: {
                type: "string",
                description: "Tag filter",
              },
            },
          },
        },
        {
          name: "move_task_between_notes",
          description: "Relocate task to different note",
          inputSchema: {
            type: "object",
            properties: {
              source_file: {
                type: "string",
                description: "Current note",
              },
              dest_file: {
                type: "string",
                description: "Target note",
              },
              task_text: {
                type: "string",
                description: "Task to move",
              },
            },
            required: ["source_file", "dest_file", "task_text"],
          },
        },
        {
          name: "add_task_metadata",
          description: "Add due date, priority, tags to task",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Note containing task",
              },
              task_text: {
                type: "string",
                description: "Task to update",
              },
              metadata: {
                type: "object",
                description: "Metadata to add",
              },
            },
            required: ["filename", "task_text", "metadata"],
          },
        },
        {
          name: "create_task_report",
          description: "Generate task summary/report",
          inputSchema: {
            type: "object",
            properties: {
              output_filename: {
                type: "string",
                description: "Report output filename",
              },
              include_completed: {
                type: "boolean",
                description: "Include completed tasks",
              },
            },
          },
        },
        {
          name: "find_blocked_tasks",
          description: "Tasks waiting on dependencies",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        // Advanced Markdown Formatting Tools
        {
          name: "convert_to_callout",
          description: "Wrap text in callout block",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Target note",
              },
              text: {
                type: "string",
                description: "Text to wrap",
              },
              callout_type: {
                type: "string",
                description: "Callout type (note, warning, etc.)",
              },
            },
            required: ["filename", "text"],
          },
        },
        {
          name: "create_markdown_table",
          description: "Generate table programmatically",
          inputSchema: {
            type: "object",
            properties: {
              headers: {
                type: "array",
                items: { type: "string" },
                description: "Table headers",
              },
              rows: {
                type: "array",
                items: {
                  type: "array",
                  items: { type: "string" },
                },
                description: "Table rows",
              },
            },
            required: ["headers", "rows"],
          },
        },
        {
          name: "add_table_of_contents",
          description: "Generate TOC from headings",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Target note",
              },
              max_depth: {
                type: "number",
                description: "Maximum heading depth",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "create_mermaid_diagram",
          description: "Generate Mermaid diagram from data",
          inputSchema: {
            type: "object",
            properties: {
              diagram_type: {
                type: "string",
                enum: ["flowchart", "sequence", "class", "state", "gantt"],
                description: "Diagram type",
              },
              definition: {
                type: "string",
                description: "Mermaid definition",
              },
            },
            required: ["diagram_type", "definition"],
          },
        },
        {
          name: "create_math_block",
          description: "Add LaTeX math block",
          inputSchema: {
            type: "object",
            properties: {
              expression: {
                type: "string",
                description: "LaTeX expression",
              },
              display: {
                type: "boolean",
                description: "Display mode (block vs inline)",
              },
            },
            required: ["expression"],
          },
        },
        {
          name: "standardize_formatting",
          description: "Fix inconsistent markdown formatting",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Note to standardize",
              },
            },
            required: ["filename"],
          },
        },
        // Vault Maintenance Tools
        {
          name: "find_duplicate_notes",
          description: "Detect similar/duplicate content",
          inputSchema: {
            type: "object",
            properties: {
              similarity_threshold: {
                type: "number",
                description: "Similarity threshold (0-1)",
              },
            },
          },
        },
        {
          name: "find_empty_notes",
          description: "List notes with no content",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "find_large_notes",
          description: "Notes exceeding size threshold",
          inputSchema: {
            type: "object",
            properties: {
              min_size_kb: {
                type: "number",
                description: "Minimum size in KB",
              },
            },
          },
        },
        {
          name: "analyze_vault_health",
          description: "Overall vault statistics/issues",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "cleanup_broken_references",
          description: "Remove/fix broken links",
          inputSchema: {
            type: "object",
            properties: {
              fix_mode: {
                type: "string",
                enum: ["remove", "comment"],
                description: "How to handle broken links",
              },
            },
          },
        },
        // Cross-Note Analysis Tools
        {
          name: "compare_notes",
          description: "Diff two notes",
          inputSchema: {
            type: "object",
            properties: {
              file1: {
                type: "string",
                description: "First note",
              },
              file2: {
                type: "string",
                description: "Second note",
              },
            },
            required: ["file1", "file2"],
          },
        },
        {
          name: "find_similar_notes",
          description: "Content similarity analysis",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Reference note",
              },
              limit: {
                type: "number",
                description: "Number of similar notes to return",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "track_note_changes",
          description: "Compare note versions over time",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Note to track",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "merge_notes_enhanced",
          description: "Enhanced note merging with options",
          inputSchema: {
            type: "object",
            properties: {
              filenames: {
                type: "array",
                items: { type: "string" },
                description: "Notes to merge",
              },
              output_filename: {
                type: "string",
                description: "Output filename",
              },
              strategy: {
                type: "string",
                enum: ["concat", "deduplicate", "smart"],
                description: "Merge strategy",
              },
            },
            required: ["filenames", "output_filename"],
          },
        },
        {
          name: "split_note_by_headings",
          description: "Break large note into smaller ones",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Note to split",
              },
              heading_level: {
                type: "number",
                description: "Heading level to split on",
              },
              output_folder: {
                type: "string",
                description: "Output folder path",
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
        case "export_note_pdf":
          return await this.exportNotePdf(request.params.arguments);
        case "export_vault_pdf":
          return await this.exportVaultPdf(request.params.arguments);
        case "export_note_markdown":
          return await this.exportNoteMarkdown(request.params.arguments);
        case "export_vault_json":
          return await this.exportVaultJson(request.params.arguments);
        case "export_vault_csv":
          return await this.exportVaultCsv(request.params.arguments);
        case "export_note_plaintext":
          return await this.exportNotePlaintext(request.params.arguments);
        case "export_vault_markdown_bundle":
          return await this.exportVaultMarkdownBundle(request.params.arguments);
        // Canvas Integration
        case "create_canvas":
          return await this.createCanvas(request.params.arguments);
        case "add_card_to_canvas":
          return await this.addCardToCanvas(request.params.arguments);
        case "add_connection_to_canvas":
          return await this.addConnectionToCanvas(request.params.arguments);
        case "create_canvas_group":
          return await this.createCanvasGroup(request.params.arguments);
        case "read_canvas":
          return await this.readCanvas(request.params.arguments);
        case "update_canvas_card":
          return await this.updateCanvasCard(request.params.arguments);
        // Dataview Query Execution
        case "execute_dataview_query":
          return await this.executeDataviewQuery(request.params.arguments);
        case "create_dataview_codeblock":
          return await this.createDataviewCodeblock(request.params.arguments);
        case "validate_dataview_query":
          return await this.validateDataviewQuery(request.params.arguments);
        // Graph Analysis
        case "generate_graph_data":
          return await this.generateGraphData(request.params.arguments);
        case "find_note_clusters":
          return await this.findNoteClusters(request.params.arguments);
        case "calculate_note_centrality":
          return await this.calculateNoteCentrality(request.params.arguments);
        case "get_shortest_path":
          return await this.getShortestPath(request.params.arguments);
        case "find_isolated_notes":
          return await this.findIsolatedNotes(request.params.arguments);
        // Advanced URI Generation
        case "generate_obsidian_uri":
          return await this.generateObsidianUri(request.params.arguments);
        case "create_workspace_uri":
          return await this.createWorkspaceUri(request.params.arguments);
        case "create_append_uri":
          return await this.createAppendUri(request.params.arguments);
        case "create_search_uri":
          return await this.createSearchUri(request.params.arguments);
        // Attachments & Media Management
        case "list_attachments":
          return await this.listAttachments(request.params.arguments);
        case "attach_file":
          return await this.attachFile(request.params.arguments);
        case "delete_attachment":
          return await this.deleteAttachment(request.params.arguments);
        case "find_orphaned_attachments":
          return await this.findOrphanedAttachments(request.params.arguments);
        case "get_attachment_references":
          return await this.getAttachmentReferences(request.params.arguments);
        // Advanced Search & Replace
        case "regex_search_and_replace":
          return await this.regexSearchAndReplace(request.params.arguments);
        case "search_in_frontmatter":
          return await this.searchInFrontmatter(request.params.arguments);
        case "search_by_link_type":
          return await this.searchByLinkType(request.params.arguments);
        case "multi_file_replace":
          return await this.multiFileReplace(request.params.arguments);
        // Enhanced Metadata/Frontmatter
        case "update_frontmatter_field":
          return await this.updateFrontmatterField(request.params.arguments);
        case "batch_update_metadata":
          return await this.batchUpdateMetadata(request.params.arguments);
        case "validate_frontmatter_schema":
          return await this.validateFrontmatterSchema(request.params.arguments);
        case "list_all_properties":
          return await this.listAllProperties(request.params.arguments);
        case "rename_property_globally":
          return await this.renamePropertyGlobally(request.params.arguments);
        case "get_property_values":
          return await this.getPropertyValues(request.params.arguments);
        // Structured Content Templates
        case "create_from_template_with_prompts":
          return await this.createFromTemplateWithPrompts(request.params.arguments);
        case "create_book_note":
          return await this.createBookNote(request.params.arguments);
        case "create_person_note":
          return await this.createPersonNote(request.params.arguments);
        case "create_meeting_note":
          return await this.createMeetingNote(request.params.arguments);
        case "create_project_note":
          return await this.createProjectNote(request.params.arguments);
        // Enhanced Task Management
        case "get_tasks_by_criteria":
          return await this.getTasksByCriteria(request.params.arguments);
        case "move_task_between_notes":
          return await this.moveTaskBetweenNotes(request.params.arguments);
        case "add_task_metadata":
          return await this.addTaskMetadata(request.params.arguments);
        case "create_task_report":
          return await this.createTaskReport(request.params.arguments);
        case "find_blocked_tasks":
          return await this.findBlockedTasks(request.params.arguments);
        // Advanced Markdown Formatting
        case "convert_to_callout":
          return await this.convertToCallout(request.params.arguments);
        case "create_markdown_table":
          return await this.createMarkdownTable(request.params.arguments);
        case "add_table_of_contents":
          return await this.addTableOfContents(request.params.arguments);
        case "create_mermaid_diagram":
          return await this.createMermaidDiagram(request.params.arguments);
        case "create_math_block":
          return await this.createMathBlock(request.params.arguments);
        case "standardize_formatting":
          return await this.standardizeFormatting(request.params.arguments);
        // Vault Maintenance
        case "find_duplicate_notes":
          return await this.findDuplicateNotes(request.params.arguments);
        case "find_empty_notes":
          return await this.findEmptyNotes(request.params.arguments);
        case "find_large_notes":
          return await this.findLargeNotes(request.params.arguments);
        case "analyze_vault_health":
          return await this.analyzeVaultHealth(request.params.arguments);
        case "cleanup_broken_references":
          return await this.cleanupBrokenReferences(request.params.arguments);
        // Cross-Note Analysis
        case "compare_notes":
          return await this.compareNotes(request.params.arguments);
        case "find_similar_notes":
          return await this.findSimilarNotes(request.params.arguments);
        case "track_note_changes":
          return await this.trackNoteChanges(request.params.arguments);
        case "merge_notes_enhanced":
          return await this.mergeNotesEnhanced(request.params.arguments);
        case "split_note_by_headings":
          return await this.splitNoteByHeadings(request.params.arguments);
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

  async exportNotePdf(args) {
    const { filename, output_path } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      const html = await marked(bodyContent);

      const styledHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 2cm; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 0.3em; }
        h2 { color: #34495e; border-bottom: 1px solid #bdc3c7; padding-bottom: 0.2em; margin-top: 1.5em; }
        h3 { color: #7f8c8d; margin-top: 1.2em; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
        pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 8px; overflow-x: auto; }
        pre code { background: none; color: #ecf0f1; }
        a { color: #3498db; text-decoration: none; }
        blockquote { border-left: 4px solid #3498db; padding-left: 1em; color: #7f8c8d; margin: 1em 0; }
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #3498db; color: white; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <h1>${filename.replace('.md', '')}</h1>
    ${html}
</body>
</html>`;

      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(styledHtml);
      
      const outputFile = output_path || filepath.replace('.md', '.pdf');
      await page.pdf({
        path: outputFile,
        format: 'A4',
        printBackground: true,
        margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
      });

      await browser.close();

      return {
        content: [{
          type: "text",
          text: `Exported to PDF: ${outputFile}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error exporting to PDF: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async exportVaultPdf(args) {
    const { output_path, include_toc = true, organize_by = 'folder' } = args || {};
    
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      
      const notes = [];
      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        let title = file.replace('.md', '');
        let tags = [];
        let type = 'note';
        
        if (frontmatterMatch) {
          const titleMatch = frontmatterMatch[1].match(/title:\s*(.+)/);
          const tagsMatch = frontmatterMatch[1].match(/tags:\s*\[(.*?)\]/);
          const typeMatch = frontmatterMatch[1].match(/type:\s*(.+)/);
          
          if (titleMatch) title = titleMatch[1];
          if (tagsMatch) tags = tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
          if (typeMatch) type = typeMatch[1].trim();
        }
        
        const body = content.replace(/^---\n[\s\S]*?\n---\n/, '');
        notes.push({ filename: file, title, tags, type, content: body });
      }

      let tocHtml = '';
      let contentHtml = '';
      let pageNum = 1;

      if (include_toc) {
        tocHtml = '<div style="page-break-after: always;"><h1>Table of Contents</h1><ul style="list-style: none; padding: 0;">';
        notes.forEach((note, idx) => {
          tocHtml += `<li style="margin: 0.5em 0;"><a href="#note-${idx}" style="color: #3498db;">${note.title}</a></li>`;
        });
        tocHtml += '</ul></div>';
      }

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const html = await marked(note.content);
        contentHtml += `
<div style="page-break-before: always;" id="note-${i}">
    <h1 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 0.3em;">${note.title}</h1>
    <p style="color: #7f8c8d; font-size: 0.9em;">Type: ${note.type} | Tags: ${note.tags.join(', ') || 'none'}</p>
    ${html}
</div>`;
      }

      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Vault Export - ${path.basename(OBSIDIAN_VAULT_PATH)}</title>
    <style>
        @page { 
            margin: 2.5cm;
            @top-right { content: counter(page); }
        }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #2c3e50; margin-top: 0; }
        h2 { color: #34495e; border-bottom: 1px solid #bdc3c7; padding-bottom: 0.2em; margin-top: 1.5em; }
        h3 { color: #7f8c8d; margin-top: 1.2em; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 0.9em; }
        pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
        pre code { background: none; color: #ecf0f1; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        blockquote { border-left: 4px solid #3498db; padding-left: 1em; color: #7f8c8d; margin: 1em 0; font-style: italic; }
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #3498db; color: white; font-weight: 600; }
        tr:nth-child(even) { background: #f9f9f9; }
        img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
        ul, ol { margin: 0.5em 0; }
        li { margin: 0.3em 0; }
    </style>
</head>
<body>
    <div style="text-align: center; padding: 4cm 0;">
        <h1 style="font-size: 3em; margin-bottom: 0.2em;">📚 ${path.basename(OBSIDIAN_VAULT_PATH)}</h1>
        <p style="font-size: 1.2em; color: #7f8c8d;">Complete Vault Export</p>
        <p style="color: #95a5a6;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p style="color: #95a5a6;">${notes.length} notes</p>
    </div>
    ${tocHtml}
    ${contentHtml}
</body>
</html>`;

      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFile = output_path || path.join(__dirname, `vault-export-${timestamp}.pdf`);
      
      await page.pdf({
        path: outputFile,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
        margin: { top: '2.5cm', right: '2.5cm', bottom: '2.5cm', left: '2.5cm' },
      });

      await browser.close();

      return {
        content: [{
          type: "text",
          text: `Exported ${notes.length} notes to PDF: ${outputFile}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error exporting vault to PDF: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async exportNoteMarkdown(args) {
    const { filename, output_path, resolve_links = false } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      let content = await fs.readFile(filepath, "utf-8");

      if (resolve_links) {
        const links = content.match(/\[\[(.*?)\]\]/g) || [];
        for (const link of links) {
          const linkName = link.slice(2, -2).split('|')[0];
          const linkedFile = `${linkName}.md`;
          const linkedPath = path.join(OBSIDIAN_VAULT_PATH, linkedFile);
          
          try {
            const linkedContent = await fs.readFile(linkedPath, "utf-8");
            const linkedBody = linkedContent.replace(/^---\n[\s\S]*?\n---\n/, '');
            content += `\n\n---\n\n## Linked: ${linkName}\n\n${linkedBody}`;
          } catch (e) {
          }
        }
      }

      const outputFile = output_path || filepath.replace('.md', '-export.md');
      await fs.writeFile(outputFile, content, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Exported to markdown: ${outputFile}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error exporting markdown: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async exportVaultJson(args) {
    const { output_path, include_content = true } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const vault = {
        exported: new Date().toISOString(),
        vault_path: OBSIDIAN_VAULT_PATH,
        total_notes: mdFiles.length,
        notes: [],
      };

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        const note = {
          filename: file,
          created: new Date().toISOString(),
        };

        if (frontmatterMatch) {
          const fm = frontmatterMatch[1];
          const titleMatch = fm.match(/title:\s*(.+)/);
          const tagsMatch = fm.match(/tags:\s*\[(.*?)\]/);
          const typeMatch = fm.match(/type:\s*(.+)/);
          const createdMatch = fm.match(/created:\s*(.+)/);
          
          if (titleMatch) note.title = titleMatch[1];
          if (tagsMatch) note.tags = tagsMatch[1].split(",").map((t) => t.trim().replace(/"/g, ""));
          if (typeMatch) note.type = typeMatch[1].trim();
          if (createdMatch) note.created = createdMatch[1];
        }

        if (include_content) {
          note.content = content;
        }

        vault.notes.push(note);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFile = output_path || path.join(__dirname, `vault-export-${timestamp}.json`);
      await fs.writeFile(outputFile, JSON.stringify(vault, null, 2), "utf-8");

      return {
        content: [{
          type: "text",
          text: `Exported vault to JSON: ${outputFile}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error exporting to JSON: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async exportVaultCsv(args) {
    const { output_path } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const rows = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, "utf-8");
        const stats = await fs.stat(filepath);
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        const row = {
          filename: file,
          title: file.replace('.md', ''),
          tags: '',
          type: '',
          word_count: content.split(/\s+/).length,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
        };

        if (frontmatterMatch) {
          const fm = frontmatterMatch[1];
          const titleMatch = fm.match(/title:\s*(.+)/);
          const tagsMatch = fm.match(/tags:\s*\[(.*?)\]/);
          const typeMatch = fm.match(/type:\s*(.+)/);
          
          if (titleMatch) row.title = titleMatch[1];
          if (tagsMatch) row.tags = tagsMatch[1].replace(/"/g, '');
          if (typeMatch) row.type = typeMatch[1].trim();
        }

        rows.push(row);
      }

      const csv = parse(rows);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFile = output_path || path.join(__dirname, `vault-index-${timestamp}.csv`);
      await fs.writeFile(outputFile, csv, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Exported vault index to CSV: ${outputFile}\n${rows.length} notes exported`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error exporting to CSV: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async exportNotePlaintext(args) {
    const { filename, output_path } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      let plaintext = content
        .replace(/^---\n[\s\S]*?\n---\n/, '')
        .replace(/```[\s\S]*?```/g, '[CODE BLOCK]')
        .replace(/\[\[(.*?)\]\]/g, '$1')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^[-*]\s+/gm, '• ')
        .trim();

      const outputFile = output_path || filepath.replace('.md', '.txt');
      await fs.writeFile(outputFile, plaintext, "utf-8");

      return {
        content: [{
          type: "text",
          text: `Exported to plain text: ${outputFile}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error exporting to plain text: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async exportVaultMarkdownBundle(args) {
    const { output_path } = args || {};

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportDir = output_path || path.join(__dirname, `vault-bundle-${timestamp}`);
      
      await fs.mkdir(exportDir, { recursive: true });

      async function copyDirectory(src, dest) {
        const entries = await fs.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.name.startsWith('.')) continue;
          
          if (entry.isDirectory()) {
            await fs.mkdir(destPath, { recursive: true });
            await copyDirectory(srcPath, destPath);
          } else if (entry.name.endsWith('.md')) {
            await fs.copyFile(srcPath, destPath);
          }
        }
      }

      await copyDirectory(OBSIDIAN_VAULT_PATH, exportDir);

      const files = await fs.readdir(exportDir);
      const mdCount = files.filter(f => f.endsWith('.md')).length;

      return {
        content: [{
          type: "text",
          text: `Exported vault bundle to: ${exportDir}\n${mdCount} markdown files copied`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error exporting bundle: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== CANVAS INTEGRATION METHODS =====
  
  async createCanvas(args) {
    const { name } = args;
    const canvasPath = path.join(OBSIDIAN_VAULT_PATH, `${name}.canvas`);

    try {
      const canvasData = {
        nodes: [],
        edges: []
      };
      
      await fs.writeFile(canvasPath, JSON.stringify(canvasData, null, 2), 'utf-8');
      
      return {
        content: [{
          type: "text",
          text: `Created canvas: ${name}.canvas`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating canvas: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async addCardToCanvas(args) {
    const { canvas_name, card_type, content, x = 0, y = 0, width = 400, height = 200 } = args;
    const canvasPath = path.join(OBSIDIAN_VAULT_PATH, canvas_name.endsWith('.canvas') ? canvas_name : `${canvas_name}.canvas`);

    try {
      const canvasData = JSON.parse(await fs.readFile(canvasPath, 'utf-8'));
      
      const newCard = {
        id: Date.now().toString(),
        type: card_type,
        x, y, width, height,
      };

      if (card_type === 'text') {
        newCard.text = content;
      } else if (card_type === 'file') {
        newCard.file = content;
      } else if (card_type === 'link') {
        newCard.url = content;
      }

      canvasData.nodes.push(newCard);
      await fs.writeFile(canvasPath, JSON.stringify(canvasData, null, 2), 'utf-8');
      
      return {
        content: [{
          type: "text",
          text: `Added ${card_type} card to canvas. Card ID: ${newCard.id}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error adding card to canvas: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async addConnectionToCanvas(args) {
    const { canvas_name, from_id, to_id } = args;
    const canvasPath = path.join(OBSIDIAN_VAULT_PATH, canvas_name.endsWith('.canvas') ? canvas_name : `${canvas_name}.canvas`);

    try {
      const canvasData = JSON.parse(await fs.readFile(canvasPath, 'utf-8'));
      
      canvasData.edges.push({
        id: Date.now().toString(),
        fromNode: from_id,
        toNode: to_id,
        fromSide: "right",
        toSide: "left"
      });

      await fs.writeFile(canvasPath, JSON.stringify(canvasData, null, 2), 'utf-8');
      
      return {
        content: [{
          type: "text",
          text: `Connected cards ${from_id} → ${to_id}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating connection: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createCanvasGroup(args) {
    const { canvas_name, label, card_ids } = args;
    const canvasPath = path.join(OBSIDIAN_VAULT_PATH, canvas_name.endsWith('.canvas') ? canvas_name : `${canvas_name}.canvas`);

    try {
      const canvasData = JSON.parse(await fs.readFile(canvasPath, 'utf-8'));
      
      // Calculate bounding box
      const cards = canvasData.nodes.filter(n => card_ids.includes(n.id));
      if (cards.length === 0) {
        throw new Error('No cards found with given IDs');
      }

      const xs = cards.map(c => c.x);
      const ys = cards.map(c => c.y);
      const minX = Math.min(...xs) - 20;
      const minY = Math.min(...ys) - 60;
      const maxX = Math.max(...cards.map(c => c.x + c.width)) + 20;
      const maxY = Math.max(...cards.map(c => c.y + c.height)) + 20;

      const group = {
        id: Date.now().toString(),
        type: "group",
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        label: label
      };

      canvasData.nodes.push(group);
      await fs.writeFile(canvasPath, JSON.stringify(canvasData, null, 2), 'utf-8');
      
      return {
        content: [{
          type: "text",
          text: `Created group "${label}" with ${card_ids.length} cards`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating group: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async readCanvas(args) {
    const { canvas_name } = args;
    const canvasPath = path.join(OBSIDIAN_VAULT_PATH, canvas_name.endsWith('.canvas') ? canvas_name : `${canvas_name}.canvas`);

    try {
      const canvasData = JSON.parse(await fs.readFile(canvasPath, 'utf-8'));
      
      return {
        content: [{
          type: "text",
          text: `Canvas: ${canvas_name}\nNodes: ${canvasData.nodes.length}\nEdges: ${canvasData.edges.length}\n\n${JSON.stringify(canvasData, null, 2)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error reading canvas: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async updateCanvasCard(args) {
    const { canvas_name, card_id, updates } = args;
    const canvasPath = path.join(OBSIDIAN_VAULT_PATH, canvas_name.endsWith('.canvas') ? canvas_name : `${canvas_name}.canvas`);

    try {
      const canvasData = JSON.parse(await fs.readFile(canvasPath, 'utf-8'));
      const card = canvasData.nodes.find(n => n.id === card_id);
      
      if (!card) {
        throw new Error(`Card ${card_id} not found`);
      }

      Object.assign(card, updates);
      await fs.writeFile(canvasPath, JSON.stringify(canvasData, null, 2), 'utf-8');
      
      return {
        content: [{
          type: "text",
          text: `Updated card ${card_id}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error updating card: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== DATAVIEW QUERY EXECUTION METHODS =====

  async executeDataviewQuery(args) {
    const { query } = args;

    try {
      // Simple implementation: parse basic LIST/TABLE queries
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const notes = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
          const metadata = {};
          const lines = frontmatterMatch[1].split('\n');
          lines.forEach(line => {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (match) {
              metadata[match[1]] = match[2];
            }
          });
          notes.push({ file, ...metadata });
        }
      }

      // Basic query execution (simplified)
      let results = notes;
      if (query.includes('WHERE')) {
        const whereMatch = query.match(/WHERE\s+(.+)/i);
        if (whereMatch) {
          // Simple tag filter
          const tagMatch = whereMatch[1].match(/#(\w+)/);
          if (tagMatch) {
            const tag = tagMatch[1];
            results = results.filter(n => n.tags && n.tags.includes(tag));
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: `Query Results (${results.length} items):\n\n${JSON.stringify(results, null, 2)}\n\nNote: This is a simplified Dataview implementation. For full DQL support, use Obsidian with Dataview plugin.`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error executing dataview query: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createDataviewCodeblock(args) {
    const { filename, query } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      let content = await fs.readFile(filepath, 'utf-8');
      const dataviewBlock = `\n\n\`\`\`dataview\n${query}\n\`\`\`\n`;
      
      content += dataviewBlock;
      await fs.writeFile(filepath, content, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Added dataview query block to ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error adding dataview block: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async validateDataviewQuery(args) {
    const { query } = args;

    try {
      // Basic validation
      const validCommands = ['LIST', 'TABLE', 'TASK', 'CALENDAR'];
      const hasValidCommand = validCommands.some(cmd => query.toUpperCase().includes(cmd));
      
      if (!hasValidCommand) {
        return {
          content: [{
            type: "text",
            text: `Invalid query: Must start with LIST, TABLE, TASK, or CALENDAR`,
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text",
          text: `Query validation passed (basic check). For full validation, use Obsidian with Dataview plugin.`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error validating query: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== GRAPH ANALYSIS METHODS =====

  async generateGraphData(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      const nodes = [];
      const edges = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        
        nodes.push({ id: file, label: file.replace('.md', '') });

        // Find wiki links
        const wikiLinks = content.match(/\[\[([^\]]+)\]\]/g) || [];
        for (const link of wikiLinks) {
          const target = link.slice(2, -2).split('|')[0] + '.md';
          if (mdFiles.includes(target)) {
            edges.push({ from: file, to: target });
          }
        }

        // Find markdown links to local files
        const mdLinks = content.match(/\[([^\]]+)\]\(([^\)]+\.md)\)/g) || [];
        for (const link of mdLinks) {
          const match = link.match(/\[([^\]]+)\]\(([^\)]+\.md)\)/);
          if (match && mdFiles.includes(match[2])) {
            edges.push({ from: file, to: match[2] });
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: `Graph Data:\nNodes: ${nodes.length}\nEdges: ${edges.length}\n\n${JSON.stringify({ nodes, edges }, null, 2)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error generating graph data: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async findNoteClusters(args) {
    const { min_cluster_size = 3 } = args || {};

    try {
      // Build adjacency list
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const graph = new Map();

      for (const file of mdFiles) {
        graph.set(file, new Set());
      }

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const links = content.match(/\[\[([^\]]+)\]\]/g) || [];
        
        for (const link of links) {
          const target = link.slice(2, -2).split('|')[0] + '.md';
          if (graph.has(target)) {
            graph.get(file).add(target);
            graph.get(target).add(file);
          }
        }
      }

      // Simple clustering: connected components
      const visited = new Set();
      const clusters = [];

      for (const node of graph.keys()) {
        if (!visited.has(node)) {
          const cluster = [];
          const queue = [node];
          visited.add(node);

          while (queue.length > 0) {
            const current = queue.shift();
            cluster.push(current);

            for (const neighbor of graph.get(current)) {
              if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
              }
            }
          }

          if (cluster.length >= min_cluster_size) {
            clusters.push(cluster);
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: `Found ${clusters.length} clusters with ${min_cluster_size}+ notes:\n\n${clusters.map((c, i) => `Cluster ${i+1} (${c.length} notes):\n${c.map(n => `  - ${n}`).join('\n')}`).join('\n\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding clusters: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async calculateNoteCentrality(args) {
    const { limit = 10 } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const connections = new Map();

      for (const file of mdFiles) {
        connections.set(file, { in: 0, out: 0 });
      }

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const links = content.match(/\[\[([^\]]+)\]\]/g) || [];
        
        for (const link of links) {
          const target = link.slice(2, -2).split('|')[0] + '.md';
          if (connections.has(target)) {
            connections.get(file).out++;
            connections.get(target).in++;
          }
        }
      }

      const centrality = Array.from(connections.entries())
        .map(([file, conn]) => ({
          file,
          inbound: conn.in,
          outbound: conn.out,
          total: conn.in + conn.out,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);

      return {
        content: [{
          type: "text",
          text: `Top ${limit} Most Connected Notes:\n\n${centrality.map((n, i) => `${i+1}. ${n.file}\n   In: ${n.inbound}, Out: ${n.outbound}, Total: ${n.total}`).join('\n\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error calculating centrality: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async getShortestPath(args) {
    const { from_note, to_note } = args;

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const graph = new Map();

      for (const file of mdFiles) {
        graph.set(file, []);
      }

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const links = content.match(/\[\[([^\]]+)\]\]/g) || [];
        
        for (const link of links) {
          const target = link.slice(2, -2).split('|')[0] + '.md';
          if (graph.has(target)) {
            graph.get(file).push(target);
          }
        }
      }

      // BFS to find shortest path
      const queue = [[from_note]];
      const visited = new Set([from_note]);

      while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];

        if (current === to_note) {
          return {
            content: [{
              type: "text",
              text: `Shortest path (${path.length - 1} hops):\n${path.map((n, i) => `${i > 0 ? ' → ' : ''}${n.replace('.md', '')}`).join('')}`,
            }],
          };
        }

        for (const neighbor of graph.get(current) || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push([...path, neighbor]);
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: `No path found between ${from_note} and ${to_note}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding path: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async findIsolatedNotes(args) {
    const { max_connections = 1 } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const connections = new Map();

      for (const file of mdFiles) {
        connections.set(file, 0);
      }

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        
        // Count outbound links
        const outLinks = (content.match(/\[\[([^\]]+)\]\]/g) || []).length;
        connections.set(file, connections.get(file) + outLinks);

        // Count inbound links (check if this file is linked from others)
        const fileNameWithoutExt = file.replace('.md', '');
        const isLinked = content.includes(`[[${fileNameWithoutExt}]]`) || content.includes(`[[${fileNameWithoutExt}|`);
        if (isLinked) {
          connections.set(file, connections.get(file) + 1);
        }
      }

      const isolated = Array.from(connections.entries())
        .filter(([_, count]) => count <= max_connections)
        .map(([file, count]) => ({ file, connections: count }));

      return {
        content: [{
          type: "text",
          text: `Found ${isolated.length} isolated notes (≤${max_connections} connections):\n\n${isolated.map(n => `- ${n.file} (${n.connections} connections)`).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding isolated notes: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== ADVANCED URI GENERATION METHODS =====

  async generateObsidianUri(args) {
    const { filename, heading } = args;

    try {
      const vaultName = path.basename(OBSIDIAN_VAULT_PATH);
      const encodedFile = encodeURIComponent(filename.replace('.md', ''));
      let uri = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodedFile}`;
      
      if (heading) {
        uri += `#${encodeURIComponent(heading)}`;
      }

      return {
        content: [{
          type: "text",
          text: `Obsidian URI:\n${uri}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error generating URI: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createWorkspaceUri(args) {
    const { workspace_name } = args;

    try {
      const vaultName = path.basename(OBSIDIAN_VAULT_PATH);
      const uri = `obsidian://workspace?vault=${encodeURIComponent(vaultName)}&workspace=${encodeURIComponent(workspace_name)}`;

      return {
        content: [{
          type: "text",
          text: `Workspace URI:\n${uri}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating workspace URI: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createAppendUri(args) {
    const { filename, text } = args;

    try {
      const vaultName = path.basename(OBSIDIAN_VAULT_PATH);
      const encodedFile = encodeURIComponent(filename.replace('.md', ''));
      const encodedText = encodeURIComponent(text);
      const uri = `obsidian://new?vault=${encodeURIComponent(vaultName)}&file=${encodedFile}&append=true&content=${encodedText}`;

      return {
        content: [{
          type: "text",
          text: `Append URI:\n${uri}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating append URI: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createSearchUri(args) {
    const { query } = args;

    try {
      const vaultName = path.basename(OBSIDIAN_VAULT_PATH);
      const uri = `obsidian://search?vault=${encodeURIComponent(vaultName)}&query=${encodeURIComponent(query)}`;

      return {
        content: [{
          type: "text",
          text: `Search URI:\n${uri}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating search URI: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== ATTACHMENTS & MEDIA MANAGEMENT METHODS =====

  async listAttachments(args) {
    const { file_types } = args || {};

    try {
      const attachDir = path.join(OBSIDIAN_VAULT_PATH, 'attachments');
      let files = [];

      try {
        files = await fs.readdir(attachDir);
      } catch (e) {
        return {
          content: [{
            type: "text",
            text: `No attachments folder found. Create one with files to see them here.`,
          }],
        };
      }

      if (file_types && file_types.length > 0) {
        files = files.filter(f => file_types.some(ext => f.endsWith(`.${ext}`)));
      }

      const attachments = [];
      for (const file of files) {
        const filePath = path.join(attachDir, file);
        const stats = await fs.stat(filePath);
        attachments.push({
          name: file,
          size: `${(stats.size / 1024).toFixed(2)} KB`,
          modified: stats.mtime.toISOString(),
        });
      }

      return {
        content: [{
          type: "text",
          text: `Found ${attachments.length} attachment(s):\n\n${attachments.map(a => `- ${a.name} (${a.size})`).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing attachments: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async attachFile(args) {
    const { source_path, dest_name } = args;

    try {
      const attachDir = path.join(OBSIDIAN_VAULT_PATH, 'attachments');
      await fs.mkdir(attachDir, { recursive: true });

      const filename = dest_name || path.basename(source_path);
      const destPath = path.join(attachDir, filename);

      await fs.copyFile(source_path, destPath);

      return {
        content: [{
          type: "text",
          text: `Copied file to attachments: ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error attaching file: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async deleteAttachment(args) {
    const { filename } = args;

    try {
      const attachPath = path.join(OBSIDIAN_VAULT_PATH, 'attachments', filename);
      await fs.unlink(attachPath);

      return {
        content: [{
          type: "text",
          text: `Deleted attachment: ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error deleting attachment: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async findOrphanedAttachments(args) {
    try {
      const attachDir = path.join(OBSIDIAN_VAULT_PATH, 'attachments');
      let attachments = [];

      try {
        attachments = await fs.readdir(attachDir);
      } catch (e) {
        return {
          content: [{
            type: "text",
            text: `No attachments folder found.`,
          }],
        };
      }

      // Read all notes
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      let allContent = '';

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        allContent += content;
      }

      const orphaned = attachments.filter(att => !allContent.includes(att));

      return {
        content: [{
          type: "text",
          text: `Found ${orphaned.length} orphaned attachment(s):\n\n${orphaned.map(a => `- ${a}`).join('\n') || '(none)'}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding orphaned attachments: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async getAttachmentReferences(args) {
    const { filename } = args;

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const references = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        
        if (content.includes(filename)) {
          references.push(file);
        }
      }

      return {
        content: [{
          type: "text",
          text: `Attachment "${filename}" is referenced in ${references.length} note(s):\n\n${references.map(r => `- ${r}`).join('\n') || '(none)'}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding references: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== ADVANCED SEARCH & REPLACE METHODS =====

  async regexSearchAndReplace(args) {
    const { pattern, replacement, filenames } = args;

    try {
      const files = filenames || (await fs.readdir(OBSIDIAN_VAULT_PATH)).filter(f => f.endsWith('.md'));
      const regex = new RegExp(pattern, 'g');
      let totalReplacements = 0;

      for (const file of files) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        try {
          let content = await fs.readFile(filepath, 'utf-8');
          const matches = (content.match(regex) || []).length;
          
          if (matches > 0) {
            content = content.replace(regex, replacement);
            await fs.writeFile(filepath, content, 'utf-8');
            totalReplacements += matches;
          }
        } catch (e) {
          // Skip files that can't be processed
        }
      }

      return {
        content: [{
          type: "text",
          text: `Replaced ${totalReplacements} occurrence(s) across ${files.length} file(s)`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error in regex search and replace: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async searchInFrontmatter(args) {
    const { field, value } = args;

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const results = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (fmMatch) {
          const fieldMatch = fmMatch[1].match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
          if (fieldMatch && (!value || fieldMatch[1].includes(value))) {
            results.push({ file, value: fieldMatch[1] });
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: `Found ${results.length} note(s) with ${field}${value ? ` containing "${value}"` : ''}:\n\n${results.map(r => `- ${r.file}: ${r.value}`).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching frontmatter: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async searchByLinkType(args) {
    const { link_type } = args;

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const results = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        let links = [];

        if (link_type === 'wiki') {
          links = content.match(/\[\[([^\]]+)\]\]/g) || [];
        } else if (link_type === 'markdown') {
          links = content.match(/\[([^\]]+)\]\(([^\)]+)\)/g) || [];
        } else if (link_type === 'external') {
          links = content.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g) || [];
        }

        if (links.length > 0) {
          results.push({ file, links });
        }
      }

      return {
        content: [{
          type: "text",
          text: `Found ${results.length} note(s) with ${link_type} links:\n\n${results.map(r => `${r.file} (${r.links.length} links)`).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching by link type: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async multiFileReplace(args) {
    const { find, replace, filenames } = args;

    try {
      let replacements = 0;

      for (const file of filenames) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        try {
          let content = await fs.readFile(filepath, 'utf-8');
          const occurrences = (content.match(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
          
          if (occurrences > 0) {
            content = content.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
            await fs.writeFile(filepath, content, 'utf-8');
            replacements += occurrences;
          }
        } catch (e) {
          // Skip files that can't be processed
        }
      }

      return {
        content: [{
          type: "text",
          text: `Replaced ${replacements} occurrence(s) in ${filenames.length} file(s)`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error in multi-file replace: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== ENHANCED METADATA/FRONTMATTER METHODS =====

  async updateFrontmatterField(args) {
    const { filename, field, value } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      let content = await fs.readFile(filepath, 'utf-8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (!fmMatch) {
        // Add frontmatter if it doesn't exist
        const newFm = `---\n${field}: ${JSON.stringify(value)}\n---\n\n`;
        content = newFm + content;
      } else {
        const fm = fmMatch[1];
        const fieldRegex = new RegExp(`^${field}:.*$`, 'm');
        
        if (fieldRegex.test(fm)) {
          // Update existing field
          const newFm = fm.replace(fieldRegex, `${field}: ${JSON.stringify(value)}`);
          content = content.replace(fmMatch[0], `---\n${newFm}\n---`);
        } else {
          // Add new field
          const newFm = `${fm}\n${field}: ${JSON.stringify(value)}`;
          content = content.replace(fmMatch[0], `---\n${newFm}\n---`);
        }
      }

      await fs.writeFile(filepath, content, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Updated ${field} in ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error updating frontmatter: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async batchUpdateMetadata(args) {
    const { field, value, filenames } = args;

    try {
      for (const filename of filenames) {
        await this.updateFrontmatterField({ filename, field, value });
      }

      return {
        content: [{
          type: "text",
          text: `Updated ${field} in ${filenames.length} note(s)`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error in batch update: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async validateFrontmatterSchema(args) {
    const { filename, schema } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (!fmMatch) {
        return {
          content: [{
            type: "text",
            text: `No frontmatter found in ${filename}`,
          }],
          isError: true,
        };
      }

      const fm = {};
      fmMatch[1].split('\n').forEach(line => {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          fm[match[1]] = match[2];
        }
      });

      const errors = [];
      for (const [field, type] of Object.entries(schema)) {
        if (!(field in fm)) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      if (errors.length > 0) {
        return {
          content: [{
            type: "text",
            text: `Validation errors:\n${errors.join('\n')}`,
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text",
          text: `Frontmatter validation passed for ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error validating frontmatter: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async listAllProperties(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const properties = new Set();

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (fmMatch) {
          fmMatch[1].split('\n').forEach(line => {
            const match = line.match(/^(\w+):/);
            if (match) {
              properties.add(match[1]);
            }
          });
        }
      }

      return {
        content: [{
          type: "text",
          text: `Found ${properties.size} unique properties:\n\n${Array.from(properties).sort().map(p => `- ${p}`).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing properties: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async renamePropertyGlobally(args) {
    const { old_name, new_name } = args;

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      let updated = 0;

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        let content = await fs.readFile(filepath, 'utf-8');
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (fmMatch) {
          const oldFm = fmMatch[1];
          const newFm = oldFm.replace(new RegExp(`^${old_name}:`, 'm'), `${new_name}:`);
          
          if (oldFm !== newFm) {
            content = content.replace(fmMatch[0], `---\n${newFm}\n---`);
            await fs.writeFile(filepath, content, 'utf-8');
            updated++;
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: `Renamed property "${old_name}" to "${new_name}" in ${updated} note(s)`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error renaming property: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async getPropertyValues(args) {
    const { property } = args;

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const values = new Map();

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (fmMatch) {
          const match = fmMatch[1].match(new RegExp(`^${property}:\\s*(.+)$`, 'm'));
          if (match) {
            const value = match[1];
            values.set(value, (values.get(value) || 0) + 1);
          }
        }
      }

      const sorted = Array.from(values.entries()).sort((a, b) => b[1] - a[1]);

      return {
        content: [{
          type: "text",
          text: `Values for "${property}" (${sorted.length} unique):\n\n${sorted.map(([v, c]) => `- ${v} (${c} notes)`).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting property values: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== STRUCTURED CONTENT TEMPLATES METHODS =====

  async createFromTemplateWithPrompts(args) {
    const { template_name, filename, variables = {} } = args;
    
    try {
      const templatePath = path.join(OBSIDIAN_VAULT_PATH, 'Templates', `${template_name}.md`);
      let template = await fs.readFile(templatePath, 'utf-8');

      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      // Replace standard variables
      template = template.replace(/{{date}}/g, new Date().toISOString().split('T')[0]);
      template = template.replace(/{{datetime}}/g, new Date().toISOString());

      const outputPath = path.join(OBSIDIAN_VAULT_PATH, filename.endsWith('.md') ? filename : `${filename}.md`);
      await fs.writeFile(outputPath, template, 'utf-8');

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
          text: `Error creating from template: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createBookNote(args) {
    const { title, author, genre = '' } = args;
    const filename = this.sanitizeFilename(`book-${title}`);

    const content = `---
title: ${title}
type: book-note
author: ${author}
genre: ${genre}
status: reading
rating: 
created: ${new Date().toISOString()}
tags: ["books", "literature"]
---

# ${title}

**Author:** ${author}
**Genre:** ${genre}

## Summary

## Key Takeaways

- 

## Quotes

> 

## My Thoughts

## Related
`;

    try {
      const filepath = path.join(OBSIDIAN_VAULT_PATH, `${filename}.md`);
      await fs.writeFile(filepath, content, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Created book note: ${filename}.md`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating book note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createPersonNote(args) {
    const { name, relation = '' } = args;
    const filename = this.sanitizeFilename(`person-${name}`);

    const content = `---
title: ${name}
type: person-note
relation: ${relation}
created: ${new Date().toISOString()}
tags: ["people", "contacts"]
---

# ${name}

**Relation:** ${relation}

## Contact Information

- Email: 
- Phone: 
- Location: 

## Notes

## Meetings

## Projects Together

## Links
`;

    try {
      const filepath = path.join(OBSIDIAN_VAULT_PATH, `${filename}.md`);
      await fs.writeFile(filepath, content, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Created person note: ${filename}.md`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating person note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createMeetingNote(args) {
    const { title, date = new Date().toISOString().split('T')[0], attendees = [] } = args;
    const filename = this.sanitizeFilename(`meeting-${date}-${title}`);

    const content = `---
title: ${title}
type: meeting-note
date: ${date}
attendees: [${attendees.map(a => `"${a}"`).join(', ')}]
created: ${new Date().toISOString()}
tags: ["meetings"]
---

# ${title}

**Date:** ${date}
**Attendees:** ${attendees.join(', ')}

## Agenda

1. 

## Notes

## Decisions Made

- 

## Action Items

- [ ] 

## Next Meeting
`;

    try {
      const filepath = path.join(OBSIDIAN_VAULT_PATH, `${filename}.md`);
      await fs.writeFile(filepath, content, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Created meeting note: ${filename}.md`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating meeting note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createProjectNote(args) {
    const { name, goal = '', deadline = '' } = args;
    const filename = this.sanitizeFilename(`project-${name}`);

    const content = `---
title: ${name}
type: project-note
goal: ${goal}
deadline: ${deadline}
status: planning
created: ${new Date().toISOString()}
tags: ["projects"]
---

# ${name}

**Goal:** ${goal}
**Deadline:** ${deadline}
**Status:** Planning

## Overview

## Objectives

- [ ] 

## Tasks

### To Do
- [ ] 

### In Progress
- [ ] 

### Done
- [x] 

## Resources

## Notes

## Team

## Timeline
`;

    try {
      const filepath = path.join(OBSIDIAN_VAULT_PATH, `${filename}.md`);
      await fs.writeFile(filepath, content, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Created project note: ${filename}.md`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating project note: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== ENHANCED TASK MANAGEMENT METHODS =====

  async getTasksByCriteria(args) {
    const { status = 'all', priority, tag } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const tasks = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, idx) => {
          const pendingMatch = line.match(/^- \[ \] (.+)$/);
          const completedMatch = line.match(/^- \[x\] (.+)$/i);
          
          if (pendingMatch || completedMatch) {
            const taskText = (pendingMatch || completedMatch)[1];
            const taskStatus = pendingMatch ? 'pending' : 'completed';
            
            let matches = true;
            if (status !== 'all' && status !== taskStatus) matches = false;
            if (priority && !taskText.includes(`[priority: ${priority}]`)) matches = false;
            if (tag && !taskText.includes(`#${tag}`)) matches = false;

            if (matches) {
              tasks.push({ file, line: idx + 1, text: taskText, status: taskStatus });
            }
          }
        });
      }

      return {
        content: [{
          type: "text",
          text: `Found ${tasks.length} task(s):\n\n${tasks.map(t => `[${t.status}] ${t.file}:${t.line} - ${t.text}`).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting tasks: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async moveTaskBetweenNotes(args) {
    const { source_file, dest_file, task_text } = args;

    try {
      const sourcePath = path.join(OBSIDIAN_VAULT_PATH, source_file);
      const destPath = path.join(OBSIDIAN_VAULT_PATH, dest_file);

      let sourceContent = await fs.readFile(sourcePath, 'utf-8');
      let destContent = await fs.readFile(destPath, 'utf-8');

      const lines = sourceContent.split('\n');
      const taskLine = lines.find(line => line.includes(task_text) && (line.startsWith('- [ ]') || line.startsWith('- [x]')));

      if (!taskLine) {
        throw new Error('Task not found in source file');
      }

      // Remove from source
      sourceContent = sourceContent.replace(taskLine + '\n', '');
      
      // Add to destination
      destContent += '\n' + taskLine;

      await fs.writeFile(sourcePath, sourceContent, 'utf-8');
      await fs.writeFile(destPath, destContent, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Moved task from ${source_file} to ${dest_file}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error moving task: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async addTaskMetadata(args) {
    const { filename, task_text, metadata } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      let content = await fs.readFile(filepath, 'utf-8');
      const lines = content.split('\n');
      
      const taskIdx = lines.findIndex(line => line.includes(task_text) && (line.startsWith('- [ ]') || line.startsWith('- [x]')));
      
      if (taskIdx === -1) {
        throw new Error('Task not found');
      }

      let taskLine = lines[taskIdx];
      
      // Add metadata
      if (metadata.due) taskLine += ` 📅 ${metadata.due}`;
      if (metadata.priority) taskLine += ` [priority: ${metadata.priority}]`;
      if (metadata.tags) taskLine += ` ${metadata.tags.map(t => `#${t}`).join(' ')}`;

      lines[taskIdx] = taskLine;
      content = lines.join('\n');

      await fs.writeFile(filepath, content, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Added metadata to task in ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error adding task metadata: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createTaskReport(args) {
    const { output_filename = 'task-report.md', include_completed = false } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const tasks = { pending: [], completed: [] };

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, idx) => {
          const pendingMatch = line.match(/^- \[ \] (.+)$/);
          const completedMatch = line.match(/^- \[x\] (.+)$/i);
          
          if (pendingMatch) {
            tasks.pending.push({ file, line: idx + 1, text: pendingMatch[1] });
          } else if (completedMatch && include_completed) {
            tasks.completed.push({ file, line: idx + 1, text: completedMatch[1] });
          }
        });
      }

      const reportContent = `---
title: Task Report
type: task-report
created: ${new Date().toISOString()}
tags: ["tasks", "reports"]
---

# Task Report

Generated: ${new Date().toLocaleDateString()}

## Summary

- **Pending Tasks:** ${tasks.pending.length}
${include_completed ? `- **Completed Tasks:** ${tasks.completed.length}` : ''}

## Pending Tasks

${tasks.pending.map(t => `- [ ] ${t.text} (${t.file})`).join('\n') || '(none)'}

${include_completed ? `\n## Completed Tasks\n\n${tasks.completed.map(t => `- [x] ${t.text} (${t.file})`).join('\n') || '(none)'}` : ''}
`;

      const reportPath = path.join(OBSIDIAN_VAULT_PATH, output_filename);
      await fs.writeFile(reportPath, reportContent, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Created task report: ${output_filename}\nPending: ${tasks.pending.length}${include_completed ? `, Completed: ${tasks.completed.length}` : ''}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating task report: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async findBlockedTasks(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const blockedTasks = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, idx) => {
          if (line.match(/^- \[ \] .*(waiting|blocked|depends on|blocked by)/i)) {
            blockedTasks.push({ file, line: idx + 1, text: line.replace(/^- \[ \] /, '') });
          }
        });
      }

      return {
        content: [{
          type: "text",
          text: `Found ${blockedTasks.length} blocked task(s):\n\n${blockedTasks.map(t => `- ${t.file}:${t.line} - ${t.text}`).join('\n') || '(none)'}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding blocked tasks: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== ADVANCED MARKDOWN FORMATTING METHODS =====

  async convertToCallout(args) {
    const { filename, text, callout_type = 'note' } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      let content = await fs.readFile(filepath, 'utf-8');
      const callout = `> [!${callout_type}]\n> ${text.split('\n').join('\n> ')}`;
      
      content = content.replace(text, callout);
      await fs.writeFile(filepath, content, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Converted text to ${callout_type} callout in ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error converting to callout: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createMarkdownTable(args) {
    const { headers, rows } = args;

    try {
      const headerRow = `| ${headers.join(' | ')} |`;
      const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
      const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
      
      const table = `${headerRow}\n${separatorRow}\n${dataRows}`;

      return {
        content: [{
          type: "text",
          text: `Markdown table:\n\n${table}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating table: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async addTableOfContents(args) {
    const { filename, max_depth = 3 } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const headings = [];
      
      const lines = content.split('\n');
      lines.forEach(line => {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          if (level <= max_depth) {
            const text = match[2];
            const link = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            headings.push({ level, text, link });
          }
        }
      });

      const toc = `## Table of Contents\n\n${headings.map(h => `${'  '.repeat(h.level - 1)}- [${h.text}](#${h.link})`).join('\n')}\n\n`;
      
      // Insert after frontmatter or at beginning
      const fmMatch = content.match(/^---\n[\s\S]*?\n---\n/);
      let newContent;
      if (fmMatch) {
        newContent = content.replace(fmMatch[0], fmMatch[0] + '\n' + toc);
      } else {
        newContent = toc + content;
      }

      await fs.writeFile(filepath, newContent, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Added table of contents to ${filename} (${headings.length} headings)`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error adding TOC: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createMermaidDiagram(args) {
    const { diagram_type, definition } = args;

    try {
      const diagram = `\`\`\`mermaid\n${diagram_type}\n${definition}\n\`\`\``;

      return {
        content: [{
          type: "text",
          text: `Mermaid diagram:\n\n${diagram}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating diagram: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async createMathBlock(args) {
    const { expression, display = true } = args;

    try {
      const math = display ? `$$\n${expression}\n$$` : `$${expression}$`;

      return {
        content: [{
          type: "text",
          text: `Math block:\n\n${math}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating math block: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async standardizeFormatting(args) {
    const { filename } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      let content = await fs.readFile(filepath, 'utf-8');

      // Standardize heading spacing
      content = content.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2');
      
      // Ensure blank lines around headings
      content = content.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
      content = content.replace(/(#{1,6}\s.+)\n([^\n#])/g, '$1\n\n$2');
      
      // Standardize list spacing
      content = content.replace(/^([-*]\s)/gm, '- ');
      
      // Remove trailing spaces
      content = content.replace(/[ \t]+$/gm, '');
      
      // Ensure single final newline
      content = content.trim() + '\n';

      await fs.writeFile(filepath, content, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Standardized formatting in ${filename}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error standardizing formatting: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== VAULT MAINTENANCE METHODS =====

  async findDuplicateNotes(args) {
    const { similarity_threshold = 0.8 } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const notes = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
        notes.push({ file, content: bodyContent.toLowerCase().trim() });
      }

      const duplicates = [];
      
      for (let i = 0; i < notes.length; i++) {
        for (let j = i + 1; j < notes.length; j++) {
          // Simple similarity: Jaccard similarity of words
          const words1 = new Set(notes[i].content.split(/\s+/));
          const words2 = new Set(notes[j].content.split(/\s+/));
          
          const intersection = new Set([...words1].filter(w => words2.has(w)));
          const union = new Set([...words1, ...words2]);
          const similarity = intersection.size / union.size;

          if (similarity >= similarity_threshold) {
            duplicates.push({ 
              file1: notes[i].file, 
              file2: notes[j].file, 
              similarity: (similarity * 100).toFixed(1) + '%' 
            });
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: `Found ${duplicates.length} potential duplicate pair(s):\n\n${duplicates.map(d => `- ${d.file1} ↔ ${d.file2} (${d.similarity} similar)`).join('\n') || '(none)'}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding duplicates: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async findEmptyNotes(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const emptyNotes = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
        
        if (!bodyContent || bodyContent.length < 10) {
          emptyNotes.push(file);
        }
      }

      return {
        content: [{
          type: "text",
          text: `Found ${emptyNotes.length} empty or near-empty note(s):\n\n${emptyNotes.map(n => `- ${n}`).join('\n') || '(none)'}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding empty notes: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async findLargeNotes(args) {
    const { min_size_kb = 100 } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const largeNotes = [];

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const stats = await fs.stat(filepath);
        const sizeKb = stats.size / 1024;
        
        if (sizeKb >= min_size_kb) {
          largeNotes.push({ file, size: sizeKb.toFixed(2) + ' KB' });
        }
      }

      largeNotes.sort((a, b) => parseFloat(b.size) - parseFloat(a.size));

      return {
        content: [{
          type: "text",
          text: `Found ${largeNotes.length} note(s) ≥${min_size_kb} KB:\n\n${largeNotes.map(n => `- ${n.file} (${n.size})`).join('\n') || '(none)'}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding large notes: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async analyzeVaultHealth(args) {
    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      let totalWords = 0;
      let totalLinks = 0;
      let brokenLinks = 0;
      let untaggedNotes = 0;
      let emptyNotes = 0;

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        
        // Word count
        const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
        totalWords += bodyContent.split(/\s+/).length;
        
        // Links
        const links = content.match(/\[\[([^\]]+)\]\]/g) || [];
        totalLinks += links.length;
        
        for (const link of links) {
          const target = link.slice(2, -2).split('|')[0] + '.md';
          if (!mdFiles.includes(target)) brokenLinks++;
        }
        
        // Tags
        const fmMatch = content.match(/^---\n[\s\S]*?\n---/);
        if (!fmMatch || !fmMatch[0].includes('tags:')) {
          untaggedNotes++;
        }
        
        // Empty
        if (bodyContent.trim().length < 10) {
          emptyNotes++;
        }
      }

      const health = `# Vault Health Report

**Total Notes:** ${mdFiles.length}
**Total Words:** ${totalWords.toLocaleString()}
**Average Words/Note:** ${Math.round(totalWords / mdFiles.length)}

**Total Links:** ${totalLinks}
**Broken Links:** ${brokenLinks} ${brokenLinks > 0 ? '⚠️' : '✅'}
**Untagged Notes:** ${untaggedNotes} ${untaggedNotes > mdFiles.length * 0.3 ? '⚠️' : '✅'}
**Empty Notes:** ${emptyNotes} ${emptyNotes > 0 ? '⚠️' : '✅'}

**Health Score:** ${100 - (brokenLinks * 2) - (emptyNotes * 3) - Math.round((untaggedNotes / mdFiles.length) * 20)}/100
`;

      return {
        content: [{
          type: "text",
          text: health,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error analyzing vault health: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async cleanupBrokenReferences(args) {
    const { fix_mode = 'comment' } = args || {};

    try {
      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      let fixedCount = 0;

      for (const file of mdFiles) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        let content = await fs.readFile(filepath, 'utf-8');
        let modified = false;
        
        const links = content.match(/\[\[([^\]]+)\]\]/g) || [];
        
        for (const link of links) {
          const target = link.slice(2, -2).split('|')[0] + '.md';
          if (!mdFiles.includes(target)) {
            if (fix_mode === 'remove') {
              content = content.replace(link, link.slice(2, -2).split('|')[1] || link.slice(2, -2));
            } else {
              content = content.replace(link, `${link} <!-- BROKEN LINK -->`);
            }
            modified = true;
            fixedCount++;
          }
        }

        if (modified) {
          await fs.writeFile(filepath, content, 'utf-8');
        }
      }

      return {
        content: [{
          type: "text",
          text: `${fix_mode === 'remove' ? 'Removed' : 'Commented'} ${fixedCount} broken reference(s)`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error cleaning broken references: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  // ===== CROSS-NOTE ANALYSIS METHODS =====

  async compareNotes(args) {
    const { file1, file2 } = args;

    try {
      const path1 = path.join(OBSIDIAN_VAULT_PATH, file1);
      const path2 = path.join(OBSIDIAN_VAULT_PATH, file2);

      const content1 = await fs.readFile(path1, 'utf-8');
      const content2 = await fs.readFile(path2, 'utf-8');

      const lines1 = content1.split('\n');
      const lines2 = content2.split('\n');

      let diff = `Comparing ${file1} vs ${file2}:\n\n`;
      diff += `Lines: ${lines1.length} vs ${lines2.length}\n`;
      diff += `Characters: ${content1.length} vs ${content2.length}\n\n`;

      // Simple line-by-line comparison
      const maxLines = Math.max(lines1.length, lines2.length);
      let differences = 0;
      
      for (let i = 0; i < Math.min(maxLines, 20); i++) {
        if (lines1[i] !== lines2[i]) {
          diff += `Line ${i + 1}:\n  < ${lines1[i] || '(empty)'}\n  > ${lines2[i] || '(empty)'}\n\n`;
          differences++;
        }
      }

      if (differences === 0) {
        diff += 'Files are identical (first 20 lines)';
      } else {
        diff += `${differences} difference(s) shown (first 20 lines)`;
      }

      return {
        content: [{
          type: "text",
          text: diff,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error comparing notes: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async findSimilarNotes(args) {
    const { filename, limit = 5 } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const targetContent = await fs.readFile(filepath, 'utf-8');
      const targetWords = new Set(targetContent.toLowerCase().replace(/^---\n[\s\S]*?\n---\n/, '').split(/\s+/));

      const files = await fs.readdir(OBSIDIAN_VAULT_PATH);
      const mdFiles = files.filter(f => f.endsWith('.md') && f !== filename);
      const similarities = [];

      for (const file of mdFiles) {
        const otherPath = path.join(OBSIDIAN_VAULT_PATH, file);
        const otherContent = await fs.readFile(otherPath, 'utf-8');
        const otherWords = new Set(otherContent.toLowerCase().replace(/^---\n[\s\S]*?\n---\n/, '').split(/\s+/));
        
        const intersection = new Set([...targetWords].filter(w => otherWords.has(w)));
        const union = new Set([...targetWords, ...otherWords]);
        const similarity = intersection.size / union.size;

        similarities.push({ file, similarity });
      }

      similarities.sort((a, b) => b.similarity - a.similarity);
      const topSimilar = similarities.slice(0, limit);

      return {
        content: [{
          type: "text",
          text: `Top ${limit} notes similar to ${filename}:\n\n${topSimilar.map((s, i) => `${i+1}. ${s.file} (${(s.similarity * 100).toFixed(1)}% similar)`).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error finding similar notes: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async trackNoteChanges(args) {
    const { filename } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const stats = await fs.stat(filepath);
      const content = await fs.readFile(filepath, 'utf-8');
      const wordCount = content.split(/\s+/).length;
      const lineCount = content.split('\n').length;

      const info = `Note Change Tracking for ${filename}:

**Created:** ${stats.birthtime.toISOString()}
**Last Modified:** ${stats.mtime.toISOString()}
**Current Size:** ${(stats.size / 1024).toFixed(2)} KB
**Word Count:** ${wordCount}
**Line Count:** ${lineCount}

Note: For full version history, use a git repository or Obsidian Sync.
`;

      return {
        content: [{
          type: "text",
          text: info,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error tracking changes: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  async mergeNotesEnhanced(args) {
    const { filenames, output_filename, strategy = 'concat' } = args;

    try {
      let mergedContent = '';
      const allContent = [];

      for (const file of filenames) {
        const filepath = path.join(OBSIDIAN_VAULT_PATH, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
        allContent.push({ file, content: bodyContent });
      }

      if (strategy === 'concat') {
        mergedContent = allContent.map(c => `# From ${c.file}\n\n${c.content}`).join('\n\n---\n\n');
      } else if (strategy === 'deduplicate') {
        const seen = new Set();
        const lines = [];
        
        for (const { content } of allContent) {
          content.split('\n').forEach(line => {
            if (!seen.has(line.trim()) && line.trim()) {
              seen.add(line.trim());
              lines.push(line);
            }
          });
        }
        mergedContent = lines.join('\n');
      } else { // smart
        mergedContent = allContent.map(c => c.content).join('\n\n');
      }

      const frontmatter = `---
title: ${output_filename.replace('.md', '')}
type: merged-note
merged_from: [${filenames.map(f => `"${f}"`).join(', ')}]
created: ${new Date().toISOString()}
tags: ["merged"]
---

`;

      const outputPath = path.join(OBSIDIAN_VAULT_PATH, output_filename.endsWith('.md') ? output_filename : `${output_filename}.md`);
      await fs.writeFile(outputPath, frontmatter + mergedContent, 'utf-8');

      return {
        content: [{
          type: "text",
          text: `Merged ${filenames.length} notes into ${output_filename} using ${strategy} strategy`,
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

  async splitNoteByHeadings(args) {
    const { filename, heading_level = 2, output_folder } = args;
    const filepath = path.join(OBSIDIAN_VAULT_PATH, filename);

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const lines = content.split('\n');
      
      const sections = [];
      let currentSection = { title: 'Header', content: [] };
      const headingRegex = new RegExp(`^#{${heading_level}}\\s+(.+)$`);

      for (const line of lines) {
        const match = line.match(headingRegex);
        
        if (match) {
          if (currentSection.content.length > 0) {
            sections.push(currentSection);
          }
          currentSection = { title: match[1], content: [line] };
        } else {
          currentSection.content.push(line);
        }
      }
      
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }

      const outputDir = output_folder ? path.join(OBSIDIAN_VAULT_PATH, output_folder) : path.join(OBSIDIAN_VAULT_PATH, filename.replace('.md', '-split'));
      await fs.mkdir(outputDir, { recursive: true });

      for (const section of sections) {
        const sectionFilename = this.sanitizeFilename(section.title) + '.md';
        const sectionPath = path.join(outputDir, sectionFilename);
        await fs.writeFile(sectionPath, section.content.join('\n'), 'utf-8');
      }

      return {
        content: [{
          type: "text",
          text: `Split ${filename} into ${sections.length} notes in ${path.basename(outputDir)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error splitting note: ${error.message}`,
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
