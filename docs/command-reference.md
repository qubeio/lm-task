# LM-Tasker Command Reference

Here's a comprehensive reference of all available commands:

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

## Update a Specific Task

```bash
# Update a single task by ID with new information
lm-tasker update-task --id=<id> --title="New title" --description="New description" --details="New details"
```

## Update a Subtask

```bash
# Append additional information to a specific subtask
lm-tasker update-subtask --id=<parentId.subtaskId> --details="<details>"

# Example: Add details about API rate limiting to subtask 2 of task 5
lm-tasker update-subtask --id=5.2 --details="Add rate limiting of 100 requests per minute"
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
# Add a new task manually with required details (auto-initializes project if tasks.json doesn't exist)
lm-tasker add-task --title="Task title" --description="Task description"

# Add a task with additional details
lm-tasker add-task --title="Task title" --description="Task description" --details="Implementation details"

# Add a task with dependencies
lm-tasker add-task --title="Task title" --description="Task description" --dependencies=1,2,3

# Add a task with priority
lm-tasker add-task --title="Task title" --description="Task description" --priority=high

# Add a task with test strategy
lm-tasker add-task --title="Task title" --description="Task description" --test-strategy="Testing approach"
```

**Note:** All task creation is manual. LM-Tasker focuses on structured task management, providing predictable behavior and full control over your task organization. When you run `add-task` for the first time in a project, it automatically creates the `tasks.json` file and project structure.

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

## Project Initialization

LM-Tasker automatically initializes your project when you create your first task. No separate initialization step is required.

```bash
# Create first task (automatically initializes project structure)
lm-tasker add-task --title="Task Title" --description="Task description"

# Create first task with additional details
lm-tasker add-task --title="Task Title" --description="Task description" --details="Implementation notes" --priority="high"

# Create first task with minimal input
lm-tasker add-task --title="Task Title" --description="Brief description"
```

When you run `add-task` for the first time in a project directory, LM-Tasker will:
- Create a `tasks.json` file with the proper structure
- Create a `tasks/` directory for individual task files
- Set up project metadata (name, version, description)
- Add your first task to the project


