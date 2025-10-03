# Configuration

LM-Tasker is designed to be simple and requires minimal configuration. The system works offline and doesn't require any API keys or external services.

## Project Structure

When you create your first task with `lm-tasker add-task`, it automatically creates:

- `tasks/tasks.json` - The main task file containing all your tasks and subtasks
- `tasks/` directory - Contains individual task files (generated with `lm-tasker generate`)

## Environment Variables (Optional)

LM-Tasker can use a few optional environment variables for customization:

- `LMTASKER_LOG_LEVEL` - Set logging level (error, warn, info, debug). Default: info
- `DEBUG` - Enable debug mode (set to "1" or "true")

## MCP Configuration

For editor integration (Cursor, VS Code, Windsurf), LM-Tasker uses MCP (Model Control Protocol) with no required environment variables. The MCP server automatically handles project initialization when you create your first task:

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

When using MCP tools, the `add_task` tool will automatically create the tasks.json file and project structure if this is your first task, eliminating the need for a separate initialization step.

## Troubleshooting

### If `lm-tasker add-task` doesn't respond:

Try running it with Node directly:

```bash
node node_modules/lm-tasker/bin/lm-tasker.js add-task --title="Task Title" --description="Task description"
```

Or clone the repository and run:

```bash
git clone https://github.com/your-org/lm-tasker.git
cd lm-tasker
npx lm-tasker add-task --title="Task Title" --description="Task description"
```
