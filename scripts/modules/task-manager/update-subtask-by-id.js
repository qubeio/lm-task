import fs from "fs";
import path from "path";
import chalk from "chalk";
import boxen from "boxen";
import Table from "cli-table3";

import {
  getStatusWithColor,
  startLoadingIndicator,
  stopLoadingIndicator,
  displayAiUsageSummary,
} from "../ui.js";
import {
  log as consoleLog,
  readJSON,
  writeJSON,
  truncate,
  isSilentMode,
} from "../utils.js";
import { generateTextService } from "../ai-services-unified.js";
import { getDebugFlag } from "../config-manager.js";
import generateTaskFiles from "./generate-task-files.js";

/**
 * Update a subtask by appending additional timestamped information - FUNCTIONALITY REMOVED
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} subtaskId - ID of the subtask to update in format "parentId.subtaskId"
 * @param {Object} context - Context object containing session and mcpLog.
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json').
 * @returns {Promise<Object|null>} - Result indicating functionality has been removed.
 */
async function updateSubtaskById(
  tasksPath,
  subtaskId,
  context = {},
  outputFormat = context.mcpLog ? "json" : "text",
) {
  const { mcpLog } = context;
  const isMCP = !!mcpLog;

  const message = "AI-powered subtask update functionality has been removed. Please manually edit subtasks using other available commands.";

  if (isMCP) {
    if (mcpLog && typeof mcpLog.info === "function") {
      mcpLog.info(message);
    }
  } else {
    console.log(chalk.yellow(message));
    console.log(chalk.white("\nAvailable alternatives:"));
    console.log("  • Use lm-tasker set-status to change subtask status");
    console.log("  • Use lm-tasker add-subtask to add new subtasks");
    console.log("  • Manually edit tasks.json file directly");
  }

  return {
    success: false,
    message: message,
    updatedSubtask: null,
    telemetryData: null
  };
}

export default updateSubtaskById;
