#!/usr/bin/env bash
# -------------------------------------------------------------
# End-to-End MCP Inspector Smoke Test
# -------------------------------------------------------------
# This script exercises a running MCP server using the official
# `@modelcontextprotocol/inspector` package in CLI mode.
# It is intentionally light-weight but covers the critical paths
# (tool discovery, resource discovery, prompt discovery and basic
# tool invocation) to ensure the server respects the MCP spec.
# -------------------------------------------------------------

set -euo pipefail

# ---------------- Configuration & Args ----------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../.."
HELPER_SCRIPT="${PROJECT_ROOT}/tests/e2e/e2e_helpers.sh"

# shellcheck source=tests/e2e/e2e_helpers.sh
source "$HELPER_SCRIPT"

MCP_SERVER_DEFAULT="node mcp-server/index.js"
MCP_SERVER="${MCP_SERVER_DEFAULT}"
OUTPUT_DIR_BASE="${PROJECT_ROOT}/tests/e2e/_runs"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="${OUTPUT_DIR_BASE}/mcp-inspector-${TIMESTAMP}"
mkdir -p "$RUN_DIR"

# Flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --server)
      shift
      MCP_SERVER="$1"
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
  shift
done

# Allow environment variable override
MCP_SERVER="${MCP_SERVER:-${MCP_SERVER_DEFAULT}}"

log_step "Running MCP Inspector Smoke-Suite against: $MCP_SERVER"

INSPECTOR_CMD=(npx --yes @modelcontextprotocol/inspector@latest --cli)

function assert_json_has_key() {
  local file=$1
  local key=$2
  if ! jq -e ".${key}" "$file" > /dev/null; then
    log_error "${file} missing expected key '${key}'" && exit 1
  fi
}

function run_and_capture() {
  local name=$1; shift
  local outfile="${RUN_DIR}/${name}.json"
  log_info "Executing: ${INSPECTOR_CMD[*]} $* > $outfile"
  if ! ${INSPECTOR_CMD[@]} "$MCP_SERVER" "$@" > "$outfile" 2>"${outfile}.stderr"; then
    log_error "Command failed (see ${outfile}.stderr)" && exit 1
  fi
  echo "$outfile"
}

# ---------------- Test Cases ----------------

a="$(run_and_capture tools_list --method tools/list)"
assert_json_has_key "$a" "tools"

b="$(run_and_capture resources_list --method resources/list)"
assert_json_has_key "$b" "resources"

c="$(run_and_capture prompts_list --method prompts/list || true)"  # prompts/list is optional

# Call a real tool – default to 'get_tasks', fallback to first listed tool
PRIMARY_TOOL="get_tasks"
if ! ${INSPECTOR_CMD[@]} "$MCP_SERVER" --method tools/call --tool-name "$PRIMARY_TOOL" > /dev/null 2>&1; then
  PRIMARY_TOOL="$(jq -r '.tools[0].name' "$a")"
fi

d="$(run_and_capture tool_call --method tools/call --tool-name "$PRIMARY_TOOL")"
assert_json_has_key "$d" "result"

# Negative test – expect non-zero exit for an unknown tool
if ${INSPECTOR_CMD[@]} "$MCP_SERVER" --method tools/call --tool-name does_not_exist 2>/dev/null; then
  log_error "Calling non-existent tool unexpectedly succeeded" && exit 1
fi
log_success "Negative test passed – server correctly rejects unknown tool"

log_success "MCP Inspector smoke-suite completed successfully. Artifacts in $RUN_DIR"
