# LM-Tasker - Claude Code Integration Guide

## Essential Commands

### Core Workflow Commands

```bash
# Project Setup
lm-tasker init                                    # Initialize LM-Tasker in current project
```

# Daily Development Workflow
lm-tasker list                                   # Show all tasks with status
lm-tasker next                                   # Get next available task to work on
lm-tasker show <id>                             # View detailed task information (e.g., lm-tasker show 1.2)
lm-tasker set-status --id=<id> --status=done    # Mark task complete

# Task Management
lm-tasker add-task --title="title" --description="description"  # Add new task manually
lm-tasker add-subtask --parent=<id> --title="subtask"      # Add subtask to existing task



# Dependencies & Organization
lm-tasker add-dependency --id=<id> --depends-on=<id>       # Add task dependency
lm-tasker move --from=<id> --to=<id>                       # Reorganize task hierarchy
lm-tasker validate-dependencies                            # Check for dependency issues
lm-tasker generate                                         # Update task markdown files (usually auto-called)
```

## Key Files & Project Structure

### Core Files

- `tasks/tasks.json` - Main task data file (auto-managed)
- `.lmtaskerconfig` - Project configuration (use `lm-tasker init` to modify)
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
│   ├── task-1.md           # Individual task files
│   └── task-2.md
├── scripts/
│   └── ...                 # Project scripts

├── .claude/
│   ├── settings.json        # Claude Code configuration
│   └── commands/           # Custom slash commands
├── .lmtaskerconfig       # Project settings
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
      "args": ["-y", "--package=lm-tasker", "lm-tasker-mcp"],
      "env": {}
    }
  }
}
```

### Essential MCP Tools

```javascript
help; // = shows available lm-tasker commands
// Project setup
initialize_project; // = lm-tasker init

// Daily workflow
get_tasks; // = lm-tasker list
next_task; // = lm-tasker next
get_task; // = lm-tasker show <id>
set_task_status; // = lm-tasker set-status

// Task management
add_task; // = lm-tasker add-task
add_subtask; // = lm-tasker add-subtask
update_task; // = lm-tasker update-task
update_subtask; // = lm-tasker update-subtask
update; // = lm-tasker update
```

## Claude Code Workflow Integration

### Standard Development Workflow

#### 1. Project Initialization

```bash
# Initialize LM-Tasker
lm-tasker init

# Create tasks manually
lm-tasker add-task --title="Task title" --description="Task description"

# Add subtasks to break down complex tasks
lm-tasker add-subtask --parent=<id> --title="subtask name" --description="subtask description"
```

#### 2. Daily Development Loop

```bash
# Start each session
lm-tasker next                           # Find next available task
lm-tasker show <id>                     # Review task details

# During implementation, manually edit tasks.json or use other commands as needed

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

### API Keys Required

At least **one** of these API keys must be configured:

- `ANTHROPIC_API_KEY` (Claude models) - **Recommended**
- `PERPLEXITY_API_KEY` (Research features) - **Highly recommended**
- `OPENAI_API_KEY` (GPT models)
- `GOOGLE_API_KEY` (Gemini models)
- `MISTRAL_API_KEY` (Mistral models)
- `OPENROUTER_API_KEY` (Multiple models)
- `XAI_API_KEY` (Grok models)

An API key is required for any provider used across any of the 3 roles defined in the `models` command.

### Model Configuration

```bash
# Interactive setup (recommended)
lm-tasker models --setup

# Set specific models
lm-tasker models --set-main claude-3-5-sonnet-20241022
lm-tasker models --set-research perplexity-llama-3.1-sonar-large-128k-online
lm-tasker models --set-fallback gpt-4o-mini
```

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

### Complex Workflows with Checklists

For large migrations or multi-step processes:

1. Create a markdown PRD file describing the new changes: `touch task-migration-checklist.md` (prds can be .txt or .md)
2. Use LM-Tasker to parse the new prd with `lm-tasker parse-prd --append` (also available in MCP)
3. Use LM-Tasker to add subtasks to the newly generated tasks as needed using the `add-subtask` command.
4. Work through items systematically, checking them off as completed
5. Use `lm-tasker update-subtask` to log progress on each task/subtask and/or updating/researching them before/during
   implementation if getting stuck

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

### AI Commands Failing

```bash
# Check API keys are configured
cat .env                           # For CLI usage

# Verify model configuration
lm-tasker models

# Test with different model
lm-tasker models --set-fallback gpt-4o-mini
```

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

DO NOT RE-INITIALIZE. That will not do anything beyond re-adding the same LM-Tasker core files.

## Important Notes

### AI-Powered Operations

These commands make AI calls and may take up to a minute:

- `parse_prd` / `lm-tasker parse-prd`

- `add_task` / `lm-tasker add-task`
- `update` / `lm-tasker update`
- `update_task` / `lm-tasker update-task`
- `update_subtask` / `lm-tasker update-subtask`

### File Management

- Never manually edit `tasks.json` - use commands instead
- Never manually edit `.lmtaskerconfig` - use `lm-tasker models`
- Task markdown files in `tasks/` are auto-generated
- Run `lm-tasker generate` after manual changes to tasks.json

### Claude Code Session Management

- Use `/clear` frequently to maintain focused context
- Create custom slash commands for repeated LM-Tasker workflows
- Configure tool allowlist to streamline permissions
- Use headless mode for automation: `claude -p "lm-tasker next"`

### Multi-Task Updates

- Use `update --from=<id>` to update multiple future tasks
- Use `update-task --id=<id>` for single task updates
- Use `update-subtask --id=<id>` for implementation logging

### Research Mode

- Add `--research` flag for research-based AI enhancement
- Requires a research model API key like Perplexity (`PERPLEXITY_API_KEY`) in environment
- Provides more informed task creation and updates
- Recommended for complex technical tasks

---

_This guide ensures Claude Code has immediate access to LM-Tasker's essential functionality for agentic development
workflows._
