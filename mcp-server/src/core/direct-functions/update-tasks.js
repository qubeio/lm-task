/**
 * update-tasks.js
 * Direct function implementation for updating multiple tasks - FUNCTIONALITY REMOVED
 */

import { updateTasks } from "#scripts/task-manager.js";
import {
  enableSilentMode,
  disableSilentMode,
  isSilentMode,
} from "#scripts/utils.js";
import { createLogWrapper } from "../../tools/utils.js";

/**
 * Direct function wrapper for updateTasks with error handling.
 *
 * @param {Object} args - Command arguments containing from, tasksJsonPath, and projectRoot.
 * @param {string} args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param {string} args.from - Starting task ID.
 * @param {boolean} [args.research] - Whether to use research role (unused).
 * @param {string} [args.projectRoot] - Project root path.
 * @param {Object} log - Logger object.
 * @param {Object} context - Context object containing session data.
 * @returns {Promise<Object>} - Result object with success status and data/error information.
 */
export async function updateTasksDirect(args, log, context = {}) {
  const { session } = context;
  const { tasksJsonPath, from, research, projectRoot } = args;

  const logWrapper = createLogWrapper(log);

  try {
    logWrapper.info(
      `Update tasks functionality has been removed. From: ${from}, ProjectRoot: ${projectRoot}`,
    );

    // Check if tasksJsonPath was provided
    if (!tasksJsonPath) {
      const errorMessage = "tasksJsonPath is required but was not provided.";
      logWrapper.error(errorMessage);
      return {
        success: false,
        error: { code: "MISSING_ARGUMENT", message: errorMessage },
        fromCache: false,
      };
    }

    // Check required parameters (from)
    if (!from) {
      const errorMessage =
        "No starting task ID specified. Please provide a 'from' ID.";
      logWrapper.error(errorMessage);
      return {
        success: false,
        error: { code: "MISSING_FROM_ID", message: errorMessage },
        fromCache: false,
      };
    }

    const message = "AI-powered task update functionality has been removed. Please manually edit tasks using other available commands.";
    logWrapper.info(message);

    return {
      success: false,
      error: {
        code: "FUNCTIONALITY_REMOVED",
        message: message,
      },
      data: {
        message: message,
        alternatives: [
          "Use set_task_status to change task status",
          "Use add_subtask to add new subtasks", 
          "Manually edit tasks.json file directly"
        ]
      },
      fromCache: false,
    };
  } catch (error) {
    logWrapper.error(`Setup error in updateTasksDirect: ${error.message}`);
    return {
      success: false,
      error: {
        code: "DIRECT_FUNCTION_SETUP_ERROR",
        message: error.message || "Unknown setup error",
      },
      fromCache: false,
    };
  }
}
