/**
 * add-task.js
 * Add a new task to the tasks.json file
 */

import { z } from "zod";
import chalk from "chalk";
import boxen from "boxen";
import {
  getStatusWithColor,
  startLoadingIndicator,
  stopLoadingIndicator,
} from "../ui.js";
import { readJSON, writeJSON, log as consoleLog, truncate } from "../utils.js";
import { getDefaultPriority } from "../config-manager.js";
import generateTaskFiles from "./generate-task-files.js";

// Define Zod schema for manual task data
const ManualTaskDataSchema = z.object({
  title: z.string().describe("Clear, concise title for the task"),
  description: z
    .string()
    .describe("A one or two sentence description of the task"),
  details: z
    .string()
    .optional()
    .describe("In-depth implementation details, considerations, and guidance"),
  testStrategy: z
    .string()
    .optional()
    .describe("Detailed approach for verifying task completion"),
  dependencies: z
    .array(z.number())
    .optional()
    .describe(
      "Array of task IDs that this task depends on (must be completed before this task can start)",
    ),
});

/**
 * Add a new task manually
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} prompt - Description of the task to add (unused in manual mode)
 * @param {Array} dependencies - Task dependencies
 * @param {string} priority - Task priority
 * @param {function} reportProgress - Function to report progress to MCP server (optional)
 * @param {Object} mcpLog - MCP logger object (optional)
 * @param {Object} session - Session object from MCP server (optional)
 * @param {string} outputFormat - Output format (text or json)
 * @param {Object} customEnv - Custom environment variables (optional)
 * @param {Object} manualTaskData - Manual task data (required for manual task creation)
 * @param {boolean} useResearch - Whether to use the research model (unused in manual mode)
 * @param {Object} context - Context object containing session and potentially projectRoot
 * @param {string} [context.projectRoot] - Project root path (for MCP/env fallback)
 * @param {string} [context.commandName] - The name of the command being executed (for telemetry)
 * @param {string} [context.outputType] - The output type ('cli' or 'mcp', for telemetry)
 * @returns {Promise<object>} An object containing newTaskId and telemetryData
 */
async function addTask(
  tasksPath,
  prompt,
  dependencies = [],
  priority = null,
  context = {},
  outputFormat = "text", // Default to text for CLI
  manualTaskData = null,
  useResearch = false,
) {
  const { session, mcpLog, projectRoot, commandName, outputType } = context;
  const isMCP = !!mcpLog;

  // Create a consistent logFn object regardless of context
  const logFn = isMCP
    ? mcpLog // Use MCP logger if provided
    : {
        // Create a wrapper around consoleLog for CLI
        info: (...args) => consoleLog("info", ...args),
        warn: (...args) => consoleLog("warn", ...args),
        error: (...args) => consoleLog("error", ...args),
        debug: (...args) => consoleLog("debug", ...args),
        success: (...args) => consoleLog("success", ...args),
      };

  const effectivePriority = priority || getDefaultPriority(projectRoot);

  logFn.info(
    `Adding new task manually. Priority: ${effectivePriority}, Dependencies: ${dependencies.join(", ") || "None"}, ProjectRoot: ${projectRoot}`,
  );

  // Only manual task creation is supported - AI functionality has been removed
  if (!manualTaskData) {
    throw new Error(
      "AI-powered task creation has been removed. Please provide manual task data with title and description.",
    );
  }

  logFn.info("Using manually provided task data");

  // Validate manual task data
  const validationResult = ManualTaskDataSchema.safeParse(manualTaskData);
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    throw new Error(`Invalid manual task data: ${errors}`);
  }

  const taskData = validationResult.data;

  // Read existing tasks
  const data = readJSON(tasksPath);

  // Find the next available task ID
  const existingIds = data.tasks.map((t) => t.id);
  const newTaskId = Math.max(...existingIds, 0) + 1;

  // Validate dependencies
  const numericDependencies = dependencies.map((d) => parseInt(d, 10)).filter((d) => !isNaN(d));
  const validDependencies = numericDependencies.filter((depId) => 
    data.tasks.some((t) => t.id === depId)
  );

  if (validDependencies.length !== numericDependencies.length) {
    const invalidDeps = numericDependencies.filter(depId => 
      !data.tasks.some((t) => t.id === depId)
    );
    logFn.warn(`Invalid dependencies ignored: ${invalidDeps.join(', ')}`);
  }

  // Create the new task object
  const newTask = {
    id: newTaskId,
    title: taskData.title,
    description: taskData.description,
    details: taskData.details || "",
    testStrategy: taskData.testStrategy || "",
    status: "pending",
    dependencies: taskData.dependencies?.length
      ? taskData.dependencies
      : validDependencies,
    priority: effectivePriority,
    subtasks: [], // Initialize with empty subtasks array
  };

  // Add the task to the tasks array
  data.tasks.push(newTask);

  // Write the updated tasks to the file
  writeJSON(tasksPath, data);

  // Generate task files
  try {
    await generateTaskFiles(tasksPath);
    logFn.info("Task files generated successfully");
  } catch (error) {
    logFn.warn(`Failed to generate task files: ${error.message}`);
  }

  // Display success message for CLI
  if (outputFormat === "text") {
    // Build dependency display
    let dependencyDisplay = "";
    if (newTask.dependencies.length > 0) {
      dependencyDisplay = chalk.white("Dependencies:") + "\n";
      newTask.dependencies.forEach((dep) => {
        const depTask = data.tasks.find((t) => t.id === dep);
        const title = depTask ? truncate(depTask.title, 30) : "Unknown task";
        dependencyDisplay += chalk.white(`  - ${dep}: ${title}`) + "\n";
      });
    } else {
      dependencyDisplay = chalk.white("Dependencies: None") + "\n";
    }

    // Show success message box
    console.log(
      boxen(
        chalk.white.bold(`Task ${newTaskId} Created Successfully`) +
          "\n\n" +
          chalk.white(`Title: ${newTask.title}`) +
          "\n" +
          chalk.white(`Status: ${getStatusWithColor(newTask.status)}`) +
          "\n" +
          chalk.white(
            `Priority: ${chalk[getPriorityColor(newTask.priority)](newTask.priority)}`,
          ) +
          "\n\n" +
          dependencyDisplay +
          "\n" +
          chalk.white.bold("Next Steps:") +
          "\n" +
          chalk.cyan(
            `1. Run ${chalk.yellow(`lm-tasker show ${newTaskId}`)} to see complete task details`,
          ) +
          "\n" +
          chalk.cyan(
            `2. Run ${chalk.yellow(`lm-tasker set-status --id=${newTaskId} --status=in-progress`)} to start working on it`,
          ) +
          "\n" +
          chalk.cyan(
            `3. Run ${chalk.yellow(`lm-tasker add-subtask --parent=${newTaskId} --title="Subtask title"`)} to break it down into subtasks`,
          ),
        { padding: 1, borderColor: "green", borderStyle: "round" },
      ),
    );
  }

  logFn.info(`DEBUG: Returning new task ID: ${newTaskId}`);
  return {
    newTaskId: newTaskId,
    telemetryData: null, // No AI telemetry in manual mode
  };
}

// Helper function for priority color
function getPriorityColor(priority) {
  switch (priority) {
    case "high":
      return "red";
    case "medium":
      return "yellow";
    case "low":
      return "green";
    default:
      return "white";
  }
}

export default addTask;
