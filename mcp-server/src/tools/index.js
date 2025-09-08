/**
 * tools/index.js
 * Export all LMTasker CLI tools for MCP server
 */

import { registerListTasksTool } from "./get-tasks.js";
import logger from "../logger.js";
import { registerSetTaskStatusTool } from "./set-task-status.js";
import { registerUpdateTool } from "./update.js";
import { registerUpdateTaskTool } from "./update-task.js";
import { registerUpdateSubtaskTool } from "./update-subtask.js";
import { registerGenerateTool } from "./generate.js";
import { registerShowTaskTool } from "./get-task.js";
import { registerNextTaskTool } from "./next-task.js";
import { registerAddTaskTool } from "./add-task.js";
import { registerAddSubtaskTool } from "./add-subtask.js";
import { registerRemoveSubtaskTool } from "./remove-subtask.js";
import { registerClearSubtasksTool } from "./clear-subtasks.js";
import { registerRemoveDependencyTool } from "./remove-dependency.js";
import { registerValidateDependenciesTool } from "./validate-dependencies.js";
import { registerFixDependenciesTool } from "./fix-dependencies.js";
import { registerAddDependencyTool } from "./add-dependency.js";
import { registerRemoveTaskTool } from "./remove-task.js";
import { registerMoveTaskTool } from "./move-task.js";

/**
 * Register all LMTasker tools with the MCP server
 * @param {FastMCP} server - The MCP server instance
 */
export function registerLMTaskerTools(server) {
  try {
    // Register each tool in a logical workflow order

    // Group 1: Initialization & Setup
    // Note: Project initialization is now handled automatically by add-task command

    // Group 2: Task Listing & Viewing
    registerListTasksTool(server);
    registerShowTaskTool(server);
    registerNextTaskTool(server);

    // Group 3: Task Status & Management
    registerSetTaskStatusTool(server);
    registerGenerateTool(server);

    // Group 4: Task Creation & Modification
    registerAddTaskTool(server);
    registerAddSubtaskTool(server);
    registerUpdateTool(server);
    registerUpdateTaskTool(server);
    registerUpdateSubtaskTool(server);
    registerRemoveTaskTool(server);
    registerRemoveSubtaskTool(server);
    registerClearSubtasksTool(server);
    registerMoveTaskTool(server);

    // Group 6: Dependency Management
    registerAddDependencyTool(server);
    registerRemoveDependencyTool(server);
    registerValidateDependenciesTool(server);
    registerFixDependenciesTool(server);
  } catch (error) {
    logger.error(`Error registering LMTasker tools: ${error.message}`);
    throw error;
  }
}

export default {
  registerLMTaskerTools,
};
