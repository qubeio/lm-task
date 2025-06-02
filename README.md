# Task Master

Author: Andreas Frangopoulos (from forked code)

## Introduction

🚀 **Task Master** is your all-in-one, AI-powered task management sidekick for software development. Supercharge your
workflow with the magic of Azure OpenAI and let Task Master turn your requirements into a crystal-clear, actionable
plan—automatically. Whether you're a solo dev or a whole team, Task Master helps you plan, track, and deliver projects
with less stress and more fun.

### ✨ What can Task Master do?

- 🤖 **AI-Driven Task Generation**: Instantly convert your Product Requirements Document (PRD) into a structured,
  prioritized task list with smart dependencies.
- 🧠 **Intelligent Task Updates**: Use AI to update, split, or clarify tasks as your project evolves—no more manual
  busywork!
- 🔗 **Automatic Dependency Management**: Visualize, validate, and fix task dependencies with a click.
- 🗂️ **Task File Generation**: Generate individual, human-readable task files for every task and subtask.
- 🛠️ **Batch Operations**: Update statuses, reorganize, or move multiple tasks at once for maximum efficiency.
- 🖥️ **Seamless Editor & CLI Integration**: Use the Model Control Protocol (MCP) server for direct editor (Cursor, VS
  Code, Windsurf) integration, or manage everything from the command line.
- 📝 **Comprehensive Documentation**: Auto-generate docs, get help, and see example workflows right in your project.
- 🔒 **Enterprise-Ready**: Built for corporate environments—uses only Azure OpenAI, supports secure config, and tracks
  AI usage/costs.
- 📊 **Telemetry & Cost Tracking**: Monitor AI usage, token counts, and costs to stay in control.
- 🧩 **Extensible & Modular**: Designed for easy customization, future AI providers, and community contributions.

### 🏆 Core Features at a Glance

- **Project Initialization**: Scaffold your project with a single command
- **PRD Parsing**: Turn requirements into tasks in seconds
- **Task CRUD**: Create, read, update, and delete tasks and subtasks
- **Status & Priority**: Track progress and focus on what matters
- **Dependency Tools**: Add, remove, validate, and auto-fix dependencies
- **Batch & Move**: Reorganize your task hierarchy anytime
- **AI-Powered Updates**: Let the AI rewrite or expand tasks as your project changes
- **File Generation**: Keep your task files in sync with your plan
- **Config Management**: Easy model and API key setup
- **Editor Integration**: Use directly from Cursor, VS Code, or Windsurf

🎯 **Task Master is here to help you ship faster, smarter, and with less hassle.**

---

## Requirements

Taskmaster utilizes Azure OpenAI for AI-powered task management operations. You will need:

- **Azure OpenAI API key** (Required)
- **Azure OpenAI endpoint** (Required)

This version is specifically configured for corporate environments using Azure OpenAI services.

## Quick Start

### Option 1: MCP (Recommended)

MCP (Model Control Protocol) lets you run Task Master directly from your editor.

#### 1. Add your MCP config at the following path depending on your editor

