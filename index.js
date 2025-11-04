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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Obsidian MCP server running on stdio");
  }
}

const server = new ObsidianMCPServer();
server.run().catch(console.error);
