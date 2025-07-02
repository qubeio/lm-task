import fs from "fs";
import path from "path";
import chalk from "chalk";
import boxen from "boxen";
import Table from "cli-table3";
import { z } from "zod"; // Keep Zod for post-parse validation

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

import { generateTextService } from "../ai-services-unified.js";
import {
  getDebugFlag,
  isApiKeySet, // Keep this check
} from "../config-manager.js";
import generateTaskFiles from "./generate-task-files.js";

// Zod schema for post-parsing validation of the updated task object
const updatedTaskSchema = z
  .object({
    id: z.number().int(),
    title: z.string(), // Title should be preserved, but check it exists
    description: z.string(),
    status: z.string(),
    dependencies: z.array(z.union([z.number().int(), z.string()])),
    priority: z.string().optional(),
    details: z.string().optional(),
    testStrategy: z.string().optional(),
    subtasks: z.array(z.any()).optional(),
  })
  .strip(); // Allows parsing even if AI adds extra fields, but validation focuses on schema

/**
 * Parses a single updated task object from AI's text response.
 * @param {string} text - Response text from AI.
 * @param {number} expectedTaskId - The ID of the task expected.
 * @param {Function | Object} logFn - Logging function or MCP logger.
 * @param {boolean} isMCP - Flag indicating MCP context.
 * @returns {Object} Parsed and validated task object.
 * @throws {Error} If parsing or validation fails.
 */
function parseUpdatedTaskFromText(text, expectedTaskId, logFn, isMCP) {
  // Report helper consistent with the established pattern
  const report = (level, ...args) => {
    if (isMCP) {
      if (typeof logFn[level] === "function") logFn[level](...args);
      else logFn.info(...args);
    } else if (!isSilentMode()) {
      logFn(level, ...args);
    }
  };

  report(
    "info",
    "Attempting to parse updated task object from text response...",
  );
  if (!text || text.trim() === "")
    throw new Error("AI response text is empty.");

  let cleanedResponse = text.trim();
  const originalResponseForDebug = cleanedResponse;
  let parseMethodUsed = "raw"; // Keep track of which method worked

  // --- NEW Step 1: Try extracting between {} first ---
  const firstBraceIndex = cleanedResponse.indexOf("{");
  const lastBraceIndex = cleanedResponse.lastIndexOf("}");
  let potentialJsonFromBraces = null;

  if (firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
    potentialJsonFromBraces = cleanedResponse.substring(
      firstBraceIndex,
      lastBraceIndex + 1,
    );
    if (potentialJsonFromBraces.length <= 2) {
      potentialJsonFromBraces = null; // Ignore empty braces {}
    }
  }

  // If {} extraction yielded something, try parsing it immediately
  if (potentialJsonFromBraces) {
    try {
      const testParse = JSON.parse(potentialJsonFromBraces);
      // It worked! Use this as the primary cleaned response.
      cleanedResponse = potentialJsonFromBraces;
      parseMethodUsed = "braces";
    } catch (e) {
      report(
        "info",
        "Content between {} looked promising but failed initial parse. Proceeding to other methods.",
      );
      // Reset cleanedResponse to original if brace parsing failed
      cleanedResponse = originalResponseForDebug;
    }
  }

  // --- Step 2: If brace parsing didn't work or wasn't applicable, try code block extraction ---
  if (parseMethodUsed === "raw") {
    const codeBlockMatch = cleanedResponse.match(
      /```(?:json|javascript)?\s*([\s\S]*?)\s*```/i,
    );
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
      parseMethodUsed = "codeblock";
      report("info", "Extracted JSON content from Markdown code block.");
    } else {
      // --- Step 3: If code block failed, try stripping prefixes ---
      const commonPrefixes = [
        "json\n",
        "javascript\n",
        // ... other prefixes ...
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
          "Response does not appear to contain {}, code block, or known prefix. Attempting raw parse.",
        );
      }
    }
  }

  // --- Step 4: Attempt final parse ---
  let parsedTask;
  try {
    parsedTask = JSON.parse(cleanedResponse);
  } catch (parseError) {
    report("error", `Failed to parse JSON object: ${parseError.message}`);
    report(
      "error",
      `Problematic JSON string (first 500 chars): ${cleanedResponse.substring(0, 500)}`,
    );
    report(
      "error",
      `Original Raw Response (first 500 chars): ${originalResponseForDebug.substring(0, 500)}`,
    );
    throw new Error(
      `Failed to parse JSON response object: ${parseError.message}`,
    );
  }

  if (!parsedTask || typeof parsedTask !== "object") {
    report(
      "error",
      `Parsed content is not an object. Type: ${typeof parsedTask}`,
    );
    report(
      "error",
      `Parsed content sample: ${JSON.stringify(parsedTask).substring(0, 200)}`,
    );
    throw new Error("Parsed AI response is not a valid JSON object.");
  }

  // Validate the parsed task object using Zod
  const validationResult = updatedTaskSchema.safeParse(parsedTask);
  if (!validationResult.success) {
    report("error", "Parsed task object failed Zod validation.");
    validationResult.error.errors.forEach((err) => {
      report("error", `  - Field '${err.path.join(".")}': ${err.message}`);
    });
    throw new Error(
      `AI response failed task structure validation: ${validationResult.error.message}`,
    );
  }

  // Final check: ensure ID matches expected ID (AI might hallucinate)
  if (validationResult.data.id !== expectedTaskId) {
    report(
      "warn",
      `AI returned task with ID ${validationResult.data.id}, but expected ${expectedTaskId}. Overwriting ID.`,
    );
    validationResult.data.id = expectedTaskId; // Enforce correct ID
  }

  report("info", "Successfully validated updated task structure.");
  return validationResult.data; // Return the validated task data
}

/**
 * Update a single task by ID - FUNCTIONALITY REMOVED
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} taskId - Task ID to update
 * @param {boolean} [useResearch=false] - Whether to use the research AI role (unused).
 * @param {Object} context - Context object containing session and mcpLog.
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json').
 * @returns {Promise<Object|null>} - Result indicating functionality has been removed.
 */
async function updateTaskById(
  tasksPath,
  taskId,
  useResearch = false,
  context = {},
  outputFormat = "text",
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
    updatedTask: null,
    telemetryData: null
  };
}

export default updateTaskById;
