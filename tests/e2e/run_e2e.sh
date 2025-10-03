#!/bin/bash

# Treat unset variables as an error when substituting.
set -u
# Prevent errors in pipelines from being masked.
set -o pipefail

# --- Default Settings ---
# run_verification_test=true  # No longer needed since AI functionality removed

# --- Argument Parsing ---
# Simple loop to check for the skip flag
# Note: This needs to happen *before* the main block piped to tee
# if we want the decision logged early. Or handle args inside.
# Let's handle it before for clarity.
processed_args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-verification)
      # run_verification_test=false  # No longer needed since AI functionality removed
      echo "[INFO] Argument '--skip-verification' detected. Fallback verification is no longer available (AI removed)."
      shift # Consume the flag
      ;;
    --analyze-log)
      # Keep the analyze-log flag handling separate for now
      # It exits early, so doesn't conflict with the main run flags
      processed_args+=("$1")
      if [[ $# -gt 1 ]]; then
        processed_args+=("$2")
        shift 2
      else
        shift 1
      fi
      ;;
    *)
      # Unknown argument, pass it along or handle error
      # For now, just pass it along in case --analyze-log needs it later
      processed_args+=("$1")
      shift
      ;;
  esac
done
# Restore processed arguments ONLY if the array is not empty
if [ ${#processed_args[@]} -gt 0 ]; then
  set -- "${processed_args[@]}"
fi


# --- Configuration ---
# Assumes script is run from the project root (lm-tasker)
TASKMASTER_SOURCE_DIR="." # Current directory is the source
# Base directory for test runs, relative to project root
BASE_TEST_DIR="$TASKMASTER_SOURCE_DIR/tests/e2e/_runs"
# Log directory, relative to project root
LOG_DIR="$TASKMASTER_SOURCE_DIR/tests/e2e/log"

# Path to the main .env file in the source directory (no longer needed since AI removed)
# MAIN_ENV_FILE="$TASKMASTER_SOURCE_DIR/.env"
# ---

# <<< Source the helper script >>>
# shellcheck source=tests/e2e/e2e_helpers.sh
source "$TASKMASTER_SOURCE_DIR/tests/e2e/e2e_helpers.sh"

# ==========================================
# >>> Global Helper Functions Defined in run_e2e.sh <<<
# --- Helper Functions (Define globally before export) ---
_format_duration() {
  local total_seconds=$1
  local minutes=$((total_seconds / 60))
  local seconds=$((total_seconds % 60))
  printf "%dm%02ds" "$minutes" "$seconds"
}

# Note: This relies on 'overall_start_time' being set globally before the function is called
_get_elapsed_time_for_log() {
  local current_time
  current_time=$(date +%s)
  # Use overall_start_time here, as start_time_for_helpers might not be relevant globally
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
# ==========================================

# <<< Export helper functions for subshells >>>
export -f log_info log_success log_error log_step _format_duration _get_elapsed_time_for_log extract_and_sum_cost

# --- Argument Parsing for Analysis-Only Mode ---
# This remains the same, as it exits early if matched
if [ "$#" -ge 1 ] && [ "$1" == "--analyze-log" ]; then
  LOG_TO_ANALYZE=""
  # Check if a log file path was provided as the second argument
  if [ "$#" -ge 2 ] && [ -n "$2" ]; then
    LOG_TO_ANALYZE="$2"
    echo "[INFO] Using specified log file for analysis: $LOG_TO_ANALYZE"
  else
    echo "[INFO] Log file not specified. Attempting to find the latest log..."
    # Find the latest log file in the LOG_DIR
    # Ensure LOG_DIR is absolute for ls to work correctly regardless of PWD
    ABS_LOG_DIR="$(cd "$TASKMASTER_SOURCE_DIR/$LOG_DIR" && pwd)"
    LATEST_LOG=$(ls -t "$ABS_LOG_DIR"/e2e_run_*.log 2>/dev/null | head -n 1)

    if [ -z "$LATEST_LOG" ]; then
      echo "[ERROR] No log files found matching 'e2e_run_*.log' in $ABS_LOG_DIR. Cannot analyze." >&2
      exit 1
    fi
    LOG_TO_ANALYZE="$LATEST_LOG"
    echo "[INFO] Found latest log file: $LOG_TO_ANALYZE"
  fi

  # Ensure the log path is absolute (it should be if found by ls, but double-check)
  if [[ "$LOG_TO_ANALYZE" != /* ]]; then
    LOG_TO_ANALYZE="$(pwd)/$LOG_TO_ANALYZE" # Fallback if relative path somehow occurred
  fi
  echo "[INFO] Running in analysis-only mode for log: $LOG_TO_ANALYZE"

  # --- Derive TEST_RUN_DIR from log file path ---
  # Extract timestamp like YYYYMMDD_HHMMSS from e2e_run_YYYYMMDD_HHMMSS.log
  log_basename=$(basename "$LOG_TO_ANALYZE")
  # Ensure the sed command matches the .log suffix correctly
  timestamp_match=$(echo "$log_basename" | sed -n 's/^e2e_run_\([0-9]\{8\}_[0-9]\{6\}\)\.log$/\1/p')

  if [ -z "$timestamp_match" ]; then
    echo "[ERROR] Could not extract timestamp from log file name: $log_basename" >&2
    echo "[ERROR] Expected format: e2e_run_YYYYMMDD_HHMMSS.log" >&2
    exit 1
  fi

  # Construct the expected run directory path relative to project root
  EXPECTED_RUN_DIR="$TASKMASTER_SOURCE_DIR/tests/e2e/_runs/run_$timestamp_match"
  # Make it absolute
  EXPECTED_RUN_DIR_ABS="$(cd "$TASKMASTER_SOURCE_DIR" && pwd)/tests/e2e/_runs/run_$timestamp_match"

  if [ ! -d "$EXPECTED_RUN_DIR_ABS" ]; then
    echo "[ERROR] Corresponding test run directory not found: $EXPECTED_RUN_DIR_ABS" >&2
    exit 1
  fi

  # Save original dir before changing
  ORIGINAL_DIR=$(pwd)

  echo "[INFO] Changing directory to $EXPECTED_RUN_DIR_ABS for analysis context..."
  cd "$EXPECTED_RUN_DIR_ABS"

  # Call the analysis function (sourced from helpers)
  echo "[INFO] Calling analyze_log_with_llm function..."
  analyze_log_with_llm "$LOG_TO_ANALYZE" "$(cd "$ORIGINAL_DIR/$TASKMASTER_SOURCE_DIR" && pwd)" # Pass absolute project root
  ANALYSIS_EXIT_CODE=$?

  # Return to original directory
  cd "$ORIGINAL_DIR"
  exit $ANALYSIS_EXIT_CODE
fi
# --- End Analysis-Only Mode Logic ---

# --- Normal Execution Starts Here (if not in analysis-only mode) ---

# --- Test State Variables ---
# Note: These are mainly for step numbering within the log now, not for final summary
test_step_count=0
start_time_for_helpers=0 # Separate start time for helper functions inside the pipe
total_e2e_cost="0.0" # Initialize total E2E cost
# ---

# --- Log File Setup ---
# Create the log directory if it doesn't exist
mkdir -p "$LOG_DIR"
# Define timestamped log file path
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
# <<< Use pwd to create an absolute path AND add .log extension >>>
LOG_FILE="$(pwd)/$LOG_DIR/e2e_run_${TIMESTAMP}.log"

# Define and create the test run directory *before* the main pipe
mkdir -p "$BASE_TEST_DIR" # Ensure base exists first
TEST_RUN_DIR="$BASE_TEST_DIR/run_$TIMESTAMP"
mkdir -p "$TEST_RUN_DIR"

# Echo starting message to the original terminal BEFORE the main piped block
echo "Starting E2E test. Output will be shown here and saved to: $LOG_FILE"
echo "Running from directory: $(pwd)"
echo "--- Starting E2E Run ---" # Separator before piped output starts

# Record start time for overall duration *before* the pipe
overall_start_time=$(date +%s)

# <<< DEFINE ORIGINAL_DIR GLOBALLY HERE >>>
ORIGINAL_DIR=$(pwd)

# ==========================================
# >>> MOVE FUNCTION DEFINITION HERE <<<
# --- Helper Functions (Define globally) ---
_format_duration() {
  local total_seconds=$1
  local minutes=$((total_seconds / 60))
  local seconds=$((total_seconds % 60))
  printf "%dm%02ds" "$minutes" "$seconds"
}

# Note: This relies on 'overall_start_time' being set globally before the function is called
_get_elapsed_time_for_log() {
  local current_time=$(date +%s)
  # Use overall_start_time here, as start_time_for_helpers might not be relevant globally
  local elapsed_seconds=$((current_time - overall_start_time))
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

# ==========================================

# --- Main Execution Block (Piped to tee) ---
# Wrap the main part of the script in braces and pipe its output (stdout and stderr) to tee
{
  # Note: Helper functions are now defined globally above,
  # but we still need start_time_for_helpers if any logging functions
  # called *inside* this block depend on it. If not, it can be removed.
  start_time_for_helpers=$(date +%s) # Keep if needed by helpers called inside this block

  # Log the verification decision (AI functionality removed)
  log_info "AI functionality has been removed from LM-Tasker. No verification tests needed."

  # --- Dependency Checks ---
  log_step "Checking for dependencies (jq, bc)"
  if ! command -v jq &> /dev/null; then
      log_error "Dependency 'jq' is not installed or not found in PATH. Please install jq (e.g., 'brew install jq' or 'sudo apt-get install jq')."
      exit 1
  fi
  if ! command -v bc &> /dev/null; then
      log_error "Dependency 'bc' not installed (for cost calculation). Please install bc (e.g., 'brew install bc' or 'sudo apt-get install bc')."
      exit 1
  fi
  log_success "Dependencies 'jq' and 'bc' found."

  # --- Test Setup (Output to tee) ---
  log_step "Setting up test environment"

  log_step "Creating global npm link for lm-tasker"
  if npm link; then
    log_success "Global link created/updated."
  else
    log_error "Failed to run 'npm link'. Check permissions or output for details."
    exit 1
  fi

  log_info "Ensured base test directory exists: $BASE_TEST_DIR"

  log_info "Using test run directory (created earlier): $TEST_RUN_DIR"

  # Check if source .env file exists (no longer needed since AI removed)
  # if [ ! -f "$MAIN_ENV_FILE" ]; then
  #     log_error "Source .env file not found at $MAIN_ENV_FILE. Cannot proceed with API-dependent tests."
  #     exit 1
  # fi
  # log_info "Source .env file found at $MAIN_ENV_FILE."

  # PRD functionality removed - no longer needed since AI parsing has been removed
  log_info "PRD functionality has been removed from LM-Tasker. Skipping PRD setup."

  # ORIGINAL_DIR=$(pwd) # Save original dir # <<< REMOVED FROM HERE
  cd "$TEST_RUN_DIR"
  log_info "Changed directory to $(pwd)"

  # === Copy .env file BEFORE init === (no longer needed since AI removed)
  # log_step "Copying source .env file for API keys"
  # if cp "$ORIGINAL_DIR/.env" ".env"; then
  #   log_success ".env file copied successfully."
  # else
  #   log_error "Failed to copy .env file from $ORIGINAL_DIR/.env"
  #   exit 1
  # fi
  # ========================================

  # --- Test Execution (Output to tee) ---

  log_step "Linking lm-tasker package locally"
  # Skip npm link since we're testing the local development version
  log_success "Using local development version (npm link skipped)."

  log_step "Initializing LM-Tasker project using add-task (auto-initializes)"
  # Use add-task to create first task, which auto-initializes the project
  lm-tasker add-task --title="E2E Test Task 1" --description="First E2E test task" --priority="high" --details="Test task for E2E testing" --test-strategy="Verify E2E test functionality"
  log_success "Project initialized with first task."

  log_step "Adding additional sample tasks"
  # Add more tasks to test various scenarios
  lm-tasker add-task --title="E2E Test Task 2" --description="Second E2E test task" --priority="medium" --dependencies="1" --details="Another test task for E2E testing" --test-strategy="Verify dependency handling"
  lm-tasker add-task --title="E2E Test Task 3" --description="Third E2E test task" --priority="low" --details="Third test task for E2E testing" --test-strategy="Verify multiple task handling"
  
  # Verify the tasks.json was created by add-task commands
  log_info "Verifying tasks.json was created by add-task commands"
  if [ -f "tasks/tasks.json" ]; then
    log_success "tasks.json created successfully by add-task commands"
    log_info "Tasks.json contents:"
    cat tasks/tasks.json
  else
    log_error "tasks.json was not created by add-task commands"
    exit 1
  fi

  log_step "Ensuring Task 1 has subtasks for testing"
  # Add a simple subtask to Task 1 for testing purposes
  lm-tasker add-subtask --parent=1 --title="Test subtask 1.1" --description="Test subtask for dependency testing"
  log_success "Added test subtask to Task 1."

  log_step "Setting status for Subtask 1.1 (assuming it exists)"
  lm-tasker set-status --id=1.1 --status=done
  log_success "Attempted to set status for Subtask 1.1 to 'done'."

  log_step "Listing tasks again (after changes)"
  lm-tasker list --with-subtasks > task_list_after_changes.log
  log_success "Task list after changes saved to task_list_after_changes.log"

  # === AI/Model Testing Removed ===
  # All AI functionality has been removed from LM-Tasker, so model configuration tests are no longer needed
  log_info "AI functionality has been removed from LM-Tasker. Skipping model configuration tests."

  # === Fallback Verification Removed ===
  # AI functionality has been removed from LM-Tasker, so fallback verification is no longer needed
  log_info "AI functionality has been removed from LM-Tasker. Skipping fallback verification tests."


  # === Azure Models Add-Task Test Removed ===
  # AI functionality has been removed from LM-Tasker, so multi-provider add-task tests are no longer needed
  log_info "AI functionality has been removed from LM-Tasker. Skipping multi-provider add-task tests."

  log_step "Listing tasks again (after multi-add)"
  lm-tasker list --with-subtasks > task_list_after_multi_add.log
  log_success "Task list after multi-add saved to task_list_after_multi_add.log"


  # === Resume Core Task Commands Test ===
  log_step "Listing tasks (for core tests)"
  lm-tasker list > task_list_core_test_start.log
  log_success "Core test initial task list saved."

  log_step "Getting next task"
  lm-tasker next > next_task_core_test.log
  log_success "Core test next task saved."

  log_step "Showing Task 1 details"
  lm-tasker show 1 > task_1_details_core_test.log
  log_success "Task 1 details saved."

  log_step "Adding dependency (Task 2 depends on Task 1)"
  lm-tasker add-dependency --id=2 --depends-on=1
  log_success "Added dependency 2->1."

  log_step "Validating dependencies (after add)"
  lm-tasker validate-dependencies > validate_dependencies_after_add_core.log
  log_success "Dependency validation after add saved."

  log_step "Removing dependency (Task 2 depends on Task 1)"
  lm-tasker remove-dependency --id=2 --depends-on=1
  log_success "Removed dependency 2->1."

  log_step "Fixing dependencies (should be no-op now)"
  lm-tasker fix-dependencies > fix_dependencies_output_core.log
  log_success "Fix dependencies attempted."

  # === Start New Test Section: Validate/Fix Bad Dependencies ===

  log_step "Intentionally adding non-existent dependency (1 -> 999)"
  lm-tasker add-dependency --id=1 --depends-on=999 || log_error "Failed to add non-existent dependency (unexpected)"
  # Don't exit even if the above fails, the goal is to test validation
  log_success "Attempted to add dependency 1 -> 999."

  log_step "Validating dependencies (expecting non-existent error)"
  lm-tasker validate-dependencies > validate_deps_non_existent.log 2>&1 || true # Allow command to fail without exiting script
  if grep -q "Non-existent dependency ID: 999" validate_deps_non_existent.log; then
      log_success "Validation correctly identified non-existent dependency 999."
  else
      log_error "Validation DID NOT report non-existent dependency 999 as expected. Check validate_deps_non_existent.log"
  fi

  log_step "Fixing dependencies (should remove 1 -> 999)"
  lm-tasker fix-dependencies > fix_deps_after_non_existent.log
  log_success "Attempted to fix dependencies."

  log_step "Validating dependencies (after fix)"
  lm-tasker validate-dependencies > validate_deps_after_fix_non_existent.log 2>&1 || true # Allow potential failure
  if grep -q "Non-existent dependency ID: 999" validate_deps_after_fix_non_existent.log; then
      log_error "Validation STILL reports non-existent dependency 999 after fix. Check logs."
  else
      log_success "Validation shows non-existent dependency 999 was removed."
  fi


  log_step "Intentionally adding circular dependency (4 -> 5 -> 4)"
  lm-tasker add-dependency --id=4 --depends-on=5 || log_error "Failed to add dependency 4->5"
  lm-tasker add-dependency --id=5 --depends-on=4 || log_error "Failed to add dependency 5->4"
  log_success "Attempted to add dependencies 4 -> 5 and 5 -> 4."


  log_step "Validating dependencies (expecting circular error)"
  lm-tasker validate-dependencies > validate_deps_circular.log 2>&1 || true # Allow command to fail
  # Note: Adjust the grep pattern based on the EXACT error message from validate-dependencies
  if grep -q -E "Circular dependency detected involving task IDs: (4, 5|5, 4)" validate_deps_circular.log; then
      log_success "Validation correctly identified circular dependency between 4 and 5."
  else
      log_error "Validation DID NOT report circular dependency 4<->5 as expected. Check validate_deps_circular.log"
  fi

  log_step "Fixing dependencies (should remove one side of 4 <-> 5)"
  lm-tasker fix-dependencies > fix_deps_after_circular.log
  log_success "Attempted to fix dependencies."

  log_step "Validating dependencies (after fix circular)"
  lm-tasker validate-dependencies > validate_deps_after_fix_circular.log 2>&1 || true # Allow potential failure
  if grep -q -E "Circular dependency detected involving task IDs: (4, 5|5, 4)" validate_deps_after_fix_circular.log; then
      log_error "Validation STILL reports circular dependency 4<->5 after fix. Check logs."
  else
      log_success "Validation shows circular dependency 4<->5 was resolved."
  fi

  # === End New Test Section ===

  # Find the next available task ID dynamically instead of hardcoding 11, 12
  # Assuming tasks are added sequentially and we didn't remove any core tasks yet
  last_task_id=$(jq '[.tasks[].id] | max' tasks/tasks.json)
  manual_task_id=$((last_task_id + 1))
  ai_task_id=$((manual_task_id + 1))

  log_step "Adding Task $manual_task_id (Manual)"
  lm-tasker add-task --title="Manual E2E Task" --description="Add basic health check endpoint" --priority=low --dependencies=3 # Depends on backend setup
  log_success "Added Task $manual_task_id manually."

  log_step "Adding Task $ai_task_id (Manual)"
  cmd_output_add_ai=$(lm-tasker add-task --title="UI Styling" --description="Implement basic UI styling using CSS variables for colors and spacing" --priority=medium --dependencies=1 2>&1)
  exit_status_add_ai=$?
  echo "$cmd_output_add_ai"
  # extract_and_sum_cost "$cmd_output_add_ai"  # AI cost tracking removed
  if [ $exit_status_add_ai -ne 0 ]; then
    log_error "Adding AI Task $ai_task_id failed. Exit status: $exit_status_add_ai"
  else
    log_success "Added Task $ai_task_id manually."
  fi


  log_step "Skipping Task 3 update (AI functionality removed)"
  log_success "AI-powered update functionality has been removed."

  log_step "Skipping bulk update from Task 5 (AI functionality removed)"
  log_success "AI-powered bulk update functionality has been removed."

  log_step "Adding test subtask to Task 8 for update testing"
  lm-tasker add-subtask --parent=8 --title="Test subtask 8.1" --description="Test subtask for update testing"
  log_success "Added test subtask to Task 8."

  log_step "Skipping Subtask 8.1 update (AI functionality removed)"
  log_success "AI-powered subtask update functionality has been removed."

  # Add a couple more subtasks for multi-remove test
  log_step 'Adding subtasks to Task 2 (for multi-remove test)'
  lm-tasker add-subtask --parent=2 --title="Subtask 2.1 for removal"
  lm-tasker add-subtask --parent=2 --title="Subtask 2.2 for removal"
  log_success "Added subtasks 2.1 and 2.2."

  log_step "Removing Subtasks 2.1 and 2.2 (multi-ID)"
  lm-tasker remove-subtask --id=2.1,2.2
  log_success "Removed subtasks 2.1 and 2.2."

  log_step "Setting status for Task 1 to done"
  lm-tasker set-status --id=1 --status=done
  log_success "Set status for Task 1 to done."

  log_step "Getting next task (after status change)"
  lm-tasker next > next_task_after_change_core.log
  log_success "Next task after change saved."

  # === Start New Test Section: List Filtering ===
  log_step "Listing tasks filtered by status 'done'"
  lm-tasker list --status=done > task_list_status_done.log
  log_success "Filtered list saved to task_list_status_done.log (Manual/LLM check recommended)"
  # Optional assertion: Check if Task 1 ID exists and Task 2 ID does NOT
  # if grep -q "^1\." task_list_status_done.log && ! grep -q "^2\." task_list_status_done.log; then
  #    log_success "Basic check passed: Task 1 found, Task 2 not found in 'done' list."
  # else
  #    log_error "Basic check failed for list --status=done."
  # fi
  # === End New Test Section ===

  log_step "Clearing subtasks from Task 8"
  lm-tasker clear-subtasks --id=8
  log_success "Attempted to clear subtasks from Task 8."

  log_step "Removing Tasks $manual_task_id and $ai_task_id (multi-ID)"
  # Remove the tasks we added earlier
  lm-tasker remove-task --id="$manual_task_id,$ai_task_id" -y
  log_success "Removed tasks $manual_task_id and $ai_task_id."

  # === Start New Test Section: Subtasks & Dependencies ===

  log_step "Adding test subtasks to Task 2"
  lm-tasker add-subtask --parent=2 --title="Test subtask 2.1" --description="Test subtask for clear-all testing"
  lm-tasker add-subtask --parent=2 --title="Test subtask 2.2" --description="Test subtask for clear-all testing"
  log_success "Added test subtasks to Task 2."

  log_step "Listing tasks with subtasks (Before Clear All)"
  lm-tasker list --with-subtasks > task_list_before_clear_all.log
  log_success "Task list before clear-all saved."

  log_step "Clearing ALL subtasks"
  lm-tasker clear-subtasks --all
  log_success "Attempted to clear all subtasks."

  log_step "Listing tasks with subtasks (After Clear All)"
  lm-tasker list --with-subtasks > task_list_after_clear_all.log
  log_success "Task list after clear-all saved. (Manual/LLM check recommended to verify subtasks removed)"

  log_step "Adding test subtask to Task 1 again (for dependency testing)"
  lm-tasker add-subtask --parent=1 --title="Test subtask 1.1" --description="Test subtask for dependency testing"
  log_success "Added test subtask to Task 1 again."
  # Verify 1.1 exists
  if ! jq -e '.tasks[] | select(.id == 1) | .subtasks[] | select(.id == 1)' tasks/tasks.json > /dev/null; then
      log_error "Subtask 1.1 not found in tasks.json after adding test subtask."
      exit 1
  fi

  log_step "Adding dependency: Task 3 depends on Subtask 1.1"
  lm-tasker add-dependency --id=3 --depends-on=1.1
  log_success "Added dependency 3 -> 1.1."

  log_step "Showing Task 3 details (after adding subtask dependency)"
  lm-tasker show 3 > task_3_details_after_dep_add.log
  log_success "Task 3 details saved. (Manual/LLM check recommended for dependency [1.1])"

  log_step "Removing dependency: Task 3 depends on Subtask 1.1"
  lm-tasker remove-dependency --id=3 --depends-on=1.1
  log_success "Removed dependency 3 -> 1.1."

  log_step "Showing Task 3 details (after removing subtask dependency)"
  lm-tasker show 3 > task_3_details_after_dep_remove.log
  log_success "Task 3 details saved. (Manual/LLM check recommended to verify dependency removed)"

  # === End New Test Section ===

  log_step "Generating task files (final)"
  lm-tasker generate
  log_success "Generated task files."
  # === End Core Task Commands Test ===



  log_step "Listing tasks again (final)"
  lm-tasker list --with-subtasks > task_list_final.log
  log_success "Final task list saved to task_list_final.log"

  # --- Test Completion (Output to tee) ---
  log_step "E2E Test Steps Completed"
  echo ""
  ABS_TEST_RUN_DIR="$(pwd)"
  echo "Test artifacts and logs are located in: $ABS_TEST_RUN_DIR"
  echo "Key artifact files (within above dir):"
  ls -1 # List files in the current directory
  echo ""
  echo "Full script log also available at: $LOG_FILE (relative to project root)"

  # Optional: cd back to original directory
  # cd "$ORIGINAL_DIR"

# End of the main execution block brace
} 2>&1 | tee "$LOG_FILE"

# --- Final Terminal Message ---
EXIT_CODE=${PIPESTATUS[0]}
overall_end_time=$(date +%s)
total_elapsed_seconds=$((overall_end_time - overall_start_time))

# Format total duration
total_minutes=$((total_elapsed_seconds / 60))
total_sec_rem=$((total_elapsed_seconds % 60))
formatted_total_time=$(printf "%dm%02ds" "$total_minutes" "$total_sec_rem")

# Count steps and successes from the log file *after* the pipe finishes
# Use grep -c for counting lines matching the pattern
# Corrected pattern to match '  STEP X:' format
final_step_count=$(grep -c '^[[:space:]]\+STEP [0-9]\+:' "$LOG_FILE" || true)
final_success_count=$(grep -c '\[SUCCESS\]' "$LOG_FILE" || true) # Count lines containing [SUCCESS]

echo "--- E2E Run Summary ---"
echo "Log File: $LOG_FILE"
echo "Total Elapsed Time: ${formatted_total_time}"
echo "Total Steps Executed: ${final_step_count}" # Use count from log

if [ $EXIT_CODE -eq 0 ]; then
    echo "Status: SUCCESS"
    # Use counts from log file
    echo "Successful Steps: ${final_success_count}/${final_step_count}"
else
    echo "Status: FAILED"
    # Use count from log file for total steps attempted
    echo "Failure likely occurred during/after Step: ${final_step_count}"
    # Use count from log file for successes before failure
    echo "Successful Steps Before Failure: ${final_success_count}"
    echo "Please check the log file '$LOG_FILE' for error details."
fi
echo "-------------------------"

# --- Attempt LLM Analysis ---
# Run this *after* the main execution block and tee pipe finish writing the log file
if [ -d "$TEST_RUN_DIR" ]; then
  # Define absolute path to source dir if not already defined (though it should be by setup)
  TASKMASTER_SOURCE_DIR_ABS=${TASKMASTER_SOURCE_DIR_ABS:-$(cd "$ORIGINAL_DIR/$TASKMASTER_SOURCE_DIR" && pwd)}

  cd "$TEST_RUN_DIR"
  # Pass the absolute source directory path
  analyze_log_with_llm "$LOG_FILE" "$TASKMASTER_SOURCE_DIR_ABS"
  ANALYSIS_EXIT_CODE=$? # Capture the exit code of the analysis function
  # Optional: cd back again if needed
  cd "$ORIGINAL_DIR" # Ensure we change back to the original directory
else
  formatted_duration_for_error=$(_format_duration "$total_elapsed_seconds")
  echo "[ERROR] [$formatted_duration_for_error] $(date +"%Y-%m-%d %H:%M:%S") Test run directory $TEST_RUN_DIR not found. Cannot perform LLM analysis." >&2
fi

# Final cost formatting
# AI cost tracking removed since AI functionality has been removed
# formatted_total_e2e_cost=$(printf "%.6f" "$total_e2e_cost")
# echo "Total E2E AI Cost: $formatted_total_e2e_cost USD"

exit $EXIT_CODE