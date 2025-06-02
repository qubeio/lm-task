# MCP Inspector End-to-End Test Plan

> Location: `tests/e2e/run_mcp_inspector.sh`
>
> Prerequisites: `bash`, `jq`, `node` (v18+), and internet access to fetch the
> Inspector package via `npx`.

---

## Purpose

This smoke-suite verifies that our MCP server implementation adheres to the core
aspects of the Model-Context-Protocol (MCP):

1. **Discoverability** – the server exposes `tools`, `resources`, and `prompts`
   endpoints.
2. **Tool Invocation** – at least one tool can be executed successfully and
   returns a JSON body containing the expected `result` payload.
3. **Error Handling** – the server responds with an error status for unknown
   tools.

Running the suite locally or in CI provides early feedback whenever server logic
or dependencies change.

---

## Test Flow Overview

| Step | Action                                            | Assertion                                                |
| ---- | ------------------------------------------------- | -------------------------------------------------------- |
| 1    | `tools/list`                                      | JSON contains `.tools` array                             |
| 2    | `resources/list`                                  | JSON contains `.resources` array                         |
| 3    | `prompts/list` (optional)                         | No hard assertion; tolerated if endpoint not implemented |
| 4    | `tools/call` with _models_ (or first listed tool) | JSON contains `.result` object/array                     |
| 5    | `tools/call` with non-existent tool               | Exit code ≠ 0                                            |

All responses are captured under `tests/e2e/_runs/mcp-inspector-<timestamp>/`
for later inspection.

---

## Usage

### Stand-Alone

```bash
# Default: start a local server via node (common during development)
./tests/e2e/run_mcp_inspector.sh

# Specify an explicit server entry (local script, built file, or remote URL)
./tests/e2e/run_mcp_inspector.sh --server "node build/index.js"
./tests/e2e/run_mcp_inspector.sh --server "https://my-mcp-server.example.com"
```

The script automatically prefixes
`npx --yes @modelcontextprotocol/inspector@latest --cli` so no global install is
required.

### Via Existing Runner

`run_e2e.sh` can source/execute this script as an additional step. For CI, add:

```bash
./tests/e2e/run_mcp_inspector.sh || exit 1
```

into the pipeline after the MCP server has started.

---

## Extending the Suite

- **Additional Tool Calls** – append more `run_and_capture` calls to exercise
  other tools.
- **Schema Validation** – expand `assert_json_has_key` or use `jq` filters to
  validate deeper payload shapes.
- **Performance** – wrap calls with timers to track latency regressions.

---

## Troubleshooting

- **`jq: command not found`** – install with `brew install jq` (macOS) or
  `apt-get install jq` (Debian/Ubuntu).
- **Network / npm errors** – the Inspector package is downloaded on-the-fly;
  ensure npm registry access.
- **Server not reachable** – confirm `--server` argument or `$MCP_SERVER` env
  variable points to a running instance.

---

## References

- MCP Inspector GitHub: <https://github.com/modelcontextprotocol/inspector>
- CLI documentation:
  <https://github.com/modelcontextprotocol/inspector?tab=readme-ov-file#cli-mode>

---

_Last updated: 2025-06-01_
