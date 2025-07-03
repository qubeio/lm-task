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
 * Update a task by appending additional timestamped information
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} taskId - ID of the task to update
 * @param {string} details - Additional details to append to the task
 * @param {Object} context - Context object containing session and mcpLog.
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json').
 * @returns {Promise<Object|null>} - Result object with updated task info or null if not updated.
 */
async function updateTaskById(
  tasksPath,
  taskId,
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
    if (!taskId || (typeof taskId !== "number" && typeof taskId !== "string")) {
      const errorMessage = `Invalid task ID: ${taskId}. Task ID must be a positive number.`;
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedTask: null,
        telemetryData: null
      };
    }

    // Convert taskId to number if it's a string
    const numericTaskId = typeof taskId === "string" ? parseInt(taskId, 10) : taskId;
    if (isNaN(numericTaskId) || numericTaskId <= 0) {
      const errorMessage = `Invalid task ID: ${taskId}. Task ID must be a positive number.`;
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedTask: null,
        telemetryData: null
      };
    }

    if (!details || typeof details !== "string" || details.trim() === "") {
      const errorMessage = "Details parameter is required and cannot be empty.";
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedTask: null,
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
        updatedTask: null,
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
        updatedTask: null,
        telemetryData: null
      };
    }

    // Find the task
    const task = data.tasks.find((t) => t.id === numericTaskId);
    if (!task) {
      const errorMessage = `Task with ID ${numericTaskId} not found`;
      log.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedTask: null,
        telemetryData: null
      };
    }

    // Check if task is already completed
    if (task.status === "done" || task.status === "completed") {
      const message = `Cannot update task ${numericTaskId} ("${task.title}") because it is already marked as "${task.status}".

Completed tasks are protected from changes to preserve the integrity of finished work.

If you need to make changes, consider these alternatives:
• Change the task status first: lm-tasker set-status --id=${numericTaskId} --status=in-progress
• Create a new task for additional work: lm-tasker add-task --title="Follow-up work"
• View the current details: lm-tasker show ${numericTaskId}`;
      log.info(message);
      return {
        success: false,
        message: message,
        updatedTask: null,
        telemetryData: null
      };
    }

    // Create timestamped entry
    const timestamp = new Date().toISOString();
    const timestampedDetails = `\n\n--- Updated ${timestamp} ---\n${details.trim()}`;

    // Update the task details
    const oldDetails = task.details || "";
    task.details = oldDetails + timestampedDetails;

    // Write the updated tasks back to the file
    writeJSON(tasksPath, data);

    // Generate task files
    log.info("Regenerating task files...");
    await generateTaskFiles(tasksPath, path.dirname(tasksPath));

    const successMessage = `Successfully updated task ${numericTaskId}`;
    log.info(successMessage);

    // Display success message for CLI
    if (!isMCP && !isSilentMode()) {
      console.log(
        boxen(
          chalk.white.bold(`Task ${numericTaskId} Updated Successfully`) +
            "\n\n" +
            chalk.white(`Title: ${task.title}`) +
            "\n" +
            chalk.white(`Status: ${getStatusWithColor(task.status)}`) +
            "\n" +
            chalk.white(`Details appended: ${details.substring(0, 100)}${details.length > 100 ? "..." : ""}`) +
            "\n\n" +
            chalk.white.bold("Next Steps:") +
            "\n" +
            chalk.cyan(
              `1. Run ${chalk.yellow(`lm-tasker show ${numericTaskId}`)} to see the updated task details`,
            ) +
            "\n" +
            chalk.cyan(
              `2. Run ${chalk.yellow(`lm-tasker set-status --id=${numericTaskId} --status=in-progress`)} to update status if needed`,
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
      updatedTask: task,
      telemetryData: null
    };

  } catch (error) {
    const errorMessage = `Error updating task: ${error.message}`;
    log.error(errorMessage);
    return {
      success: false,
      message: errorMessage,
      updatedTask: null,
      telemetryData: null
    };
  }
}

export default updateTaskById;
