# @qubeio/lm-tasker-mcp

Thin wrapper package for the LM-Tasker MCP server that provides a simpler installation experience.

## Why This Package Exists

This package solves the `npx --package=` syntax issue when adding LM-Tasker to your MCP configuration. Instead of the verbose:

```json
"args": ["-y", "--package=@qubeio/lm-tasker", "lm-tasker-mcp"]
```

You can now use the simpler:

```json
"args": ["-y", "@qubeio/lm-tasker-mcp"]
```

## Installation

Add to your MCP configuration file:

### Cursor & Windsurf

**Location**: `~/.cursor/mcp.json` or `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "lm-tasker": {
      "command": "npx",
      "args": ["-y", "@qubeio/lm-tasker-mcp"],
      "env": {}
    }
  }
}
```

### VS Code

**Location**: `<project>/.vscode/mcp.json`

```json
{
  "servers": {
    "lm-tasker": {
      "command": "npx",
      "args": ["-y", "@qubeio/lm-tasker-mcp"],
      "env": {},
      "type": "stdio"
    }
  }
}
```

## What It Does

This package is a thin wrapper that simply imports and runs the MCP server from `@qubeio/lm-tasker`. All functionality is provided by the main package.

## Documentation

For full documentation, see the main [LM-Tasker repository](https://github.com/qubeio/lm-task).

## License

MIT
