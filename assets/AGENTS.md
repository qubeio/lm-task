# LM-Tasker - Claude Code Integration Guide

## Essential Commands

### Core Workflow Commands

```bash
# Daily Development Workflow
lm-tasker list                                   # Show all tasks with status
lm-tasker next                                   # Get next available task to work on
lm-tasker show <id>                             # View detailed task information (e.g., lm-tasker show 1.2)
lm-tasker set-status --id=<id> --status=done    # Mark task complete

# Task Management
lm-tasker add-task --title="title" --description="description"  # Add new task manually (auto-creates tasks.json if needed)
lm-tasker add-subtask --parent=<id> --title="subtask"      # Add subtask to existing task
lm-tasker update-task --id=<id> --details="notes"         # Append notes to task
lm-tasker update-subtask --id=<id> --details="notes"      # Append notes to subtask

# Dependencies & Organization
lm-tasker add-dependency --id=<id> --depends-on=<id>       # Add task dependency
lm-tasker move --from=<id> --to=<id>                       # Reorganize task hierarchy
lm-tasker validate-dependencies                            # Check for dependency issues
lm-tasker generate                                         # Update task markdown files (usually auto-called)
```

## Key Files & Project Structure

### Core Files

- `tasks/tasks.json` - Main task data file (auto-managed)
- `tasks/*.txt` - Individual task files (auto-generated from tasks.json)
- `.env` - Optional environment variables for logging and debugging

### Claude Code Integration Files

- `CLAUDE.md` - Auto-loaded context for Claude Code (this file)
- `.claude/settings.json` - Claude Code tool allowlist and preferences
- `.claude/commands/` - Custom slash commands for repeated workflows
- `.mcp.json` - MCP server configuration (project-specific)

### Directory Structure

```
project/
├── tasks/
│   ├── tasks.json           # Main task database
│   ├── task-1.txt          # Individual task files
│   └── task-2.txt
├── scripts/
│   └── ...                 # Project scripts
├── .claude/
│   ├── settings.json        # Claude Code configuration
│   └── commands/           # Custom slash commands
├── .env                    # Optional environment variables
├── .mcp.json              # MCP configuration
└── CLAUDE.md              # This file - auto-loaded by Claude Code
```

## MCP Integration

LM-Tasker provides an MCP server that Claude Code can connect to. Configure in `.mcp.json`:

```json
{
  "mcpServers": {
    "lm-tasker": {
      "command": "npx",
      "args": ["-y", "--package=@qubeio/lm-tasker", "lm-tasker-mcp"],
      "env": {}
    }
  }
}
```

### Essential MCP Tools

```javascript
// Daily workflow
get_tasks         // = lm-tasker list
next_task         // = lm-tasker next
get_task          // = lm-tasker show <id>
set_task_status   // = lm-tasker set-status

// Task management
add_task          // = lm-tasker add-task (auto-creates tasks.json if needed)
add_subtask       // = lm-tasker add-subtask
update_task       // = lm-tasker update-task
update_subtask    // = lm-tasker update-subtask

// Organization
move_task         // = lm-tasker move
add_dependency    // = lm-tasker add-dependency
remove_dependency // = lm-tasker remove-dependency
validate_dependencies // = lm-tasker validate-dependencies
```

## Claude Code Workflow Integration

### Standard Development Workflow

#### 1. Project Initialization

```bash
# Create first task (auto-creates tasks.json and project structure)
lm-tasker add-task --title="Task title" --description="Task description"

# Add subtasks to break down complex tasks
lm-tasker add-subtask --parent=<id> --title="subtask name" --description="subtask description"
```

#### 2. Daily Development Loop

```bash
# Start each session
lm-tasker next                           # Find next available task
lm-tasker show <id>                     # Review task details

# During implementation, log progress
lm-tasker update-subtask --id=<id> --details="Implementation notes and progress"

# Complete tasks
lm-tasker set-status --id=<id> --status=done
```

#### 3. Multi-Claude Workflows

For complex projects, use multiple Claude Code sessions:

```bash
# Terminal 1: Main implementation
cd project && claude

# Terminal 2: Testing and validation
cd project-test-worktree && claude

# Terminal 3: Documentation updates
cd project-docs-worktree && claude
```

### Custom Slash Commands

Create `.claude/commands/lm-tasker-next.md`:

```markdown
Find the next available LM-Tasker task and show its details.

Steps:
1. Run `lm-tasker next` to get the next task
2. If a task is available, run `lm-tasker show <id>` for full details
3. Provide a summary of what needs to be implemented
4. Suggest the first implementation step
```

