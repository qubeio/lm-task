# LM-Tasker Tutorial

This tutorial will guide you through setting up and using LM-Tasker for AI-driven development with Azure OpenAI.

## Initial Setup

There are two ways to set up LM-Tasker: using MCP (recommended) or via npm installation.

### Option 1: Using MCP (Recommended)

MCP (Model Control Protocol) provides the easiest way to get started with LM-Tasker directly in your editor.

1. **Install the package**

```bash
npm i -g lm-tasker
```

2. **Add the MCP config to your IDE/MCP Client** (Cursor is recommended, but it works with other clients):

```json
{
  "mcpServers": {
    "lm-tasker": {
      "command": "npx",
      "args": ["-y", "--package=lm-tasker", "lm-tasker-mcp"],
      "env": {
        "AZURE_OPENAI_API_KEY": "YOUR_AZURE_OPENAI_API_KEY_HERE",
        "AZURE_OPENAI_ENDPOINT": "YOUR_AZURE_OPENAI_ENDPOINT_HERE"
      }
    }
  }
}
```

**IMPORTANT:** Azure OpenAI API key and endpoint are _required_ for this version of LM-Tasker.

**To use AI commands in CLI** you MUST have API keys in the .env file **To use AI commands in MCP** you MUST have API
keys in the .mcp.json file (or MCP config equivalent)

We recommend having keys in both places and adding mcp.json to your gitignore so your API keys aren't checked into git.

3. **Enable the MCP** in your editor settings

4. **Prompt the AI** to initialize LM-Tasker:

```
Can you please initialize lm-tasker into my project?
```

The AI will:

- Create necessary project structure
- Set up initial configuration files
- Guide you through the rest of the process

5. Create your PRD document as `PRD.md` in the project root (LM-Tasker will automatically find it)

6. **Use natural language commands** to interact with LM-Tasker:

```
Can you parse my PRD?
What's the next task I should work on?
Can you help me implement task 3?
```

### Option 2: Manual Installation

If you prefer to use the command line interface directly:

```bash
# Install globally
npm install -g lm-tasker

# OR install locally within your project
npm install lm-tasker
```

Initialize a new project:

```bash
# If installed globally
lm-tasker init

# If installed locally
npx lm-tasker init
```

This will prompt you for project details and set up a new project with the necessary files and structure.

## Common Commands

After setting up LM-Tasker, you can use these commands (either via AI prompts or CLI):

```bash
# Parse a PRD and generate tasks
lm-tasker parse-prd

# List all tasks
lm-tasker list

# Show the next task to work on
lm-tasker next

# Generate task files
lm-tasker generate
```

## Setting up Cursor AI Integration

