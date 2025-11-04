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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Obsidian MCP server running on stdio");
  }
}

const server = new ObsidianMCPServer();
server.run().catch(console.error);
