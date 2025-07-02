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
7. **Research-backed subtask generation**—use Perplexity AI to generate more informed and contextually relevant
   subtasks.
8. **Clear subtasks**—remove subtasks from specified tasks to allow regeneration or restructuring.
9. **Show task details**—display detailed information about a specific task and its subtasks.

## Configuration

The script can be configured through environment variables in a `.env` file at the root of the project:

### Required Configuration

- `ANTHROPIC_API_KEY`: Your Anthropic API key for Claude

### Optional Configuration

- `MODEL`: Specify which Claude model to use (default: "claude-3-7-sonnet-20250219")
- `MAX_TOKENS`: Maximum tokens for model responses (default: 4000)
- `TEMPERATURE`: Temperature for model responses (default: 0.7)
- `PERPLEXITY_API_KEY`: Your Perplexity API key for research-backed subtask generation
- `PERPLEXITY_MODEL`: Specify which Perplexity model to use (default: "sonar-medium-online")
- `DEBUG`: Enable debug logging (default: false)
- `TASKMASTER_LOG_LEVEL`: Log level - debug, info, warn, error (default: info)
- `DEFAULT_SUBTASKS`: Default number of subtasks when creating (default: 3)
- `DEFAULT_PRIORITY`: Default priority for generated tasks (default: medium)
- `PROJECT_NAME`: Override default project name in tasks.json
- `PROJECT_VERSION`: Override default version in tasks.json

## How It Works

1. **`tasks.json`**:

   - A JSON file at the project root containing an array of tasks (each with `id`, `title`, `description`, `status`,
     etc.).
   - The `meta` field can store additional info like the project's name, version, or reference to the PRD.
   - Tasks can have `subtasks` for more detailed implementation steps.
   - Dependencies are displayed with status indicators (✅ for completed, ⏱️ for pending) to easily track progress.

2. **Script Commands** You can run the script via:

   ```bash
   node scripts/dev.js [command] [options]
   ```

   Available commands:

   - `parse-prd`: Generate tasks from a PRD document
   - `list`: Display all tasks with their status
   - `update`: Update tasks based on new information
   - `generate`: Create individual task files
   - `set-status`: Change a task's status
   - `add-subtask`: Add subtasks to a task
   - `clear-subtasks`: Remove subtasks from specified tasks
   - `next`: Determine the next task to work on based on dependencies
   - `show`: Display detailed information about a specific task

   Run `node scripts/dev.js` without arguments to see detailed usage information.

## Listing Tasks

The `list` command allows you to view all tasks and their status:

```bash
# List all tasks
node scripts/dev.js list

# List tasks with a specific status
node scripts/dev.js list --status=pending

# List tasks and include their subtasks
node scripts/dev.js list --with-subtasks

# List tasks with a specific status and include their subtasks
node scripts/dev.js list --status=pending --with-subtasks
```

## Updating Tasks

The `update` command allows you to update tasks based on new information or implementation changes:

```bash
# Update tasks starting from ID 4 with a new prompt
node scripts/dev.js update-task --id=4 --title="Use Express Framework" --description="Refactor to use Express instead of Fastify"

# Update all tasks (default from=1)
node scripts/dev.js add-task --title="Add Authentication" --description="Add authentication to all relevant tasks"

# With research-backed updates using Perplexity AI
node scripts/dev.js update-task --id=4 --title="OAuth 2.0 Integration" --description="Integrate OAuth 2.0 authentication"

# Specify a different tasks file
node scripts/dev.js update-task --file=custom-tasks.json --id=5 --title="Use PostgreSQL Database" --description="Change database from MongoDB to PostgreSQL"
```

Notes:

- Manual updates only - use --title and --description parameters to specify changes
- Only tasks that aren't marked as 'done' will be updated
- Tasks with ID >= the specified --from value will be updated
- The `--research` flag uses Perplexity AI for more informed updates when available

## Updating a Single Task

The `update-task` command allows you to update a specific task instead of multiple tasks:

```bash
# Update a specific task with new information
node scripts/dev.js update-task --id=4 --title="JWT Authentication" --description="Use JWT for authentication"

# With research-backed updates using Perplexity AI
node scripts/dev.js update-task --id=4 --title="JWT Authentication" --description="Use JWT for authentication with best practices research"
```

This command:

- Updates only the specified task rather than a range of tasks
- Provides detailed validation with helpful error messages
- Checks for required API keys when using research mode
- Falls back gracefully if Perplexity API is unavailable
- Preserves tasks that are already marked as "done"
- Includes contextual error handling for common issues

## Setting Task Status

The `set-status` command allows you to change a task's status:

```bash
# Mark a task as done
node scripts/dev.js set-status --id=3 --status=done

# Mark a task as pending
node scripts/dev.js set-status --id=4 --status=pending

# Mark a specific subtask as done
node scripts/dev.js set-status --id=3.1 --status=done

# Mark multiple tasks at once
node scripts/dev.js set-status --id=1,2,3 --status=done
```

Notes:

- When marking a parent task as "done", all of its subtasks will automatically be marked as "done" as well
- Common status values are 'done', 'pending', and 'deferred', but any string is accepted
- You can specify multiple task IDs by separating them with commas
- Subtask IDs are specified using the format `parentId.subtaskId` (e.g., `3.1`)
- Dependencies are updated to show completion status (✅ for completed, ⏱️ for pending) throughout the system

## Adding Subtasks

You can manually add subtasks to break down complex tasks using the `add-subtask` command:

```bash
# Add a subtask to a parent task
node scripts/dev.js add-subtask --parent=3 --title="Implement authentication" --description="Set up user authentication system"

# Add a subtask with dependencies
node scripts/dev.js add-subtask --parent=3 --title="Setup database" --dependencies="1,2"

# Convert an existing task to a subtask
node scripts/dev.js add-subtask --parent=5 --task-id=8
```

