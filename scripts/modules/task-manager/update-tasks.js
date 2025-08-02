import path from "path";
import chalk from "chalk";
import boxen from "boxen";
import Table from "cli-table3";
import { z } from "zod"; // Keep Zod for post-parsing validation

import {
  log as consoleLog,
  readJSON,
  writeJSON,
  truncate,
  isSilentMode,
} from "../utils.js";

import {
  getStatusWithColor,
  startLoadingIndicator,
  stopLoadingIndicator,
  displayAiUsageSummary,
} from "../ui.js";

import { getDebugFlag } from "../config-manager.js";
import generateTaskFiles from "./generate-task-files.js";

// Zod schema for validating the structure of tasks AFTER parsing
const updatedTaskSchema = z
  .object({
    id: z.number().int(),
    title: z.string(),
    description: z.string(),
    status: z.string(),
    dependencies: z.array(z.union([z.number().int(), z.string()])),
    priority: z.string().optional(),
    details: z.string().optional(),
    testStrategy: z.string().optional(),
    subtasks: z.array(z.any()).optional(), // Keep subtasks flexible for now
  })
  .strip(); // Allow potential extra fields during parsing if needed, then validate structure
const updatedTaskArraySchema = z.array(updatedTaskSchema);

/**
 * Parses an array of task objects from AI's text response.
 * @param {string} text - Response text from AI.
 * @param {number} expectedCount - Expected number of tasks.
 * @param {Function | Object} logFn - The logging function or MCP log object.
 * @param {boolean} isMCP - Flag indicating if logFn is MCP logger.
 * @returns {Array} Parsed and validated tasks array.
 * @throws {Error} If parsing or validation fails.
 */