| Editor       | Scope   | Linux/macOS Path                      | Windows Path                                      | Key          |
| ------------ | ------- | ------------------------------------- | ------------------------------------------------- | ------------ |
| **Cursor**   | Global  | `~/.cursor/mcp.json`                  | `%USERPROFILE%\.cursor\mcp.json`                  | `mcpServers` |
|              | Project | `<project_folder>/.cursor/mcp.json`   | `<project_folder>\.cursor\mcp.json`               | `mcpServers` |
| **Windsurf** | Global  | `~/.codeium/windsurf/mcp_config.json` | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` | `mcpServers` |
| **VS Code**  | Project | `<project_folder>/.vscode/mcp.json`   | `<project_folder>\.vscode\mcp.json`               | `servers`    |

##### Cursor & Windsurf (`mcpServers`)

```jsonc
{
  "mcpServers": {
    "taskmaster-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "AZURE_OPENAI_API_KEY": "YOUR_AZURE_OPENAI_API_KEY_HERE",
        "AZURE_OPENAI_ENDPOINT": "YOUR_AZURE_OPENAI_ENDPOINT_HERE",
      },
    },
  },
}
```

> 🔑 Replace `YOUR_AZURE_OPENAI_API_KEY_HERE` and `YOUR_AZURE_OPENAI_ENDPOINT_HERE` with your actual Azure OpenAI
> credentials.

##### VS Code (`servers` + `type`)

```jsonc
{
  "servers": {
    "taskmaster-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "AZURE_OPENAI_API_KEY": "YOUR_AZURE_OPENAI_API_KEY_HERE",
        "AZURE_OPENAI_ENDPOINT": "YOUR_AZURE_OPENAI_ENDPOINT_HERE",
      },
      "type": "stdio",
    },
  },
}
```

> 🔑 Replace `YOUR_AZURE_OPENAI_API_KEY_HERE` and `YOUR_AZURE_OPENAI_ENDPOINT_HERE` with your actual Azure OpenAI
> credentials.

#### 2. (Cursor-only) Enable Taskmaster MCP

Open Cursor Settings (Ctrl+Shift+J) ➡ Click on MCP tab on the left ➡ Enable task-master-ai with the toggle

#### 3. (Optional) Configure the Azure OpenAI models you want to use

In your editor's AI chat pane, say:

```txt
Configure the main and fallback models to use Azure OpenAI models like gpt-4o and gpt-4o-mini.
```

Available Azure OpenAI models include: `gpt-4o`, `gpt-4o-mini`, `o3-mini`

#### 4. Initialize Task Master

In your editor's AI chat pane, say:

```txt
Initialize taskmaster-ai in my project
```

#### 5. Make sure you have a PRD in your project root

Task Master will automatically search for PRD files in this order: `PRD.md`, `prd.md`, `PRD.txt`, `prd.txt` in the
project root, then in the `scripts/` directory for backward compatibility.

An example of a PRD is located at `<project_folder>/scripts/example_prd.md` which you can use as a template to create
your `PRD.md` in the project root. A text version is also available at `<project_folder>/scripts/example_prd.txt`.

**Always start with a detailed PRD.**

The more detailed your PRD, the better the generated tasks will be.

#### 6. Common Commands

Use your AI assistant to:

- Parse requirements: `Can you parse my PRD?` (Task Master will automatically find your PRD file)
- Plan next step: `What's the next task I should work on?`
- Implement a task: `Can you help me implement task 3?`
- Add subtasks to a task: `Can you help me add subtasks to task 4?`

[More examples on how to use Task Master in chat](docs/examples.md)

### Option 2: Using Command Line

#### Installation

```bash
# Install globally
npm install -g task-master-ai

# OR install locally within your project
npm install task-master-ai
```

#### Initialize a new project

```bash
# If installed globally
task-master init

# If installed locally
npx task-master init
```

This will prompt you for project details and set up a new project with the necessary files and structure.

#### Common Commands

```bash
# Initialize a new project
task-master init

# Parse a PRD and generate tasks
task-master parse-prd

# List all tasks
task-master list

# Show the next task to work on
task-master next

# Generate task files
task-master generate
```

## Documentation

For more detailed information, check out the documentation in the `docs` directory:

- [Configuration Guide](docs/configuration.md) - Set up environment variables and customize Task Master
- [Tutorial](docs/tutorial.md) - Step-by-step guide to getting started with Task Master
- [Command Reference](docs/command-reference.md) - Complete list of all available commands
- [Task Structure](docs/task-structure.md) - Understanding the task format and features
- [Example Interactions](docs/examples.md) - Common Cursor AI interaction examples

## Troubleshooting

### If `task-master init` doesn't respond

Try running it with Node directly:

```bash
node node_modules/claude-task-master/scripts/init.js
```

Or clone the repository and run:

```bash
cd claude-task-master
node scripts/init.js
```
