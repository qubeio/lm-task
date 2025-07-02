/**
 * tools/update.js
 * Tool to update tasks based on new context/prompt
 */

import { z } from "zod";
import {
  handleApiResult,
  createErrorResponse,
  withNormalizedProjectRoot,
} from "./utils.js";
import { updateTasksDirect } from "../core/task-master-core.js";
import { findTasksJsonPath } from "../core/utils/path-utils.js";

/**
 * Register the update tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerUpdateTool(server) {
  server.addTool({
    name: "update",
    description:
      "Update multiple upcoming tasks (with ID >= 'from' ID) - FUNCTIONALITY REMOVED. Use other task management commands instead.",
    parameters: z.object({
      from: z
        .string()
        .describe(
          "Task ID from which to start updating (inclusive). IMPORTANT: This tool uses 'from', not 'id'",
        ),

      file: z
        .string()
        .optional()
        .describe("Path to the tasks file relative to project root"),
      projectRoot: z
        .string()
        .optional()
        .describe(
          "The directory of the project. (Optional, usually from session)",
        ),
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      const toolName = "update";
      try {
        log.info(
          `Executing ${toolName} tool with args: ${JSON.stringify(args)}`,
        );

        let tasksJsonPath;
        try {
          tasksJsonPath = findTasksJsonPath(
            { projectRoot: args.projectRoot, file: args.file },
            log,
          );
          log.info(`${toolName}: Resolved tasks path: ${tasksJsonPath}`);
        } catch (error) {
          log.error(`${toolName}: Error finding tasks.json: ${error.message}`);
          return createErrorResponse(
            `Failed to find tasks.json: ${error.message}`,
          );
        }

        // Call Direct Function
        const result = await updateTasksDirect(
          {
            tasksJsonPath: tasksJsonPath,
            from: args.from,
            research: false, // Research disabled
            projectRoot: args.projectRoot,
          },
          log,
          { session },
        );

        // Handle Result
        log.info(
          `${toolName}: Direct function result: success=${result.success}`,
        );
        return handleApiResult(result, log, "Error updating tasks");
      } catch (error) {
        log.error(
          `Critical error in ${toolName} tool execute: ${error.message}`,
        );
        return createErrorResponse(
          `Internal tool error (${toolName}): ${error.message}`,
        );
      }
    }),
  });
}
