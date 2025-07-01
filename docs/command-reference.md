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
lm-tasker next
```

## Show Specific Task

```bash
# Show details of a specific task
lm-tasker show <id>
# or
lm-tasker show --id=<id>

# View a specific subtask (e.g., subtask 2 of task 1)
lm-tasker show 1.2
```

## Update Tasks

```bash
# Update tasks from a specific ID and provide context
lm-tasker update --from=<id> --prompt="<prompt>"
```

## Update a Specific Task

```bash
# Update a single task by ID with new information
lm-tasker update-task --id=<id> --prompt="<prompt>"
```

## Update a Subtask

```bash
# Append additional information to a specific subtask
lm-tasker update-subtask --id=<parentId.subtaskId> --prompt="<prompt>"

# Example: Add details about API rate limiting to subtask 2 of task 5
lm-tasker update-subtask --id=5.2 --prompt="Add rate limiting of 100 requests per minute"
```

Unlike the `update-task` command which replaces task information, the `update-subtask` command _appends_ new information
to the existing subtask details, marking it with a timestamp. This is useful for iteratively enhancing subtasks while
preserving the original content.

## Generate Task Files

```bash
# Generate individual task files from tasks.json
lm-tasker generate
```

## Set Task Status

```bash
# Set status of a single task
lm-tasker set-status --id=<id> --status=<status>

# Set status for multiple tasks
lm-tasker set-status --id=1,2,3 --status=<status>

# Set status for subtasks
lm-tasker set-status --id=1.1,1.2 --status=<status>
```

When marking a task as "done", all of its subtasks will automatically be marked as "done" as well.

## Clear Subtasks

```bash
# Clear subtasks from a specific task
lm-tasker clear-subtasks --id=<id>

# Clear subtasks from multiple tasks
lm-tasker clear-subtasks --id=1,2,3

# Clear subtasks from all tasks
lm-tasker clear-subtasks --all
```

## Managing Task Dependencies

```bash
# Add a dependency to a task
lm-tasker add-dependency --id=<id> --depends-on=<id>

# Remove a dependency from a task
lm-tasker remove-dependency --id=<id> --depends-on=<id>

# Validate dependencies without fixing them
lm-tasker validate-dependencies

# Find and fix invalid dependencies automatically
lm-tasker fix-dependencies
```

## Move Tasks

```bash
# Move a task or subtask to a new position
lm-tasker move --from=<id> --to=<id>

# Examples:
# Move task to become a subtask
lm-tasker move --from=5 --to=7

# Move subtask to become a standalone task
lm-tasker move --from=5.2 --to=7

# Move subtask to a different parent
lm-tasker move --from=5.2 --to=7.3

# Reorder subtasks within the same parent
lm-tasker move --from=5.2 --to=5.4

# Move a task to a new ID position (creates placeholder if doesn't exist)
lm-tasker move --from=5 --to=25

# Move multiple tasks at once (must have the same number of IDs)
lm-tasker move --from=10,11,12 --to=16,17,18
```

## Add a New Task

```bash
# Add a new task manually with required details
lm-tasker add-task --title="Task title" --description="Task description"

# Add a task with additional details
lm-tasker add-task --title="Task title" --description="Task description" --details="Implementation details"

# Add a task with dependencies
lm-tasker add-task --title="Task title" --description="Task description" --dependencies=1,2,3

# Add a task with priority
lm-tasker add-task --title="Task title" --description="Task description" --priority=high

# Add a task with test strategy
lm-tasker add-task --title="Task title" --description="Task description" --test-strategy="Testing approach"

# Legacy AI-assisted task creation (limited functionality)
lm-tasker add-task --prompt="Description of the new task"
```

**Note:** Manual task creation is the recommended approach. The AI-assisted option (`--prompt`) provides limited
functionality and may be deprecated in future versions.

## Add a New Subtask

```bash
# Add a new subtask manually
lm-tasker add-subtask --parent=<id> --title="Subtask title" --description="Subtask description"

# Add a subtask with additional details
lm-tasker add-subtask --parent=<id> --title="Subtask title" --description="Subtask description" --details="Implementation details"

# Add a subtask with dependencies
lm-tasker add-subtask --parent=<id> --title="Subtask title" --description="Subtask description" --dependencies=1,2.1

# Add a subtask with specific status
lm-tasker add-subtask --parent=<id> --title="Subtask title" --description="Subtask description" --status=in-progress

# Convert an existing task to a subtask
lm-tasker add-subtask --parent=<id> --task-id=<existing-task-id>
```

## Remove Tasks and Subtasks

```bash
# Remove a task permanently
lm-tasker remove-task --id=<id>

# Remove multiple tasks
lm-tasker remove-task --id=1,2,3

# Remove a subtask
lm-tasker remove-subtask --id=<parentId.subtaskId>

# Convert a subtask to a standalone task instead of removing it
lm-tasker remove-subtask --id=<parentId.subtaskId> --convert
```

## Initialize a Project

```bash
# Initialize a new project with LM-Tasker structure
lm-tasker init

# Initialize with project details
lm-tasker init --name="Project Name" --description="Project description" --version="1.0.0"

# Initialize without prompts using defaults
lm-tasker init --yes
```

## Configure AI Models

```bash
# View current AI model configuration and API key status
lm-tasker models

# Set the primary model for PRD parsing
lm-tasker models --set-main=gpt-4o

# Set the fallback model for PRD parsing
lm-tasker models --set-fallback=gpt-4o-mini

# Run interactive setup to configure models
lm-tasker models --setup
```

**AI Usage:** LM-Tasker uses AI primarily for PRD parsing operations. Task management operations (create, update,
modify) are designed to be manual for predictable and cost-effective project management.

Configuration is stored in `.lmtaskerconfig` in your project root. API keys are managed via `.env` or MCP configuration.
This version supports multiple AI providers including Azure OpenAI, OpenAI, Anthropic Claude, Google Gemini, Mistral,
Perplexity, XAI, and Ollama.
