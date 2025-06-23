# Meta-Development Script

This folder contains a **meta-development script** (`dev.js`) and related utilities that manage tasks for an AI-driven
or traditional software development workflow. The script revolves around a `tasks.json` file, which holds an up-to-date
list of development tasks.

## Overview

In an AI-driven development process—particularly with tools like [Cursor](https://www.cursor.so/)—it's beneficial to
have a **single source of truth** for tasks. This script allows you to:

1. **Parse** a PRD or requirements document (`.md` or `.txt`) to initialize a set of tasks (`tasks.json`).
2. **List** all existing tasks (IDs, statuses, titles).
3. **Update** tasks to accommodate new prompts or architecture changes (useful if you discover "implementation drift").
4. **Generate** individual task files (e.g., `task_001.txt`) for easy reference or to feed into an AI coding workflow.
5. **Set task status**—mark tasks as `done`, `pending`, or `deferred` based on progress.
6. **Add subtasks** to tasks—break down complex tasks into smaller, more manageable subtasks.
7. **Clear subtasks**—remove subtasks from specified tasks to allow regeneration or restructuring.
8. **Show task details**—display detailed information about a specific task and its subtasks.

## Configuration (Updated)

LM-Tasker configuration is now managed through two primary methods:

1.  **`.lmtaskerconfig` File (Project Root - Primary)**

    - Stores AI model selections (`main`, `research`, `fallback`), model parameters (`maxTokens`, `temperature`),
      `logLevel`, `defaultSubtasks`, `defaultPriority`, `projectName`, etc.
    - Managed using the `lm-tasker models --setup` command or the `models` MCP tool.
    - This is the main configuration file for most settings.

2.  **Environment Variables (`.env` File - API Keys Only)**
    - Used **only** for sensitive **API Keys** (e.g., `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`).
    - Create a `.env` file in your project root for CLI usage.
    - See `assets/env.example` for required key names.

**Important:** Settings like `MODEL`, `MAX_TOKENS`, `TEMPERATURE`, `LMTASKER_LOG_LEVEL`, etc., are **no longer set via
`.env`**. Use `lm-tasker models --setup` instead.

## How It Works

1. **`tasks.json`**:

   - A JSON file at the project root containing an array of tasks (each with `id`, `title`, `description`, `status`,
     etc.).
   - The `meta` field can store additional info like the project's name, version, or reference to the PRD.
   - Tasks can have `subtasks` for more detailed implementation steps.
   - Dependencies are displayed with status indicators (✅ for completed, ⏱️ for pending) to easily track progress.

2. **CLI Commands** You can run the commands via:

   ```bash
   # If installed globally
   lm-tasker [command] [options]

   # If using locally within the project
   node scripts/dev.js [command] [options]
   ```

   Available commands:

   - `init`: Initialize a new project
   - `parse-prd`: Generate tasks from a PRD document
   - `list`: Display all tasks with their status
   - `update`: Update tasks based on new information
   - `generate`: Create individual task files
   - `set-status`: Change a task's status
   - `add-subtask`: Add subtasks to a task
   - `clear-subtasks`: Remove subtasks from specified tasks
   - `next`: Determine the next task to work on based on dependencies
   - `show`: Display detailed information about a specific task
   - `add-dependency`: Add a dependency between tasks
   - `remove-dependency`: Remove a dependency from a task
   - `validate-dependencies`: Check for invalid dependencies
   - `fix-dependencies`: Fix invalid dependencies automatically
   - `add-task`: Add a new task using AI

   Run `lm-tasker --help` or `node scripts/dev.js --help` to see detailed usage information.

## Listing Tasks

The `list` command allows you to view all tasks and their status:

```bash
# List all tasks
lm-tasker list

# List tasks with a specific status
lm-tasker list --status=pending

# List tasks and include their subtasks
lm-tasker list --with-subtasks

# List tasks with a specific status and include their subtasks
lm-tasker list --status=pending --with-subtasks
```

## Updating Tasks

The `update` command allows you to update tasks based on new information or implementation changes:

```bash
# Update tasks starting from ID 4 with a new prompt
lm-tasker update --from=4 --prompt="Refactor tasks from ID 4 onward to use Express instead of Fastify"

# Update all tasks (default from=1)
lm-tasker update --prompt="Add authentication to all relevant tasks"

# Specify a different tasks file
lm-tasker update --file=custom-tasks.json --from=5 --prompt="Change database from MongoDB to PostgreSQL"
```

Notes:

- The `--prompt` parameter is required and should explain the changes or new context
- Only tasks that aren't marked as 'done' will be updated
- Tasks with ID >= the specified --from value will be updated

## Setting Task Status

The `set-status` command allows you to change a task's status:

```bash
# Mark a task as done
lm-tasker set-status --id=3 --status=done

# Mark a task as pending
lm-tasker set-status --id=4 --status=pending

# Mark a specific subtask as done
lm-tasker set-status --id=3.1 --status=done

# Mark multiple tasks at once
lm-tasker set-status --id=1,2,3 --status=done
```

Notes:

- When marking a parent task as "done", all of its subtasks will automatically be marked as "done" as well
- Common status values are 'done', 'pending', and 'deferred', but any string is accepted
- You can specify multiple task IDs by separating them with commas
- Subtask IDs are specified using the format `parentId.subtaskId` (e.g., `3.1`)
- Dependencies are updated to show completion status (✅ for completed, ⏱️ for pending) throughout the system

## Adding Subtasks

The `add-subtask` command allows you to manually add subtasks to break down complex tasks:

```bash
# Add a subtask to a specific task
lm-tasker add-subtask --parent=3 --title="Implement user validation"

# Add a subtask with description and details
lm-tasker add-subtask --parent=3 --title="Setup database" --description="Configure PostgreSQL" --details="Install and configure PostgreSQL with proper schemas"

# Convert an existing task to a subtask
lm-tasker add-subtask --parent=3 --task-id=5

# Add a subtask with dependencies
lm-tasker add-subtask --parent=3 --title="API integration" --dependencies="3.1,3.2"
```

## Clearing Subtasks

The `clear-subtasks` command allows you to remove subtasks from specified tasks:

```bash
# Clear subtasks from a specific task
lm-tasker clear-subtasks --id=3

# Clear subtasks from multiple tasks
lm-tasker clear-subtasks --id=1,2,3

# Clear subtasks from all tasks
lm-tasker clear-subtasks --all
```

Notes:

- After clearing subtasks, task files are automatically regenerated
- This is useful when you want to regenerate subtasks with a different approach
- Can be combined with the `add-subtask` command to immediately add new subtasks
- Works with both parent tasks and individual subtasks

## AI Integration (Updated)

- The script now uses a unified AI service layer (`ai-services-unified.js`).
- Model selection (e.g., Claude vs. Perplexity for `--research`) is determined by the configuration in
  `.lmtaskerconfig` based on the requested `role` (`main` or `research`).
- API keys are automatically resolved from your `.env` file (for CLI) or MCP session environment.
- To use the research capabilities (e.g., `add-task --research`), ensure you have:
  1.  Configured a model for the `research` role using `lm-tasker models --setup` (Perplexity models are recommended).
  2.  Added the corresponding API key (e.g., `PERPLEXITY_API_KEY`) to your `.env` file.

## Logging

The script supports different logging levels controlled by the `LMTASKER_LOG_LEVEL` environment variable:

- `debug`: Detailed information, typically useful for troubleshooting
- `info`: Confirmation that things are working as expected (default)
- `warn`: Warning messages that don't prevent execution
- `error`: Error messages that might prevent execution

When `DEBUG=true` is set, debug logs are also written to a `dev-debug.log` file in the project root.

## Managing Task Dependencies

The `add-dependency` and `remove-dependency` commands allow you to manage task dependencies:

```bash
# Add a dependency to a task
lm-tasker add-dependency --id=<id> --depends-on=<id>

# Remove a dependency from a task
lm-tasker remove-dependency --id=<id> --depends-on=<id>
```

These commands:

1. **Allow precise dependency management**:

   - Add dependencies between tasks with automatic validation
   - Remove dependencies when they're no longer needed
   - Update task files automatically after changes

2. **Include validation checks**:

   - Prevent circular dependencies (a task depending on itself)
   - Prevent duplicate dependencies
   - Verify that both tasks exist before adding/removing dependencies
   - Check if dependencies exist before attempting to remove them

3. **Provide clear feedback**:

   - Success messages confirm when dependencies are added/removed
   - Error messages explain why operations failed (if applicable)

4. **Automatically update task files**:
   - Regenerates task files to reflect dependency changes
   - Ensures tasks and their files stay synchronized

## Dependency Validation and Fixing

The script provides two specialized commands to ensure task dependencies remain valid and properly maintained:

### Validating Dependencies

The `validate-dependencies` command allows you to check for invalid dependencies without making changes:

```bash
# Check for invalid dependencies in tasks.json
lm-tasker validate-dependencies

# Specify a different tasks file
lm-tasker validate-dependencies --file=custom-tasks.json
```

This command:

- Scans all tasks and subtasks for non-existent dependencies
- Identifies potential self-dependencies (tasks referencing themselves)
- Reports all found issues without modifying files
- Provides a comprehensive summary of dependency state
- Gives detailed statistics on task dependencies

Use this command to audit your task structure before applying fixes.

### Fixing Dependencies

The `fix-dependencies` command proactively finds and fixes all invalid dependencies:

```bash
# Find and fix all invalid dependencies
lm-tasker fix-dependencies

# Specify a different tasks file
lm-tasker fix-dependencies --file=custom-tasks.json
```

This command:

1. **Validates all dependencies** across tasks and subtasks
2. **Automatically removes**:
   - References to non-existent tasks and subtasks
   - Self-dependencies (tasks depending on themselves)
3. **Fixes issues in both**:
   - The tasks.json data structure
   - Individual task files during regeneration
4. **Provides a detailed report**:
   - Types of issues fixed (non-existent vs. self-dependencies)
   - Number of tasks affected (tasks vs. subtasks)
   - Where fixes were applied (tasks.json vs. task files)
   - List of all individual fixes made

This is especially useful when tasks have been deleted or IDs have changed, potentially breaking dependency chains.

## Finding the Next Task

The `next` command helps you determine which task to work on next based on dependencies and status:

```bash
# Show the next task to work on
lm-tasker next

# Specify a different tasks file
lm-tasker next --file=custom-tasks.json
```

This command:

1. Identifies all **eligible tasks** - pending or in-progress tasks whose dependencies are all satisfied (marked as
   done)
2. **Prioritizes** these eligible tasks by:
   - Priority level (high > medium > low)
   - Number of dependencies (fewer dependencies first)
   - Task ID (lower ID first)
3. **Displays** comprehensive information about the selected task:
   - Basic task details (ID, title, priority, dependencies)
   - Detailed description and implementation details
   - Subtasks if they exist
4. Provides **contextual suggested actions**:
   - Command to mark the task as in-progress
   - Command to mark the task as done when completed
   - Commands for working with subtasks (update status or add new subtasks)

This feature ensures you're always working on the most appropriate task based on your project's current state and
dependency structure.

## Showing Task Details

The `show` command allows you to view detailed information about a specific task:

```bash
# Show details for a specific task
lm-tasker show 1

# Alternative syntax with --id option
lm-tasker show --id=1

# Show details for a subtask
lm-tasker show --id=1.2

# Specify a different tasks file
lm-tasker show 3 --file=custom-tasks.json
```

This command:

1. **Displays comprehensive information** about the specified task:
   - Basic task details (ID, title, priority, dependencies, status)
   - Full description and implementation details
   - Test strategy information
   - Subtasks if they exist
2. **Handles both regular tasks and subtasks**:
   - For regular tasks, shows all subtasks and their status
   - For subtasks, shows the parent task relationship
3. **Provides contextual suggested actions**:
   - Commands to update the task status
   - Commands for working with subtasks
   - For subtasks, provides a link to view the parent task

This command is particularly useful when you need to examine a specific task in detail before implementing it or when
you want to check the status and details of a particular task.
