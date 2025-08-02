#!/bin/bash

# E2E Test Helper Functions
# This file contains shared functions for E2E testing

# --- Basic Helper Functions ---

_format_duration() {
  local total_seconds=$1
  local minutes=$((total_seconds / 60))
  local seconds=$((total_seconds % 60))
  printf "%dm%02ds" "$minutes" "$seconds"
}

_get_elapsed_time_for_log() {
  local current_time
  current_time=$(date +%s)
  local elapsed_seconds
  elapsed_seconds=$((current_time - overall_start_time))
  _format_duration "$elapsed_seconds"
}

log_info() {
  echo "[INFO] [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1"
}

log_success() {
  echo "[SUCCESS] [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1"
}

log_error() {
  echo "[ERROR] [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1" >&2
}

log_step() {
  test_step_count=$((test_step_count + 1))
  echo ""
  echo "============================================="
  echo "  STEP ${test_step_count}: [$(_get_elapsed_time_for_log)] $(date +"%Y-%m-%d %H:%M:%S") $1"
  echo "============================================="
}

# --- Placeholder for removed AI cost tracking ---
# Since AI functionality has been removed, this is now a no-op
extract_and_sum_cost() {
  # This function is kept for compatibility but does nothing
  # since AI cost tracking is no longer needed
  echo "$2" # Return the current total (effectively adding 0)
}

# --- Analysis function placeholder ---
analyze_log_with_llm() {
  echo "[INFO] AI analysis functionality has been removed. Skipping log analysis."
  echo "[INFO] Log file: $1"
  echo "[INFO] Project root: $2"
  return 0
} 