function parseUpdatedTasksFromText(text, expectedCount, logFn, isMCP) {
  const report = (level, ...args) => {
    if (isMCP) {
      if (typeof logFn[level] === "function") logFn[level](...args);
      else logFn.info(...args);
    } else if (!isSilentMode()) {
      // Check silent mode for consoleLog
      consoleLog(level, ...args);
    }
  };

  report(
    "info",
    "Attempting to parse updated tasks array from text response...",
  );
  if (!text || text.trim() === "")
    throw new Error("AI response text is empty.");

  let cleanedResponse = text.trim();
  const originalResponseForDebug = cleanedResponse;
  let parseMethodUsed = "raw"; // Track which method worked

  // --- NEW Step 1: Try extracting between [] first ---
  const firstBracketIndex = cleanedResponse.indexOf("[");
  const lastBracketIndex = cleanedResponse.lastIndexOf("]");
  let potentialJsonFromArray = null;

  if (firstBracketIndex !== -1 && lastBracketIndex > firstBracketIndex) {
    potentialJsonFromArray = cleanedResponse.substring(
      firstBracketIndex,
      lastBracketIndex + 1,
    );
    // Basic check to ensure it's not just "[]" or malformed
    if (potentialJsonFromArray.length <= 2) {
      potentialJsonFromArray = null; // Ignore empty array
    }
  }

  // If [] extraction yielded something, try parsing it immediately
  if (potentialJsonFromArray) {
    try {
      const testParse = JSON.parse(potentialJsonFromArray);
      // It worked! Use this as the primary cleaned response.
      cleanedResponse = potentialJsonFromArray;
      parseMethodUsed = "brackets";
    } catch (e) {
      report(
        "info",
        "Content between [] looked promising but failed initial parse. Proceeding to other methods.",
      );
      // Reset cleanedResponse to original if bracket parsing failed
      cleanedResponse = originalResponseForDebug;
    }
  }

  // --- Step 2: If bracket parsing didn't work or wasn't applicable, try code block extraction ---
  if (parseMethodUsed === "raw") {
    // Only look for ```json blocks now
    const codeBlockMatch = cleanedResponse.match(
      /```json\s*([\s\S]*?)\s*```/i, // Only match ```json
    );
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
      parseMethodUsed = "codeblock";
      report("info", "Extracted JSON content from JSON Markdown code block.");
    } else {
      report("info", "No JSON code block found.");
      // --- Step 3: If code block failed, try stripping prefixes ---
      const commonPrefixes = [
        "json\n",
        "javascript\n", // Keep checking common prefixes just in case
        "python\n",
        "here are the updated tasks:",
        "here is the updated json:",
        "updated tasks:",
        "updated json:",
        "response:",
        "output:",
      ];
      let prefixFound = false;
      for (const prefix of commonPrefixes) {
        if (cleanedResponse.toLowerCase().startsWith(prefix)) {
          cleanedResponse = cleanedResponse.substring(prefix.length).trim();
          parseMethodUsed = "prefix";
          report("info", `Stripped prefix: "${prefix.trim()}"`);
          prefixFound = true;
          break;
        }
      }
      if (!prefixFound) {
        report(
          "warn",
          "Response does not appear to contain [], JSON code block, or known prefix. Attempting raw parse.",
        );
      }
    }
  }

  // --- Step 4: Attempt final parse ---
  let parsedTasks;
  try {
    parsedTasks = JSON.parse(cleanedResponse);
  } catch (parseError) {
    report("error", `Failed to parse JSON array: ${parseError.message}`);
    report(
      "error",
      `Extraction method used: ${parseMethodUsed}`, // Log which method failed
    );
    report(
      "error",
      `Problematic JSON string (first 500 chars): ${cleanedResponse.substring(0, 500)}`,
    );
    report(
      "error",
      `Original Raw Response (first 500 chars): ${originalResponseForDebug.substring(0, 500)}`,
    );
    throw new Error(
      `Failed to parse JSON response array: ${parseError.message}`,
    );
  }

  // --- Step 5 & 6: Validate Array structure and Zod schema ---
  if (!Array.isArray(parsedTasks)) {
    report(
      "error",
      `Parsed content is not an array. Type: ${typeof parsedTasks}`,
    );
    report(
      "error",
      `Parsed content sample: ${JSON.stringify(parsedTasks).substring(0, 200)}`,
    );
    throw new Error("Parsed AI response is not a valid JSON array.");
  }

  report("info", `Successfully parsed ${parsedTasks.length} potential tasks.`);
  if (expectedCount && parsedTasks.length !== expectedCount) {
    report(
      "warn",
      `Expected ${expectedCount} tasks, but parsed ${parsedTasks.length}.`,
    );
  }

  const validationResult = updatedTaskArraySchema.safeParse(parsedTasks);
  if (!validationResult.success) {
    report("error", "Parsed task array failed Zod validation.");
    validationResult.error.errors.forEach((err) => {
      report("error", `  - Path '${err.path.join(".")}': ${err.message}`);
    });
    throw new Error(
      `AI response failed task structure validation: ${validationResult.error.message}`,
    );
  }

  report("info", "Successfully validated task structure.");
  return validationResult.data.slice(
    0,
    expectedCount || validationResult.data.length,
  );
}

/**
 * Update tasks based on new context - FUNCTIONALITY REMOVED
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} fromId - Task ID to start updating from
 * @param {boolean} [useResearch=false] - Whether to use the research AI role (unused).
 * @param {Object} context - Context object containing session and mcpLog.
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json').
 */
async function updateTasks(
  tasksPath,
  fromId,
  useResearch = false,
  context = {},
  outputFormat = "text", // Default to text for CLI
) {
  const { mcpLog } = context;
  const isMCP = !!mcpLog;

  const message = "AI-powered task update functionality has been removed. Please manually edit tasks using other available commands.";

  if (isMCP) {
    if (mcpLog && typeof mcpLog.info === "function") {
      mcpLog.info(message);
    }
  } else {
    console.log(chalk.yellow(message));
    console.log(chalk.white("\nAvailable alternatives:"));
    console.log("  • Use lm-tasker set-status to change task status");
    console.log("  • Use lm-tasker add-subtask to add new subtasks");
    console.log("  • Manually edit tasks.json file directly");
  }

  return {
    success: false,
    message: message,
    updatedTasks: [],
    telemetryData: null
  };
}

export default updateTasks;