Create `.claude/commands/lm-tasker-complete.md`:

```markdown
Complete a LM-Tasker task: $ARGUMENTS

Steps:
1. Review the current task with `lm-tasker show $ARGUMENTS`
2. Verify all implementation is complete
3. Run any tests related to this task
4. Mark as complete: `lm-tasker set-status --id=$ARGUMENTS --status=done`
5. Show the next available task with `lm-tasker next`
```

## Tool Allowlist Recommendations

Add to `.claude/settings.json`:

```json
{
  "allowedTools": [
    "Edit",
    "Bash(lm-tasker *)",
    "Bash(git commit:*)",
    "Bash(git add:*)",
    "Bash(npm run *)",
    "mcp__lm_tasker__*"
  ]
}
```

## Configuration & Setup

### Environment Variables (Optional)

- `LMTASKER_LOG_LEVEL` - Set logging level (debug, info, warn, error)
- `DEBUG` - Enable debug output

## Task Structure & IDs

### Task ID Format

- Main tasks: `1`, `2`, `3`, etc.
- Subtasks: `1.1`, `1.2`, `2.1`, etc.
- Sub-subtasks: `1.1.1`, `1.1.2`, etc.

### Task Status Values

- `pending` - Ready to work on
- `in-progress` - Currently being worked on
- `done` - Completed and verified
- `deferred` - Postponed
- `cancelled` - No longer needed
- `blocked` - Waiting on external factors
- `review` - Ready for review

### Task Fields

```json
{
  "id": "1.2",
  "title": "Implement user authentication",
  "description": "Set up JWT-based auth system",
  "status": "pending",
  "priority": "high",
  "dependencies": ["1.1"],
  "details": "Use bcrypt for hashing, JWT for tokens...",
  "testStrategy": "Unit tests for auth functions, integration tests for login flow",
  "subtasks": []
}
```

## Claude Code Best Practices with LM-Tasker

### Context Management

- Use `/clear` between different tasks to maintain focus
- This CLAUDE.md file is automatically loaded for context
- Use `lm-tasker show <id>` to pull specific task context when needed

### Iterative Implementation

1. `lm-tasker show <subtask-id>` - Understand requirements
2. Explore codebase and plan implementation
3. `lm-tasker update-subtask --id=<id> --details="detailed plan"` - Log plan
4. `lm-tasker set-status --id=<id> --status=in-progress` - Start work
5. Implement code following logged plan
6. `lm-tasker update-subtask --id=<id> --details="what worked/didn't work"` - Log progress
7. `lm-tasker set-status --id=<id> --status=done` - Complete task

### Git Integration

LM-Tasker works well with `gh` CLI:

```bash
# Create PR for completed task
gh pr create --title "Complete task 1.2: User authentication" --body "Implements JWT auth system as specified in task 1.2"

# Reference task in commits
git commit -m "feat: implement JWT auth (task 1.2)"
```

### Parallel Development with Git Worktrees

```bash
# Create worktrees for parallel task development
git worktree add ../project-auth feature/auth-system
git worktree add ../project-api feature/api-refactor

# Run Claude Code in each worktree
cd ../project-auth && claude    # Terminal 1: Auth work
cd ../project-api && claude     # Terminal 2: API work
```

## Troubleshooting

### MCP Connection Issues

- Check `.mcp.json` configuration
- Verify Node.js installation
- Use `--mcp-debug` flag when starting Claude Code
- Use CLI as fallback if MCP unavailable

### Task File Sync Issues

```bash
# Regenerate task files from tasks.json
lm-tasker generate

# Fix dependency issues
lm-tasker fix-dependencies
```

## Important Notes

### Manual Operations

LM-Tasker is a purely manual task management system:
- All task creation, updates, and modifications are manual operations
- No AI functionality is included
- Full control over task organization and management

### File Management

- Never manually edit `tasks.json` - use commands instead
- Task markdown files in `tasks/` are auto-generated
- Run `lm-tasker generate` after manual changes to tasks.json if needed

### Claude Code Session Management

- Use `/clear` frequently to maintain focused context
- Create custom slash commands for repeated LM-Tasker workflows
- Configure tool allowlist to streamline permissions
- Use headless mode for automation: `claude -p "lm-tasker next"`

### Multi-Task Updates

- Use `update-task --id=<id>` for single task updates
- Use `update-subtask --id=<id>` for implementation logging
- Both commands append timestamped details to existing content

---

_This guide ensures Claude Code has immediate access to LM-Tasker's essential functionality for manual task management workflows._
