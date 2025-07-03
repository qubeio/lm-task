import fs from "fs";
import path from "path";
import chalk from "chalk";
import boxen from "boxen";

import {
  getStatusWithColor,
} from "../ui.js";
import {
  log as consoleLog,
  readJSON,
  writeJSON,
  isSilentMode,
} from "../utils.js";
import generateTaskFiles from "./generate-task-files.js";

/**
 * Update a subtask by appending additional timestamped information
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} subtaskId - ID of the subtask to update in format "parentId.subtaskId"
 * @param {string} details - Additional details to append to the subtask
 * @param {Object} context - Context object containing session and mcpLog.
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json').
 * @returns {Promise<Object|null>} - Result object with updated subtask info or null if not updated.
 */
async function updateSubtaskById(
  tasksPath,
  subtaskId,
  details,
  context = {},
  outputFormat = context.mcpLog ? "json" : "text",
) {
  const { mcpLog } = context;
  const isMCP = !!mcpLog;
  const log = isMCP ? mcpLog : {
    info: (msg) => consoleLog("info", msg),
    error: (msg) => consoleLog("error", msg),
    success: (msg) => consoleLog("success", msg)
  };

  try {
    // Validate input parameters
    if (!subtaskId || typeof subtaskId !== "string" || !subtaskId.includes(".")) {
      const errorMessage = `Invalid subtask ID format: ${subtaskId}. Subtask ID must be in format "parentId.subtaskId" (e.g., "5.2").`;
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedSubtask: null,
        telemetryData: null
      };
    }

    if (!details || typeof details !== "string" || details.trim() === "") {
      const errorMessage = "Details parameter is required and cannot be empty.";
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedSubtask: null,
        telemetryData: null
      };
    }

    // Parse parent and subtask IDs
    const [parentIdStr, subtaskIdStr] = subtaskId.split(".");
    const parentId = parseInt(parentIdStr, 10);
    const subtaskIdNum = parseInt(subtaskIdStr, 10);

    if (isNaN(parentId) || parentId <= 0 || isNaN(subtaskIdNum) || subtaskIdNum <= 0) {
      const errorMessage = `Invalid subtask ID format: ${subtaskId}. Both parent and subtask IDs must be positive numbers.`;
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedSubtask: null,
        telemetryData: null
      };
    }

    // Check if tasks file exists
    if (!fs.existsSync(tasksPath)) {
      const errorMessage = `Tasks file not found at path: ${tasksPath}`;
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedSubtask: null,
        telemetryData: null
      };
    }

    // Read the tasks file
    const data = readJSON(tasksPath);
    if (!data || !data.tasks) {
      const errorMessage = `No valid tasks found in ${tasksPath}`;
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedSubtask: null,
        telemetryData: null
      };
    }

    // Find the parent task
    const parentTask = data.tasks.find((t) => t.id === parentId);
    if (!parentTask) {
      const errorMessage = `Parent task with ID ${parentId} not found`;
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedSubtask: null,
        telemetryData: null
      };
    }

    // Find the subtask
    if (!parentTask.subtasks || !Array.isArray(parentTask.subtasks)) {
      const errorMessage = `Parent task ${parentId} has no subtasks`;
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedSubtask: null,
        telemetryData: null
      };
    }

    const subtask = parentTask.subtasks.find((st) => st.id === subtaskIdNum);
    if (!subtask) {
      const errorMessage = `Subtask with ID ${subtaskId} not found`;
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedSubtask: null,
        telemetryData: null
      };
    }

    // Check if subtask is already completed
    if (subtask.status === "done" || subtask.status === "completed") {
      const message = `Cannot update subtask ${subtaskId} ("${subtask.title}") because it is already marked as "${subtask.status}".

Completed subtasks are protected from changes to preserve the integrity of finished work.

If you need to make changes, consider these alternatives:
• Change the subtask status first: lm-tasker set-status --id=${subtaskId} --status=in-progress
• Create a new subtask for additional work: lm-tasker add-subtask --parent=${parentId} --title="Follow-up work"
• View the current details: lm-tasker show ${subtaskId}`;
      log.info(message);
      return {
        success: false,
        message: message,
        updatedSubtask: null,
        telemetryData: null
      };
    }

    // Create timestamped entry
    const timestamp = new Date().toISOString();
    const timestampedDetails = `\n\n--- Updated ${timestamp} ---\n${details.trim()}`;

    // Update the subtask details
    const oldDetails = subtask.details || "";
    subtask.details = oldDetails + timestampedDetails;

    // Write the updated tasks back to the file
    writeJSON(tasksPath, data);

    // Generate task files
    log.info("Regenerating task files...");
    await generateTaskFiles(tasksPath, path.dirname(tasksPath));

    const successMessage = `Successfully updated subtask ${subtaskId}`;
    log.info(successMessage);

    // Display success message for CLI
    if (!isMCP && !isSilentMode()) {
      console.log(
        boxen(
          chalk.white.bold(`Subtask ${subtaskId} Updated Successfully`) +
            "\n\n" +
            chalk.white(`Title: ${subtask.title}`) +
            "\n" +
            chalk.white(`Status: ${getStatusWithColor(subtask.status)}`) +
            "\n" +
            chalk.white(`Details appended: ${details.substring(0, 100)}${details.length > 100 ? "..." : ""}`) +
            "\n\n" +
            chalk.white.bold("Next Steps:") +
            "\n" +
            chalk.cyan(
              `1. Run ${chalk.yellow(`lm-tasker show ${subtaskId}`)} to see the updated subtask details`,
            ) +
            "\n" +
            chalk.cyan(
              `2. Run ${chalk.yellow(`lm-tasker set-status --id=${subtaskId} --status=in-progress`)} to update status if needed`,
            ),
          {
            padding: 1,
            borderColor: "green",
            borderStyle: "round",
            margin: { top: 1 },
          },
        ),
      );
    }

    return {
      success: true,
      message: successMessage,
      updatedSubtask: subtask,
      telemetryData: null
    };

  } catch (error) {
    const errorMessage = `Error updating subtask: ${error.message}`;
    log.error(errorMessage);
    return {
      success: false,
      message: errorMessage,
      updatedSubtask: null,
      telemetryData: null
    };
  }
}

export default updateSubtaskById;