LM-Tasker is designed to work seamlessly with [Cursor AI](https://www.cursor.so/), providing a structured workflow for
AI-driven development.

### Using Cursor with MCP (Recommended)

If you've already set up LM-Tasker with MCP in Cursor, the integration is automatic. You can simply use natural
language to interact with LM-Tasker:

```
What tasks are available to work on next?
Can you show me the details of our tasks?
I'd like to implement task 4. What does it involve?
```

### Manual Cursor Setup

If you're not using MCP, you can still set up Cursor integration:

1. After initializing your project, open it in Cursor
2. The `.cursor/rules/dev_workflow.mdc` file is automatically loaded by Cursor, providing the AI with knowledge about
   the task management system
3. Create your PRD document as `PRD.md` in the project root (LM-Tasker will automatically find it)
4. Open Cursor's AI chat and switch to Agent mode

### Alternative MCP Setup in Cursor

You can also set up the MCP server in Cursor settings:

1. Go to Cursor settings
2. Navigate to the MCP section
3. Click on "Add New MCP Server"
4. Configure with the following details:
   - Name: "LM-Tasker"
   - Type: "Command"
   - Command: "npx -y --package=lm-tasker lm-tasker-mcp"
5. Save the settings

Once configured, you can interact with LM-Tasker's task management commands directly through Cursor's interface,
providing a more integrated experience.

## Initial Task Generation

In Cursor's AI chat, instruct the agent to generate tasks from your PRD:

```
Please use the lm-tasker parse-prd command to generate tasks from my PRD.
```

The agent will execute:

```bash
lm-tasker parse-prd
```

This will:

- Parse your PRD document
- Generate a structured `tasks.json` file with tasks, dependencies, priorities, and test strategies
- The agent will understand this process due to the Cursor rules

### Generate Individual Task Files

Next, ask the agent to generate individual task files:

```
Please generate individual task files from tasks.json
```

The agent will execute:

```bash
lm-tasker generate
```

This creates individual task files in the `tasks/` directory (e.g., `task_001.txt`, `task_002.txt`), making it easier to
reference specific tasks.

## AI-Driven Development Workflow

The Cursor agent is pre-configured (via the rules file) to follow this workflow:

### 1. Task Discovery and Selection

Ask the agent to list available tasks:

```
What tasks are available to work on next?
```

The agent will:

- Run `lm-tasker list` to see all tasks
- Run `lm-tasker next` to determine the next task to work on
- Analyze dependencies to determine which tasks are ready to be worked on
- Prioritize tasks based on priority level and ID order
- Suggest the next task(s) to implement

### 2. Task Implementation

When implementing a task, the agent will:

- Reference the task's details section for implementation specifics
- Consider dependencies on previous tasks
- Follow the project's coding standards
- Create appropriate tests based on the task's testStrategy

You can ask:

```
Let's implement task 3. What does it involve?
```

### 3. Task Verification

Before marking a task as complete, verify it according to:

- The task's specified testStrategy
- Any automated tests in the codebase
- Manual verification if required

### 4. Task Completion

When a task is completed, tell the agent:

```
Task 3 is now complete. Please update its status.
```

The agent will execute:

```bash
lm-tasker set-status --id=3 --status=done
```

### 5. Handling Implementation Drift

If during implementation, you discover that:

- The current approach differs significantly from what was planned
- Future tasks need to be modified due to current implementation choices
- New dependencies or requirements have emerged

Tell the agent:

```
We've decided to use MongoDB instead of PostgreSQL. Can you update all future tasks (from ID 4) to reflect this change?
```

The agent will execute:

```bash
lm-tasker update --from=4 --prompt="Now we are using MongoDB instead of PostgreSQL."

# OR, if research is needed to find best practices for MongoDB:
lm-tasker update --from=4 --prompt="Update to use MongoDB, researching best practices" --research
```

This will rewrite or re-scope subsequent tasks in tasks.json while preserving completed work.

### 6. Reorganizing Tasks

If you need to reorganize your task structure:

```
I think subtask 5.2 would fit better as part of task 7 instead. Can you move it there?
```

The agent will execute:

```bash
lm-tasker move --from=5.2 --to=7.3
```

You can reorganize tasks in various ways:

- Moving a standalone task to become a subtask: `--from=5 --to=7`
- Moving a subtask to become a standalone task: `--from=5.2 --to=7`
- Moving a subtask to a different parent: `--from=5.2 --to=7.3`
- Reordering subtasks within the same parent: `--from=5.2 --to=5.4`
- Moving a task to a new ID position: `--from=5 --to=25` (even if task 25 doesn't exist yet)
- Moving multiple tasks at once: `--from=10,11,12 --to=16,17,18` (must have same number of IDs, Taskmaster will look
  through each position)

When moving tasks to new IDs:

- The system automatically creates placeholder tasks for non-existent destination IDs
- This prevents accidental data loss during reorganization
- Any tasks that depend on moved tasks will have their dependencies updated
- When moving a parent task, all its subtasks are automatically moved with it and renumbered

This is particularly useful as your project understanding evolves and you need to refine your task structure.

### 7. Resolving Merge Conflicts with Tasks

When working with a team, you might encounter merge conflicts in your tasks.json file if multiple team members create
tasks on different branches. The move command makes resolving these conflicts straightforward:

```
I just merged the main branch and there's a conflict with tasks.json. My teammates created tasks 10-15 while I created tasks 10-12 on my branch. Can you help me resolve this?
```

The agent will help you:

1. Keep your teammates' tasks (10-15)
2. Move your tasks to new positions to avoid conflicts:

```bash
# Move your tasks to new positions (e.g., 16-18)
lm-tasker move --from=10 --to=16
lm-tasker move --from=11 --to=17
lm-tasker move --from=12 --to=18
```

This approach preserves everyone's work while maintaining a clean task structure, making it much easier to handle task
conflicts than trying to manually merge JSON files.

### 8. Adding Subtasks to Complex Tasks

For complex tasks that need more granularity, you can manually add subtasks:

```
Task 5 seems complex. Can you add some subtasks to break it down?
```

The agent will execute:

```bash
lm-tasker add-subtask --parent=5 --title="Setup authentication" --description="Implement user authentication system"
lm-tasker add-subtask --parent=5 --title="Create user interface" --description="Build login and registration forms"
lm-tasker add-subtask --parent=5 --title="Add security measures" --description="Implement security best practices"
```

You can also add subtasks with dependencies:

```
Please add a subtask to task 5 that depends on task 3 being completed.
```

The agent will execute:

```bash
lm-tasker add-subtask --parent=5 --title="Integration testing" --description="Test integration with completed components" --dependencies="3"
```

## Example Cursor AI Interactions

### Starting a new project

```
I've just initialized a new project with LM-Tasker. I have a PRD.md file in the project root.
Can you help me parse it and set up the initial tasks?
```

### Working on tasks

```
What's the next task I should work on? Please consider dependencies and priorities.
```

### Implementing a specific task

```
I'd like to implement task 4. Can you help me understand what needs to be done and how to approach it?
```

### Managing subtasks

```
I need to regenerate the subtasks for task 3 with a different approach. Can you help me clear and regenerate them?
```

### Handling changes

```
We've decided to use MongoDB instead of PostgreSQL. Can you update all future tasks to reflect this change?
```

### Completing work

```
I've finished implementing the authentication system described in task 2. All tests are passing.
Please mark it as complete and tell me what I should work on next.
```

### Managing subtasks

```
I need to add some subtasks to task 3 to break it down into smaller pieces. Can you help me organize this better?
```
