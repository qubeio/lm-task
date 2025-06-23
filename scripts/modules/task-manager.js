/**
 * task-manager.js
 * Task management functions for the LM-Tasker CLI
 */

import { findTaskById } from './utils.js';
import parsePRD from './task-manager/parse-prd.js';
import updateTasks from './task-manager/update-tasks.js';
import updateTaskById from './task-manager/update-task-by-id.js';
import generateTaskFiles from './task-manager/generate-task-files.js';
import setTaskStatus from './task-manager/set-task-status.js';
import updateSingleTaskStatus from './task-manager/update-single-task-status.js';
import listTasks from './task-manager/list-tasks.js';

import clearSubtasks from './task-manager/clear-subtasks.js';
import addTask from './task-manager/add-task.js';

import findNextTask from './task-manager/find-next-task.js';
import addSubtask from './task-manager/add-subtask.js';
import removeSubtask from './task-manager/remove-subtask.js';
import updateSubtaskById from './task-manager/update-subtask-by-id.js';
import removeTask from './task-manager/remove-task.js';
import taskExists from './task-manager/task-exists.js';
import isTaskDependentOn from './task-manager/is-task-dependent.js';
import moveTask from './task-manager/move-task.js';

// Export task manager functions
export {
	parsePRD,
	updateTasks,
	updateTaskById,
	updateSubtaskById,
	generateTaskFiles,
	setTaskStatus,
	updateSingleTaskStatus,
	listTasks,
	clearSubtasks,
	addTask,
	addSubtask,
	removeSubtask,
	findNextTask,
	removeTask,
	findTaskById,
	taskExists,
	isTaskDependentOn,
	moveTask
};
