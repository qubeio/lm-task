# LM-Tasker Command Reference

Here's a comprehensive reference of all available commands:

## Parse PRD

```bash
# Parse a PRD file and generate tasks (auto-detects PRD.md, prd.md, PRD.txt, prd.txt in project root)
lm-tasker parse-prd

# Parse a specific PRD file
lm-tasker parse-prd <prd-file.md>

# Limit the number of tasks generated
lm-tasker parse-prd --num-tasks=10

# Parse a specific file with custom task count
lm-tasker parse-prd <prd-file.md> --num-tasks=10
```

## List Tasks

```bash
# List all tasks
lm-tasker list

# List tasks with a specific status
lm-tasker list --status=<status>

# List tasks with subtasks
lm-tasker list --with-subtasks

# List tasks with a specific status and include subtasks
lm-tasker list --status=<status> --with-subtasks
```

## Show Next Task

```bash
# Show the next task to work on based on dependencies and status
task-master next
```

## Show Specific Task

```bash
# Show details of a specific task
task-master show <id>
# or
task-master show --id=<id>

# View a specific subtask (e.g., subtask 2 of task 1)
task-master show 1.2
```

## Update Tasks

```bash
# Update tasks from a specific ID and provide context
task-master update --from=<id> --prompt="<prompt>"
```

## Update a Specific Task

```bash
# Update a single task by ID with new information
task-master update-task --id=<id> --prompt="<prompt>"
```

## Update a Subtask

```bash
# Append additional information to a specific subtask
task-master update-subtask --id=<parentId.subtaskId> --prompt="<prompt>"

# Example: Add details about API rate limiting to subtask 2 of task 5
task-master update-subtask --id=5.2 --prompt="Add rate limiting of 100 requests per minute"
```

Unlike the `update-task` command which replaces task information, the `update-subtask` command _appends_ new information
to the existing subtask details, marking it with a timestamp. This is useful for iteratively enhancing subtasks while
preserving the original content.

## Generate Task Files

```bash
# Generate individual task files from tasks.json
task-master generate
```

## Set Task Status

```bash
# Set status of a single task
task-master set-status --id=<id> --status=<status>

# Set status for multiple tasks
task-master set-status --id=1,2,3 --status=<status>

# Set status for subtasks
task-master set-status --id=1.1,1.2 --status=<status>
```

When marking a task as "done", all of its subtasks will automatically be marked as "done" as well.

## Clear Subtasks

```bash
# Clear subtasks from a specific task
task-master clear-subtasks --id=<id>

# Clear subtasks from multiple tasks
task-master clear-subtasks --id=1,2,3

# Clear subtasks from all tasks
task-master clear-subtasks --all
```

## Managing Task Dependencies

```bash
# Add a dependency to a task
task-master add-dependency --id=<id> --depends-on=<id>

# Remove a dependency from a task
task-master remove-dependency --id=<id> --depends-on=<id>

# Validate dependencies without fixing them
task-master validate-dependencies

# Find and fix invalid dependencies automatically
task-master fix-dependencies
```

## Move Tasks

```bash
# Move a task or subtask to a new position
task-master move --from=<id> --to=<id>

# Examples:
# Move task to become a subtask
task-master move --from=5 --to=7

# Move subtask to become a standalone task
task-master move --from=5.2 --to=7

# Move subtask to a different parent
task-master move --from=5.2 --to=7.3

# Reorder subtasks within the same parent
task-master move --from=5.2 --to=5.4

# Move a task to a new ID position (creates placeholder if doesn't exist)
task-master move --from=5 --to=25

# Move multiple tasks at once (must have the same number of IDs)
task-master move --from=10,11,12 --to=16,17,18
```

## Add a New Task

```bash
# Add a new task using AI
task-master add-task --prompt="Description of the new task"

# Add a task with dependencies
task-master add-task --prompt="Description" --dependencies=1,2,3

# Add a task with priority
task-master add-task --prompt="Description" --priority=high
```

## Initialize a Project

```bash
# Initialize a new project with LM-Tasker structure
lm-tasker init
```

## Configure AI Models

```bash
# View current AI model configuration and API key status
task-master models

# Set the primary model for generation/updates
task-master models --set-main=gpt-4o

# Set the fallback model
task-master models --set-fallback=gpt-4o-mini

# Run interactive setup to configure Azure OpenAI models
task-master models --setup
```

Configuration is stored in `.lmtaskerconfig` in your project root. API keys are managed via `.env` or MCP
configuration. This version only supports Azure OpenAI models: `gpt-4o`, `gpt-4o-mini`, and `o3-mini`.
