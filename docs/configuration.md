# Configuration

LM-Tasker is designed to be simple and requires minimal configuration. The system works offline and doesn't require any API keys or external services.

## Project Structure

When you initialize a project with `lm-tasker init`, it creates:

- `tasks/tasks.json` - The main task file containing all your tasks and subtasks
- `tasks/` directory - Contains individual task files (generated with `lm-tasker generate`)

## Environment Variables (Optional)

LM-Tasker can use a few optional environment variables for customization:

- `LMTASKER_LOG_LEVEL` - Set logging level (error, warn, info, debug). Default: info
- `DEBUG` - Enable debug mode (set to "1" or "true")

## MCP Configuration

For editor integration (Cursor, VS Code, Windsurf), LM-Tasker uses MCP (Model Control Protocol) with no required environment variables:

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

## Troubleshooting

### If `lm-tasker init` doesn't respond:

Try running it with Node directly:

```bash
node node_modules/lm-tasker/scripts/init.js
```

Or clone the repository and run:

```bash
git clone https://github.com/your-org/lm-tasker.git
cd lm-tasker
node scripts/init.js
```
