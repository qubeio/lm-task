# LM-Tasker

## Introduction

🚀 **LM-Tasker** is your all-in-one, task management sidekick for software development. Create, organize, and track your tasks with a powerful, manual task management system. Whether you're a solo dev or a whole team, LM-Tasker helps you plan, track, and deliver projects with less stress and more fun.

### ✨ What can LM-Tasker do?

- 📝 **Manual Task Management**: Create, organize, and track tasks with a powerful, structured approach.
- 🔗 **Dependency Management**: Visualize, validate, and fix task dependencies with a click.
- 🗂️ **Task File Generation**: Generate individual, human-readable task files for every task and subtask.
- 🛠️ **Batch Operations**: Update statuses, reorganize, or move multiple tasks at once for maximum efficiency.
- 🖥️ **Seamless Editor & CLI Integration**: Use the Model Control Protocol (MCP) server for direct editor (Cursor, VS
  Code, Windsurf) integration, or manage everything from the command line.
- 📝 **Comprehensive Documentation**: Get help and see example workflows right in your project.
- 🔒 **Enterprise-Ready**: Built for corporate environments with secure configuration and modular design.
- 🧩 **Extensible & Modular**: Designed for easy customization and community contributions.

### 🏆 Core Features at a Glance

- **Project Initialization**: Scaffold your project with a single command
- **Manual Task Creation**: Create tasks and subtasks with detailed descriptions
- **Task CRUD**: Create, read, update, and delete tasks and subtasks
- **Status & Priority**: Track progress and focus on what matters
- **Dependency Tools**: Add, remove, validate, and auto-fix dependencies
- **Batch & Move**: Reorganize your task hierarchy anytime
- **Manual Task Updates**: Update and expand tasks as your project changes
- **File Generation**: Keep your task files in sync with your plan
- **Config Management**: Easy setup and configuration
- **Editor Integration**: Use directly from Cursor, VS Code, or Windsurf

🎯 **LM-Tasker is here to help you ship faster, smarter, and with less hassle.**

---

## Requirements

LM-Tasker is a manual task management system with no external dependencies. You will need:

- **Node.js** (v14 or higher)
- **npm** or **yarn** for package management

LM-Tasker works offline and doesn't require any API keys or external services.

## Quick Start

### Option 1: MCP (Recommended)

MCP (Model Control Protocol) lets you run LM-Tasker directly from your editor.

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
    "lm-tasker": {
      "command": "npx",
      "args": ["-y", "--package=@qubeio/lm-tasker", "lm-tasker-mcp"],
      "env": {},
    },
  },
}
```

##### VS Code (`servers` + `type`)

```jsonc
{
  "servers": {
    "lm-tasker": {
      "command": "npx",
      "args": ["-y", "--package=@qubeio/lm-tasker", "lm-tasker-mcp"],
      "env": {},
      "type": "stdio",
    },
  },
}
```

#### 2. (Cursor-only) Enable LM-Tasker MCP

Open Cursor Settings (Ctrl+Shift+J) ➡ Click on MCP tab on the left ➡ Enable lm-tasker with the toggle

#### 3. Initialize LM-Tasker

In your editor's AI chat pane, say:

```txt
Initialize lm-tasker in my project
```

#### 4. Create Your Tasks

LM-Tasker uses manual task creation. You can create tasks using the MCP tools or CLI commands.

#### 5. Common Commands

Use your AI assistant to:

- Create tasks: `Can you create a new task for implementing user authentication?`
- Plan next step: `What's the next task I should work on?`
- Implement a task: `Can you help me implement task 3?`
- Add subtasks to a task: `Can you help me add subtasks to task 4?`

[More examples on how to use LM-Tasker in chat](docs/examples.md)

### Option 2: Using Command Line

#### Installation

```bash
# Install globally
npm install -g @qubeio/lm-tasker

# OR install locally within your project
npm install @qubeio/lm-tasker
```

#### Initialize a new project

```bash
# If installed globally
lm-tasker init

# If installed locally
npx @qubeio/lm-tasker init
```

This will prompt you for project details and set up a new project with the necessary files and structure.

#### Common Commands

```bash
# Initialize a new project
lm-tasker init

# List all tasks
lm-tasker list

# Show the next task to work on
lm-tasker next

# Generate task files
lm-tasker generate
```

## Documentation

For more detailed information, check out the documentation in the `docs` directory:

- [Configuration Guide](docs/configuration.md) - Set up environment variables and customize LM-Tasker
- [Tutorial](docs/tutorial.md) - Step-by-step guide to getting started with LM-Tasker
- [Command Reference](docs/command-reference.md) - Complete list of all available commands
- [Task Structure](docs/task-structure.md) - Understanding the task format and features
- [Example Interactions](docs/examples.md) - Common Cursor AI interaction examples

## Troubleshooting

### If `lm-tasker init` doesn't respond

Try running it with Node directly:

```bash
node node_modules/lm-tasker/scripts/init.js
```

Or clone the repository and run:

```bash
cd lm-tasker
node scripts/init.js
```
