/**
 * task-master-core.js
 * Central module that imports and re-exports all direct function implementations
 * for improved organization and maintainability.
 */

// Import direct function implementations
import { listTasksDirect } from "./direct-functions/list-tasks.js";
import { getCacheStatsDirect } from "./direct-functions/cache-stats.js";
import { updateTasksDirect } from "./direct-functions/update-tasks.js";
import { updateTaskByIdDirect } from "./direct-functions/update-task-by-id.js";
import { updateSubtaskByIdDirect } from "./direct-functions/update-subtask-by-id.js";
import { generateTaskFilesDirect } from "./direct-functions/generate-task-files.js";
import { setTaskStatusDirect } from "./direct-functions/set-task-status.js";
import { showTaskDirect } from "./direct-functions/show-task.js";
import { nextTaskDirect } from "./direct-functions/next-task.js";

import { addTaskDirect } from "./direct-functions/add-task.js";
import { addSubtaskDirect } from "./direct-functions/add-subtask.js";
import { removeSubtaskDirect } from "./direct-functions/remove-subtask.js";

import { clearSubtasksDirect } from "./direct-functions/clear-subtasks.js";

import { removeDependencyDirect } from "./direct-functions/remove-dependency.js";
import { validateDependenciesDirect } from "./direct-functions/validate-dependencies.js";
import { fixDependenciesDirect } from "./direct-functions/fix-dependencies.js";

import { addDependencyDirect } from "./direct-functions/add-dependency.js";
import { removeTaskDirect } from "./direct-functions/remove-task.js";
import { moveTaskDirect } from "./direct-functions/move-task.js";

// Re-export utility functions
export { findTasksJsonPath } from "./utils/path-utils.js";

// Use Map for potential future enhancements like introspection or dynamic dispatch
export const directFunctions = new Map([
  ["listTasksDirect", listTasksDirect],
  ["getCacheStatsDirect", getCacheStatsDirect],
  ["updateTasksDirect", updateTasksDirect],
  ["updateTaskByIdDirect", updateTaskByIdDirect],
  ["updateSubtaskByIdDirect", updateSubtaskByIdDirect],
  ["generateTaskFilesDirect", generateTaskFilesDirect],
  ["setTaskStatusDirect", setTaskStatusDirect],
  ["showTaskDirect", showTaskDirect],
  ["nextTaskDirect", nextTaskDirect],

  ["addTaskDirect", addTaskDirect],
  ["addSubtaskDirect", addSubtaskDirect],
  ["removeSubtaskDirect", removeSubtaskDirect],

  ["clearSubtasksDirect", clearSubtasksDirect],

  ["removeDependencyDirect", removeDependencyDirect],
  ["validateDependenciesDirect", validateDependenciesDirect],
  ["fixDependenciesDirect", fixDependenciesDirect],

  ["addDependencyDirect", addDependencyDirect],
  ["removeTaskDirect", removeTaskDirect],
  ["moveTaskDirect", moveTaskDirect],
]);

// Re-export all direct function implementations
export {
  listTasksDirect,
  getCacheStatsDirect,
  updateTasksDirect,
  updateTaskByIdDirect,
  updateSubtaskByIdDirect,
  generateTaskFilesDirect,
  setTaskStatusDirect,
  showTaskDirect,
  nextTaskDirect,
  addTaskDirect,
  addSubtaskDirect,
  removeSubtaskDirect,
  clearSubtasksDirect,
  removeDependencyDirect,
  validateDependenciesDirect,
  fixDependenciesDirect,
  addDependencyDirect,
  removeTaskDirect,
  moveTaskDirect,
};
