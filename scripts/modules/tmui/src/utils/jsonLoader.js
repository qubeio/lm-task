/**
 * JSON Loader
 * Utility for loading task data directly from tasks.json file
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

export class JsonLoader {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.tasksFile = options.tasksFile || path.join(this.projectRoot, 'tasks', 'tasks.json');
    this.debug = options.debug || false;
  }

  /**
   * Read and parse the tasks.json file
   * @private
   * @returns {Object|null} Parsed JSON data or null if error occurs
   */
  readTasksJson() {
    try {
      const rawData = fs.readFileSync(this.tasksFile, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error(`Error reading JSON file ${this.tasksFile}:`, error.message);
      if (this.debug) {
        console.error('Full error details:', error);
      }
      return null;
    }
  }

  /**
   * Get all tasks with optional filtering
   * @param {Object} options - Options for filtering tasks
   * @param {string} options.status - Filter tasks by status
   * @param {boolean} options.withSubtasks - Whether to include subtasks
   * @returns {Promise<Object>} Object containing tasks array and stats
   */
  async getTasks(options = {}) {
    try {
      const data = this.readTasksJson();
      if (!data || !data.tasks) {
        throw new Error(`No valid tasks found in ${this.tasksFile}`);
      }

      // Filter tasks by status if specified
      const filteredTasks = options.status && options.status.toLowerCase() !== 'all'
        ? data.tasks.filter(task => 
            task.status && 
            task.status.toLowerCase() === options.status.toLowerCase()
          )
        : data.tasks;

      // Calculate statistics
      const stats = this.calculateStats(data.tasks);

      // If withSubtasks is false and we have subtasks, filter them out
      const tasksToReturn = [...filteredTasks];
      if (!options.withSubtasks) {
        for (const task of tasksToReturn) {
          if (task.subtasks) {
            delete task.subtasks;
          }
        }
      }

      return { tasks: tasksToReturn, stats };
    } catch (error) {
      console.error('Error getting tasks:', error.message);
      return { tasks: [], stats: this.getEmptyStats() };
    }
  }

  /**
   * Get a specific task by ID
   * @param {string|number} taskId - The task ID to find
   * @param {Object} options - Options for filtering
   * @param {string} options.statusFilter - Filter subtasks by status
   * @returns {Promise<Object|null>} The task object or null if not found
   */
  async getTask(taskId, options = {}) {
    try {
      const data = this.readTasksJson();
      if (!data || !data.tasks) {
        throw new Error(`No valid tasks found in ${this.tasksFile}`);
      }

      // Parse task ID to handle both numeric and string IDs
      const parsedId = String(taskId).includes('.')
        ? taskId // It's a subtask ID (e.g., "1.2")
        : Number(taskId); // It's a main task ID

      // Handle subtask ID (e.g., "1.2")
      if (typeof parsedId === 'string' && parsedId.includes('.')) {
        const [parentId, subtaskId] = parsedId.split('.').map(Number);
        const parentTask = data.tasks.find(t => t.id === parentId);
        
        if (!parentTask || !parentTask.subtasks) {
          return null;
        }
        
        const subtask = parentTask.subtasks.find(s => s.id === subtaskId);
        return subtask || null;
      }

      // Handle main task ID
      const task = data.tasks.find(t => t.id === parsedId);
      if (!task) {
        return null;
      }

      // Filter subtasks by status if specified
      if (options.statusFilter && task.subtasks) {
        task.subtasks = task.subtasks.filter(
          subtask => subtask.status === options.statusFilter
        );
      }

      return task;
    } catch (error) {
      console.error(`Error getting task ${taskId}:`, error.message);
      return null;
    }
  }

  /**
   * Update task status
   * @param {string|number} taskId - The task ID to update
   * @param {string} newStatus - The new status to set
   * @returns {Promise<boolean>} Success or failure
   */
  async updateTaskStatus(taskId, newStatus) {
    try {
      const data = this.readTasksJson();
      if (!data || !data.tasks) {
        throw new Error(`No valid tasks found in ${this.tasksFile}`);
      }

      // Parse task ID to handle both numeric and string IDs
      const isSubtask = String(taskId).includes('.');
      
      if (isSubtask) {
        // Handle subtask ID (e.g., "1.2")
        const [parentId, subtaskId] = String(taskId).split('.').map(Number);
        const parentTaskIndex = data.tasks.findIndex(t => t.id === parentId);
        
        if (parentTaskIndex === -1 || !data.tasks[parentTaskIndex].subtasks) {
          throw new Error(`Task ${parentId} or its subtasks not found`);
        }
        
        const subtaskIndex = data.tasks[parentTaskIndex].subtasks.findIndex(
          s => s.id === subtaskId
        );
        
        if (subtaskIndex === -1) {
          throw new Error(`Subtask ${taskId} not found`);
        }
        
        data.tasks[parentTaskIndex].subtasks[subtaskIndex].status = newStatus;
      } else {
        // Handle main task ID
        const taskIndex = data.tasks.findIndex(t => t.id === Number(taskId));
        
        if (taskIndex === -1) {
          throw new Error(`Task ${taskId} not found`);
        }
        
        data.tasks[taskIndex].status = newStatus;
      }

      // Write updated data back to file
      fs.writeFileSync(this.tasksFile, JSON.stringify(data, null, 2), 'utf8');
      
      // Generate individual task files to keep them in sync with tasks.json
      try {
        // Use the CLI command to generate task files
        const execAsync = promisify(exec);
        await execAsync(`npx task-master generate --file="${this.tasksFile}"`);
      } catch (genError) {
        console.warn(`Warning: Failed to regenerate task files: ${genError.message}`);
        // Continue even if file generation fails - the JSON is still updated
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating task ${taskId} status:`, error.message);
      return false;
    }
  }

  /**
   * Calculate task statistics
   * @private
   * @param {Array} tasks - Array of tasks
   * @returns {Object} Statistics object
   */
  calculateStats(tasks) {
    const stats = this.getEmptyStats();
    
    if (!tasks || !Array.isArray(tasks)) {
      return stats;
    }

    stats.total = tasks.length;
    
    // Count task statuses
    for (const task of tasks) {
      if (task.status === 'done' || task.status === 'completed') {
        stats.completed++;
      } else if (task.status === 'in-progress') {
        stats.inProgress++;
      } else if (task.status === 'pending') {
        stats.pending++;
      } else if (task.status === 'blocked') {
        stats.blocked++;
      } else if (task.status === 'deferred') {
        stats.deferred++;
      } else if (task.status === 'cancelled') {
        stats.cancelled++;
      }
      
      // Count subtask statuses
      if (task.subtasks && Array.isArray(task.subtasks)) {
        stats.subtasks.total += task.subtasks.length;
        
        for (const subtask of task.subtasks) {
          if (subtask.status === 'done' || subtask.status === 'completed') {
            stats.subtasks.completed++;
          } else if (subtask.status === 'in-progress') {
            stats.subtasks.inProgress++;
          } else if (subtask.status === 'pending') {
            stats.subtasks.pending++;
          } else if (subtask.status === 'blocked') {
            stats.subtasks.blocked++;
          } else if (subtask.status === 'deferred') {
            stats.subtasks.deferred++;
          } else if (subtask.status === 'cancelled') {
            stats.subtasks.cancelled++;
          }
        }
      }
    }
    
    // Calculate completion percentages
    stats.completionPercentage = stats.total > 0 
      ? (stats.completed / stats.total) * 100 
      : 0;
      
    stats.subtasks.completionPercentage = stats.subtasks.total > 0 
      ? (stats.subtasks.completed / stats.subtasks.total) * 100 
      : 0;
    
    return stats;
  }

  /**
   * Get empty stats object structure
   * @private
   * @returns {Object} Empty stats object
   */
  getEmptyStats() {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      blocked: 0,
      deferred: 0,
      cancelled: 0,
      completionPercentage: 0,
      subtasks: {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        blocked: 0,
        deferred: 0,
        cancelled: 0,
        completionPercentage: 0
      }
    };
  }
}
