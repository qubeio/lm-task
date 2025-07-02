/**
 * update-subtask-by-id.js
 * Direct function implementation for updating a subtask by ID with additional information
 */

import { updateSubtaskById } from "../../../../scripts/modules/task-manager.js";
import {
  enableSilentMode,
  disableSilentMode,
  isSilentMode,
} from "../../../../scripts/modules/utils.js";
import { createLogWrapper } from "../../tools/utils.js";

/**
 * Direct function wrapper for updateSubtaskById with error handling.
 *
 * @param {Object} args - Command arguments containing id, tasksJsonPath, and projectRoot.
 * @param {string} args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param {string} args.id - Subtask ID in format "parentId.subtaskId" (e.g., "5.2").
 * @param {string} [args.projectRoot] - Project root path.
 * @param {Object} log - Logger object.
 * @param {Object} context - Context object containing session data.
 * @returns {Promise<Object>} - Result object with success status and data/error information.
 */
export async function updateSubtaskByIdDirect(args, log, context = {}) {
  const { session } = context;
  // Destructure expected args, including projectRoot
  const { tasksJsonPath, id, projectRoot } = args;

  const logWrapper = createLogWrapper(log);

  try {
    logWrapper.info(
      `Updating subtask by ID via direct function. ID: ${id}, ProjectRoot: ${projectRoot}`,
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
        "No subtask ID specified. Please provide a subtask ID to update.";
      logWrapper.error(errorMessage);
      return {
        success: false,
        error: { code: "MISSING_SUBTASK_ID", message: errorMessage },
        fromCache: false,
      };
    }

    // Validate subtask ID format (should contain a dot)
    if (!id.includes(".")) {
      const errorMessage = `Invalid subtask ID format: ${id}. Subtask ID must be in format "parentId.subtaskId" (e.g., "5.2").`;
      logWrapper.error(errorMessage);
      return {
        success: false,
        error: { code: "INVALID_SUBTASK_ID", message: errorMessage },
        fromCache: false,
      };
    }

    // Use the provided path
    const tasksPath = tasksJsonPath;

    logWrapper.info(`Updating subtask with ID ${id}`);

    const wasSilent = isSilentMode();
    if (!wasSilent) {
      enableSilentMode();
    }

    try {
      // Execute core updateSubtaskById function with proper parameters
      const coreResult = await updateSubtaskById(
        tasksPath,
        id,
        {
          mcpLog: logWrapper,
          session,
          projectRoot,
          commandName: "update-subtask",
          outputType: "mcp",
        },
        "json",
      );

      // Check if the core function returned null or an object without success
      if (!coreResult || coreResult.updatedSubtask === null) {
        // Core function logs the reason, just return success with info
        const message = `Subtask ${id} was not updated.`;
        logWrapper.info(message);
        return {
          success: true,
          data: {
            message: message,
            subtaskId: id,
            updated: false,
            telemetryData: coreResult?.telemetryData,
          },
          fromCache: false,
        };
      }

      // Subtask was updated successfully
      const successMessage = `Successfully updated subtask with ID ${id}`;
      logWrapper.success(successMessage);
      return {
        success: true,
        data: {
          message: successMessage,
          subtaskId: id,
          tasksPath: tasksPath,
          updated: true,
          updatedSubtask: coreResult.updatedSubtask,
          telemetryData: coreResult.telemetryData,
        },
        fromCache: false,
      };
    } catch (error) {
      logWrapper.error(`Error updating subtask by ID: ${error.message}`);
      return {
        success: false,
        error: {
          code: "UPDATE_SUBTASK_CORE_ERROR",
          message: error.message || "Unknown error updating subtask",
        },
        fromCache: false,
      };
    } finally {
      if (!wasSilent && isSilentMode()) {
        disableSilentMode();
      }
    }
  } catch (error) {
    logWrapper.error(`Setup error in updateSubtaskByIdDirect: ${error.message}`);
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
