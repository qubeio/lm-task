/**
 * tools/update-subtask.js
 * Tool to append additional information to a specific subtask
 */

import { z } from "zod";
import {
  handleApiResult,
  createErrorResponse,
  withNormalizedProjectRoot,
} from "./utils.js";
import { updateSubtaskByIdDirect } from "../core/task-master-core.js";
import { findTasksJsonPath } from "../core/utils/path-utils.js";

/**
 * Register the update-subtask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerUpdateSubtaskTool(server) {
  server.addTool({
    name: "update_subtask",
    description:
      "Appends timestamped information to a specific subtask without replacing existing content",
    parameters: z.object({
      id: z
        .string()
        .describe(
          'ID of the subtask to update in format "parentId.subtaskId" (e.g., "5.2"). Parent ID is the ID of the task that contains the subtask.',
        ),
      details: z
        .string()
        .optional()
        .describe(
          "Additional details or information to append to the subtask. Will be timestamped and added to existing details.",
        ),
      file: z.string().optional().describe("Absolute path to the tasks file"),
      projectRoot: z
        .string()
        .describe("The directory of the project. Must be an absolute path."),
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      const toolName = "update_subtask";
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

        // 3. Call Direct Function
        const result = await updateSubtaskByIdDirect(
          {
            tasksJsonPath: tasksJsonPath,
            id: args.id,
            details: args.details,
            projectRoot: args.projectRoot,
          },
          log,
          { session },
        );

        // 4. Handle Result
        log.info(
          `${toolName}: Direct function result: success=${result.success}`,
        );
        return handleApiResult(result, log, "Error updating subtask");
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
