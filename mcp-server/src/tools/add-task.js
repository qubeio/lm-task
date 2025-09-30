/**
 * tools/add-task.js
 * Tool to add a new task manually
 */

import { z } from "zod";
import fs from "fs";
import path from "path";
import {
  createErrorResponse,
  handleApiResult,
  withNormalizedProjectRoot,
} from "./utils.js";
import { addTaskDirect } from "../core/task-master-core.js";
import { findTasksJsonPath } from "../core/utils/path-utils.js";
import { createMinimalTasksJson, writeJSON } from "#scripts/utils.js";

/**
 * Register the addTask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerAddTaskTool(server) {
  server.addTool({
    name: "add_task",
    description: "Add a new task manually with specified details",
    parameters: z.object({
      title: z
        .string()
        .describe("Task title (required)"),
      description: z
        .string()
        .describe("Task description (required)"),
      details: z
        .string()
        .optional()
        .describe("Implementation details (optional)"),
      testStrategy: z
        .string()
        .optional()
        .describe("Test strategy (optional)"),
      dependencies: z
        .string()
        .optional()
        .describe("Comma-separated list of task IDs this task depends on"),
      priority: z
        .string()
        .optional()
        .describe("Task priority (high, medium, low)"),
      file: z
        .string()
        .optional()
        .describe("Path to the tasks file (default: tasks/tasks.json)"),
      projectRoot: z
        .string()
        .describe("The directory of the project. Must be an absolute path."),
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        log.info(`Starting add-task with args: ${JSON.stringify(args)}`);

        // Use args.projectRoot directly (guaranteed by withNormalizedProjectRoot)
        let tasksJsonPath;
        let wasAutoInitialized = false;
        
        try {
          tasksJsonPath = findTasksJsonPath(
            { projectRoot: args.projectRoot, file: args.file },
            log,
          );
        } catch (error) {
          // If tasks.json is not found, auto-initialize it
          if (error.code === "TASKS_FILE_NOT_FOUND") {
            log.info(`Tasks file not found, auto-initializing...`);
            
            // Determine the tasks.json path
            const defaultTasksPath = path.join(args.projectRoot, "tasks", "tasks.json");
            tasksJsonPath = args.file ? path.resolve(args.projectRoot, args.file) : defaultTasksPath;
            
            // Create the tasks directory if it doesn't exist
            const tasksDir = path.dirname(tasksJsonPath);
            if (!fs.existsSync(tasksDir)) {
              fs.mkdirSync(tasksDir, { recursive: true });
              log.info(`Created tasks directory: ${tasksDir}`);
            }
            
            // Create minimal tasks.json structure
            const minimalTasksData = createMinimalTasksJson();
            writeJSON(tasksJsonPath, minimalTasksData);
            wasAutoInitialized = true;
            
            log.info(`Auto-initialized tasks.json at ${tasksJsonPath}`);
          } else {
            log.error(`Error finding tasks.json: ${error.message}`);
            return createErrorResponse(
              `Failed to find tasks.json: ${error.message}`,
            );
          }
        }

        // Call the direct function
        const result = await addTaskDirect(
          {
            tasksJsonPath: tasksJsonPath,
            prompt: null, // No prompt for manual creation
            title: args.title,
            description: args.description,
            details: args.details,
            testStrategy: args.testStrategy,
            dependencies: args.dependencies,
            priority: args.priority,
            projectRoot: args.projectRoot,
            wasAutoInitialized: wasAutoInitialized,
          },
          log,
          { session },
        );

        return handleApiResult(result, log);
      } catch (error) {
        log.error(`Error in add-task tool: ${error.message}`);
        return createErrorResponse(error.message);
      }
    }),
  });
}
