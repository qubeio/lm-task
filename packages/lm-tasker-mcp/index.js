#!/usr/bin/env node

/**
 * @qubeio/lm-tasker-mcp
 *
 * Thin wrapper around the LM-Tasker MCP server.
 * This package exists to provide a simpler npx invocation without --package flags.
 *
 * Usage in MCP config:
 *   "args": ["-y", "@qubeio/lm-tasker-mcp"]
 *
 * Instead of:
 *   "args": ["-y", "--package=@qubeio/lm-tasker", "lm-tasker-mcp"]
 */

// Import will auto-start the server via the autostart check in server.js
import "@qubeio/lm-tasker/mcp-server/server.js";