## Clearing Subtasks

The `clear-subtasks` command allows you to remove subtasks from specified tasks:

```bash
# Clear subtasks from a specific task
node scripts/dev.js clear-subtasks --id=3

# Clear subtasks from multiple tasks
node scripts/dev.js clear-subtasks --id=1,2,3

# Clear subtasks from all tasks
node scripts/dev.js clear-subtasks --all
```

Notes:

- After clearing subtasks, task files are automatically regenerated
- This is useful when you want to regenerate subtasks with a different approach
- Can be combined with the `add-subtask` command to immediately add new subtasks
- Works with both parent tasks and individual subtasks

## AI Integration

The script integrates with two AI services:

1. **Anthropic Claude**: Used for parsing PRDs, generating tasks, and creating subtasks.
2. **Perplexity AI**: Used for research-backed subtask generation when the `--research` flag is specified.

The Perplexity integration uses the OpenAI client to connect to Perplexity's API, which provides enhanced research
capabilities for generating more informed subtasks. If the Perplexity API is unavailable or encounters an error, the
script will automatically fall back to using Anthropic's Claude.

To use the Perplexity integration:

1. Obtain a Perplexity API key
2. Add `PERPLEXITY_API_KEY` to your `.env` file
3. Optionally specify `PERPLEXITY_MODEL` in your `.env` file (default: "sonar-medium-online")
4. Use research-backed features when adding subtasks with detailed descriptions

## Logging

The script supports different logging levels controlled by the `TASKMASTER_LOG_LEVEL` environment variable:

- `debug`: Detailed information, typically useful for troubleshooting
- `info`: Confirmation that things are working as expected (default)
- `warn`: Warning messages that don't prevent execution
- `error`: Error messages that might prevent execution

When `DEBUG=true` is set, debug logs are also written to a `dev-debug.log` file in the project root.

## Managing Task Dependencies

The `add-dependency` and `remove-dependency` commands allow you to manage task dependencies:

```bash
# Add a dependency to a task
node scripts/dev.js add-dependency --id=<id> --depends-on=<id>

# Remove a dependency from a task
node scripts/dev.js remove-dependency --id=<id> --depends-on=<id>
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
node scripts/dev.js validate-dependencies

# Specify a different tasks file
node scripts/dev.js validate-dependencies --file=custom-tasks.json
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
node scripts/dev.js fix-dependencies

# Specify a different tasks file
node scripts/dev.js fix-dependencies --file=custom-tasks.json
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
node scripts/dev.js next

# Specify a different tasks file
node scripts/dev.js next --file=custom-tasks.json
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
node scripts/dev.js show 1

# Alternative syntax with --id option
node scripts/dev.js show --id=1

# Show details for a subtask
node scripts/dev.js show --id=1.2

# Specify a different tasks file
node scripts/dev.js show 3 --file=custom-tasks.json
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

## Enhanced Error Handling

The script now includes improved error handling throughout all commands:

1. **Detailed Validation**:

   - Required parameters (like task IDs and prompts) are validated early
   - File existence is checked with customized errors for common scenarios
   - Parameter type conversion is handled with clear error messages

2. **Contextual Error Messages**:

   - Task not found errors include suggestions to run the list command
   - API key errors include reminders to check environment variables
   - Invalid ID format errors show the expected format

3. **Command-Specific Help Displays**:

   - When validation fails, detailed help for the specific command is shown
   - Help displays include usage examples and parameter descriptions
   - Formatted in clear, color-coded boxes with examples

4. **Helpful Error Recovery**:
   - Detailed troubleshooting steps for common errors
   - Graceful fallbacks for missing optional dependencies
   - Clear instructions for how to fix configuration issues

## Version Checking

The script now automatically checks for updates without slowing down execution:

1. **Background Version Checking**:

   - Non-blocking version checks run in the background while commands execute
   - Actual command execution isn't delayed by version checking
   - Update notifications appear after command completion

2. **Update Notifications**:

   - When a newer version is available, a notification is displayed
   - Notifications include current version, latest version, and update command
   - Formatted in an attention-grabbing box with clear instructions

3. **Implementation Details**:
   - Uses semantic versioning to compare current and latest versions
   - Fetches version information from npm registry with a timeout
   - Gracefully handles connection issues without affecting command execution

## Subtask Management

The script now includes enhanced commands for managing subtasks:

### Adding Subtasks

```bash
# Add a subtask to an existing task
node scripts/dev.js add-subtask --parent=5 --title="Implement login UI" --description="Create login form"

# Convert an existing task to a subtask
node scripts/dev.js add-subtask --parent=5 --task-id=8

# Add a subtask with dependencies
node scripts/dev.js add-subtask --parent=5 --title="Authentication middleware" --dependencies=5.1,5.2

# Skip regenerating task files
node scripts/dev.js add-subtask --parent=5 --title="Login API route" --skip-generate
```

Key features:

- Create new subtasks with detailed properties or convert existing tasks
- Define dependencies between subtasks
- Set custom status for new subtasks
- Provides next-step suggestions after creation

### Removing Subtasks

```bash
# Remove a subtask
node scripts/dev.js remove-subtask --id=5.2

# Remove multiple subtasks
node scripts/dev.js remove-subtask --id=5.2,5.3,5.4

# Convert a subtask to a standalone task
node scripts/dev.js remove-subtask --id=5.2 --convert

# Skip regenerating task files
node scripts/dev.js remove-subtask --id=5.2 --skip-generate
```

Key features:

- Remove subtasks individually or in batches
- Optionally convert subtasks to standalone tasks
- Control whether task files are regenerated
- Provides detailed success messages and next steps
