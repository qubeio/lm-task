# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LM-Tasker is a task management system for development that provides structured, actionable task lists. It uses a simplified architecture where **all task operations are manual** - no AI functionality is included.

**Key Characteristics:**

- **Package Name**: `lm-tasker` (formerly `task-master-ai`)
- **Branding**: Always use "LM-Tasker" (not variations)
- **Manual Operations**: All task management (create, update, status changes) is manual
- **Dual Interface**: CLI (`lm-tasker`) and MCP server for editor integration

## Development Workflow (Essential)

**Follow the workflow defined in [dev_workflow.mdc](.cursor/rules/dev_workflow.mdc)**

### Primary Interaction Methods

1. **MCP Server (Recommended for AI Agents/Editors)**:

   - Use MCP tools like `get_tasks`, `add_subtask`, `set_task_status`
   - Better performance and structured data exchange
   - Refer to [mcp.mdc](.cursor/rules/mcp.mdc) for architecture details
   - See [lmtasker.mdc](.cursor/rules/lmtasker.mdc) for complete tool reference

2. **CLI (For Direct Terminal Use)**:
   - Commands like `lm-tasker list`, `lm-tasker next`, `lm-tasker set-status`
   - Fallback when MCP is unavailable
   - Mirrors MCP tools functionality

### Standard Development Process

1. **Start Projects**: Use `initialize_project` to create initial tasks.json
2. **Begin Sessions**: Run `get_tasks` / `lm-tasker list` to see current tasks
3. **Find Next Work**: Use `next_task` / `lm-tasker next` to identify next task
4. **View Details**: Use `get_task` / `lm-tasker show <id>` for specific task information
5. **Implement**: Code according to task details and dependencies
6. **Update Progress**: Use `set_task_status` / `lm-tasker set-status` to mark completion
7. **Manual Management**: Use `update_task`, `add_task`, `add_subtask` as needed
8. **Generate Files**: Run `generate` / `lm-tasker generate` after task updates

### Manual Subtask Implementation Process

For detailed subtask implementation, follow this workflow:

1. **Understand Goal**: Use `get_task` to understand requirements
2. **Explore & Plan**: Identify files, functions, and code changes needed
3. **Log Plan**: Use `update_subtask` with detailed implementation plan
4. **Verify Plan**: Confirm plan was saved with `get_task`
5. **Set Status**: Mark as `in-progress` with `set_task_status`
6. **Implement & Log**: Regularly update subtask details with findings
7. **Complete**: Mark as `done` after verification

## Configuration Management

### Primary Configuration (`.lmtaskerconfig`)

- Managed via `lm-tasker init` command
- Contains project settings, logging level, and default values
- No AI model configuration required

### Environment Variables

- **Purpose**: Optional configuration for logging and debugging
- **CLI**: Place in `.env` file in project root
- **MCP**: Configure in `env` section of `.cursor/mcp.json`
- **Available variables**: `LMTASKER_LOG_LEVEL`, `DEBUG`

## Task Structure

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
  "subtasks": [...]
}
```

## Key Architecture Principles

### Manual Task Management

- **Manual Task Creation**: All tasks are created manually with detailed descriptions
- **Manual Updates**: Task creation, updates, status changes are all manual
- **No AI Dependencies**: No external AI services or API keys required
- **Full Control**: Complete control over task organization and management

### Task Management Patterns

- **Manual Task Updates**: Direct editing of task properties
- **Dependency Management**: Manual setup using `add_dependency`/`remove_dependency`
- **Task Reorganization**: Use `move_task` to restructure hierarchy
- **Status Tracking**: Simple status changes for progress tracking

### Implementation Drift Handling

- **Manual Updates**: Edit task details when implementation differs from plan
- **Dependency Adjustments**: Update task dependencies as requirements change
- **New Task Creation**: Add discovered tasks manually during implementation

## Available Cursor Rules References

When working with specific aspects of the codebase, refer to these rule files:

- **[architecture.mdc](.cursor/rules/architecture.mdc)**: System architecture and module structure
- **[commands.mdc](.cursor/rules/commands.mdc)**: CLI command implementation patterns
- **[mcp.mdc](.cursor/rules/mcp.mdc)**: MCP server architecture and tool development
- **[lmtasker.mdc](.cursor/rules/lmtasker.mdc)**: Complete command and tool reference
- **[tests.mdc](.cursor/rules/tests.mdc)**: Testing architecture and patterns
- **[tasks.mdc](.cursor/rules/tasks.mdc)**: Task data structure and file format
- **[dependencies.mdc](.cursor/rules/dependencies.mdc)**: Dependency management patterns
- **[utilities.mdc](.cursor/rules/utilities.mdc)**: Core utility functions and conventions
- **[ui.mdc](.cursor/rules/ui.mdc)**: User interface and output formatting
- **[telemetry.mdc](.cursor/rules/telemetry.mdc)**: Usage tracking and monitoring
- **[changeset.mdc](.cursor/rules/changeset.mdc)**: Versioning and release patterns
- **[new_features.mdc](.cursor/rules/new_features.mdc)**: Feature development guidelines
- **[self_improve.mdc](.cursor/rules/self_improve.mdc)**: Rule maintenance and updates

## Common Commands

### Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
npm run test:e2e         # End-to-end tests
```

### Development

```bash
npm run format-check     # Check formatting
npm run format           # Format code
npm run mcp-server       # Start MCP server
npm run inspector        # MCP inspector
```

### Task Management (Examples)

```bash
lm-tasker init                               # Initialize project
lm-tasker list                               # List all tasks
lm-tasker next                               # Show next task
lm-tasker show 1.2                          # Show specific task/subtask
lm-tasker set-status --id=1 --status=done   # Update status
lm-tasker add-task --title="New Task"       # Add task manually
lm-tasker generate                           # Generate task files
```

## Key File Locations

- **Tasks**: `tasks.json` (project root), `tasks/` directory (individual files)
- **Configuration**: `.lmtaskerconfig`, `.env`, `.cursor/mcp.json`
- **Core Logic**: `scripts/modules/`
- **MCP Integration**: `mcp-server/src/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- **Documentation**: `docs/`
