# LM-Tasker - Product Requirements Document

<PRD>

## Package Identity

### Package Information

- **Package Name**: `lm-tasker`
- **Binary Commands**:
  - `lm-tasker`
- **Configuration File**: `.lmtaskerconfig`
- **Project Identity**: "LM-Tasker"

 

### Architecture Overview

The architecture includes:

1. **Manual Task Management**: All task operations (add, update, modify) are manual via CLI/MCP
2. **Reduced Complexity**: Eliminates complex AI prompt engineering for task management
3. **No External Dependencies**: No AI services or API keys required
4. **Predictable Behavior**: Manual operations provide consistent, predictable results
5. **Full Control**: Complete control over task organization and management

# Technical Architecture

## System Components

1. **Task Management Core**

   - Tasks.json file structure (single source of truth)
   - Task model with dependencies, priorities, and metadata
   - Task state management system
   - Task file generation subsystem

2. **Configuration Management Layer**

   - Configuration file management (.lmtaskerconfig)
   - Environment variable handling
   - Project settings and metadata
   - User preference management

3. **Command Line Interface**

   - Command parsing and execution
   - Interactive user input handling
   - Display and formatting utilities
   - Status reporting and feedback system

4. **MCP Server Integration**
   - Model Context Protocol server implementation
   - Tool registration and execution
   - Cursor integration support
   - Structured data exchange

## Data Models

### Task Model

```json
{
  "id": 1,
  "title": "Task Title",
  "description": "Brief task description",
  "status": "pending|done|deferred|in-progress|review|cancelled",
  "dependencies": [0],
  "priority": "high|medium|low",
  "details": "Detailed implementation instructions",
  "testStrategy": "Verification approach details",
  "subtasks": [
    {
      "id": 1,
      "title": "Subtask Title",
      "description": "Subtask description",
      "status": "pending|done|deferred|in-progress|review|cancelled",
      "dependencies": [],
      "details": "Implementation details with timestamped updates"
    }
  ]
}
```

### Tasks Collection Model

```json
{
  "meta": {
    "projectName": "Project Name",
    "version": "1.0.0",
    "prdSource": "PRD.md",
    "createdAt": "ISO-8601 timestamp",
    "updatedAt": "ISO-8601 timestamp"
  },
  "tasks": [
    // Array of Task objects
  ]
}
```

### Task File Format

```
# Task ID: <id>
# Title: <title>
# Status: <status>
# Dependencies: <comma-separated list of dependency IDs>
# Priority: <priority>
# Description: <brief description>
# Details:
<detailed implementation notes>

# Test Strategy:
<verification approach>

# Subtasks:
1. <subtask title> - <subtask description>
```

## APIs and Integrations

1. **File System API**

   - Reading/writing tasks.json
   - Managing individual task files
   - Command execution logging
   - Debug logging system

3. **MCP Protocol Integration**
   - Tool registration and discovery
   - Structured data exchange
   - Session management
   - Error handling and validation

## Infrastructure Requirements

1. **Node.js Runtime**

   - Version 14.0.0 or higher
   - ES Module support
   - File system access rights
   - Command execution capabilities

2. **Configuration Management**

   - .lmtaskerconfig file for basic settings and project configuration
   - Environment variable handling for optional settings
   - Basic configuration management
   - Sensible defaults with overrides

3. **Development Environment**
   - Git repository
   - NPM package management
   - Cursor editor integration with MCP
   - Command-line terminal access

## Specifications

# Specifications

## Manual Task Management

### Task Creation Process

Tasks are managed manually through CLI commands:

- `lm-tasker add-task --title="Task Title" --description="Task description"`
- `lm-tasker update-task --id=1 --title="Updated Title"`
- `lm-tasker set-status --id=1 --status=done`
- Task details are edited directly in task files or through CLI parameters
- All task operations are manual with no external AI dependencies

## Task File System

### Directory Structure

```
/
├── .cursor/
│   └── mcp.json
├── scripts/
│   ├── example_prd.txt
│   └── README.md
├── tasks/
│   ├── task_001.txt
│   ├── task_002.txt
│   ├── tasks.json
│   └── ...
├── .env
├── .env.example
├── .gitignore
├── .lmtaskerconfig
├── package.json
└── README.md
```

### Task ID Specification

- Main tasks: Sequential integers (1, 2, 3, ...)
- Subtasks: Parent ID + dot + sequential integer (1.1, 1.2, 2.1, ...)
- ID references: Used in dependencies, command parameters
- ID ordering: Implies suggested implementation order

## Command-Line Interface

### Global Options

- `--help`: Display help information
- `--version`: Display version information
- `--file=<file>`: Specify an alternative tasks.json file
- `--quiet`: Reduce output verbosity
- `--debug`: Increase output verbosity
- `--json`: Output in JSON format (for programmatic use)

### Command Structure

- `lm-tasker <command> [options]`
- All commands operate on tasks.json by default
- Commands follow consistent parameter naming
- Common parameter styles: `--id=<id>`, `--status=<status>`, `--title="<title>"`, `--description="<text>"`
- Boolean flags: `--all`, `--force`, `--with-subtasks`

## Configuration

### Configuration Management

- Primary config: .lmtaskerconfig file in project root
- Environment variables: Optional settings via .env file
- Project settings: logging, debug, project metadata
- User preferences: Customizable task management settings

## MCP Tool Reference

### Available Tools

- **Task Viewing**: get_tasks, get_task, next_task
- **Task Management**: add_task, update_task, update_subtask, set_task_status
- **Task Structure**: add_subtask, remove_task, clear_subtasks, move_task
- **Dependencies**: add_dependency, remove_dependency, validate_dependencies, fix_dependencies
- **File Generation**: generate

### Tool Categories

1. **Core Operations**: Basic task CRUD operations (manual)
2. **Dependency Management**: Tools for managing task relationships
3. **File Operations**: Tools for generating and managing task files
4. **Configuration**: Tools for system configuration and project management

### Integration Points

- Cursor editor integration via MCP protocol
- CLI fallback for all MCP tools
- Structured data exchange for programmatic access
- Session management for stateful operations

## CLI Command Reference

- `lm-tasker list`: List tasks (optionally filter by status; can include subtasks)
- `lm-tasker next`: Show the next available task based on dependencies and status
- `lm-tasker show <id>`: Display details for a specific task or subtask
- `lm-tasker add-task`: Add a new task
- `lm-tasker update-task --id <id>`: Update task fields
- `lm-tasker update-subtask --id <parentId.subId>`: Append details to a subtask
- `lm-tasker set-status --id <id> --status <status>`: Update task/subtask status
- `lm-tasker add-subtask --parent <id>`: Add a subtask to a task
- `lm-tasker remove-task --id <id>`: Remove a task
- `lm-tasker clear-subtasks --id <id>`: Remove all subtasks from a parent task
- `lm-tasker move --from <id>[,<id>] --to <id>[,<id>]`: Move/reorganize tasks
- `lm-tasker add-dependency --id <id> --depends-on <id>`: Add a dependency
- `lm-tasker remove-dependency --id <id> --depends-on <id>`: Remove a dependency
- `lm-tasker validate-dependencies`: Validate dependency integrity
- `lm-tasker fix-dependencies`: Automatically fix dependency issues
- `lm-tasker generate`: Generate/update Markdown files for tasks

</PRD>
