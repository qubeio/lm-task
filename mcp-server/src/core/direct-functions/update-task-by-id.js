/**
 * update-task-by-id.js
 * Direct function implementation for updating a single task by ID with new information
 */

import { updateTaskById } from "#scripts/task-manager.js";
import {
  enableSilentMode,
  disableSilentMode,
  isSilentMode,
} from "#scripts/utils.js";
import { createLogWrapper } from "../../tools/utils.js";

/**
 * Direct function wrapper for updateTaskById with error handling.
 *
 * @param {Object} args - Command arguments containing id, details, tasksJsonPath, and projectRoot.
 * @param {string} args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param {string} args.id - Task ID.
 * @param {string} args.details - Additional details to append to the task.
 * @param {string} [args.projectRoot] - Project root path.
 * @param {Object} log - Logger object.
 * @param {Object} context - Context object containing session data.
 * @returns {Promise<Object>} - Result object with success status and data/error information.
 */
export async function updateTaskByIdDirect(args, log, context = {}) {
  const { session } = context;
  // Destructure expected args, including projectRoot
  const { tasksJsonPath, id, details, projectRoot } = args;

  const logWrapper = createLogWrapper(log);

  try {
    logWrapper.info(
      `Updating task by ID via direct function. ID: ${id}, ProjectRoot: ${projectRoot}`,
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

    // Check required parameters (id)
    if (!id) {
      const errorMessage =
        "No task ID specified. Please provide a task ID to update.";
      logWrapper.error(errorMessage);
      return {
        success: false,
        error: { code: "MISSING_TASK_ID", message: errorMessage },
        fromCache: false,
      };
    }

    // Check required parameters (details)
    if (!details || typeof details !== "string" || details.trim() === "") {
      const errorMessage =
        "Details parameter is required and cannot be empty.";
      logWrapper.error(errorMessage);
      return {
        success: false,
        error: { code: "MISSING_DETAILS", message: errorMessage },
        fromCache: false,
      };
    }

    // Parse taskId - handle both string and number values
    let taskId;
    if (typeof id === "string") {
      // Parse as integer for main task IDs
      taskId = parseInt(id, 10);
      if (isNaN(taskId)) {
        const errorMessage = `Invalid task ID: ${id}. Task ID must be a positive integer.`;
        logWrapper.error(errorMessage);
        return {
          success: false,
          error: { code: "INVALID_TASK_ID", message: errorMessage },
          fromCache: false,
        };
      }
    } else {
      taskId = id;
    }

    // Use the provided path
    const tasksPath = tasksJsonPath;

    logWrapper.info(
      `Updating task with ID ${taskId} with details: ${details.substring(0, 100)}${details.length > 100 ? "..." : ""}`,
    );

    const wasSilent = isSilentMode();
    if (!wasSilent) {
      enableSilentMode();
    }

    try {
      // Execute core updateTaskById function with proper parameters
      const coreResult = await updateTaskById(
        tasksPath,
        taskId,
        details,
        {
          mcpLog: logWrapper,
          session,
          projectRoot,
          commandName: "update-task",
          outputType: "mcp",
        },
        "json",
      );

      // Check if the core function returned null or an object without success
      if (!coreResult || !coreResult.success) {
        // Core function logs the reason, just return the result as success with updated: false
        // This matches the pattern in update-subtask and avoids throwing an error to the user
        const message = coreResult?.message || `Task ${taskId} was not updated.`;
        logWrapper.info(message);
        return {
          success: true,
          data: {
            message: message,
            taskId: taskId,
            updated: false,
            telemetryData: coreResult?.telemetryData,
          },
          fromCache: false,
        };
      }

      // Task was updated successfully
      const successMessage = `Successfully updated task with ID ${taskId}`;
      logWrapper.success(successMessage);
      return {
        success: true,
        data: {
          message: successMessage,
          taskId: taskId,
          tasksPath: tasksPath,
          updated: true,
          updatedTask: coreResult.updatedTask,
          telemetryData: coreResult.telemetryData,
        },
        fromCache: false,
      };
    } catch (error) {
      logWrapper.error(`Error updating task by ID: ${error.message}`);
      return {
        success: false,
        error: {
          code: "UPDATE_TASK_CORE_ERROR",
          message: error.message || "Unknown error updating task",
        },
        fromCache: false,
      };
    } finally {
      if (!wasSilent && isSilentMode()) {
        disableSilentMode();
      }
    }
  } catch (error) {
    logWrapper.error(`Setup error in updateTaskByIdDirect: ${error.message}`);
    if (isSilentMode()) disableSilentMode();
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
