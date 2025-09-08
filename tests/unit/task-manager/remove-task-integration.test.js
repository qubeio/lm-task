/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import removeTask from '../../../scripts/modules/task-manager/remove-task.js';

describe('removeTask integration tests', () => {
  const testDir = '/tmp/lm-tasker-test';
  const tasksPath = path.join(testDir, 'tasks.json');

  beforeEach(() => {
    // Clean up and create test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('Basic functionality', () => {
    it('should handle empty task IDs', async () => {
      const result = await removeTask(tasksPath, '');
      expect(result.success).toBe(false);
      // Check the actual structure - might be in errors array or error field
      const errorMessage = result.error || (result.errors && result.errors[0]) || '';
      expect(errorMessage).toContain('No valid task IDs provided');
    });

    it('should handle missing tasks file', async () => {
      const result = await removeTask(tasksPath, '1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid tasks found');
    });

    it('should handle invalid tasks file content', async () => {
      // Write invalid JSON
      fs.writeFileSync(tasksPath, 'invalid json');
      
      const result = await removeTask(tasksPath, '1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid tasks found');
    });

    it('should handle non-existent task ID', async () => {
      // Create valid tasks file
      const tasksData = {
        tasks: [
          { id: 1, title: 'Task 1', status: 'pending' }
        ]
      };
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));

      const result = await removeTask(tasksPath, '999');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task with ID 999 not found');
    });
  });

  describe('Successful removal', () => {
    it('should successfully remove a single task', async () => {
      // Create tasks file with multiple tasks
      const tasksData = {
        tasks: [
          { id: 1, title: 'Task 1', status: 'pending' },
          { id: 2, title: 'Task 2', status: 'done' },
          { id: 3, title: 'Task 3', status: 'pending' }
        ]
      };
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));

      const result = await removeTask(tasksPath, '2');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully removed task 2');
      expect(result.removedTasks).toHaveLength(1);
      expect(result.removedTasks[0].id).toBe(2);

      // Verify the task was actually removed from the file
      const updatedData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      expect(updatedData.tasks).toHaveLength(2);
      expect(updatedData.tasks.find(t => t.id === 2)).toBeUndefined();
    });

    it('should successfully remove multiple tasks', async () => {
      const tasksData = {
        tasks: [
          { id: 1, title: 'Task 1', status: 'pending' },
          { id: 2, title: 'Task 2', status: 'done' },
          { id: 3, title: 'Task 3', status: 'pending' },
          { id: 4, title: 'Task 4', status: 'pending' }
        ]
      };
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));

      const result = await removeTask(tasksPath, '1,3');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully removed task 1');
      expect(result.message).toContain('Successfully removed task 3');
      expect(result.removedTasks).toHaveLength(2);

      // Verify the tasks were actually removed
      const updatedData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      expect(updatedData.tasks).toHaveLength(2);
      expect(updatedData.tasks.find(t => t.id === 1)).toBeUndefined();
      expect(updatedData.tasks.find(t => t.id === 3)).toBeUndefined();
    });

    it('should successfully remove a subtask', async () => {
      const tasksData = {
        tasks: [
          {
            id: 1,
            title: 'Parent Task',
            status: 'pending',
            subtasks: [
              { id: 1, title: 'Subtask 1', status: 'pending' },
              { id: 2, title: 'Subtask 2', status: 'done' },
              { id: 3, title: 'Subtask 3', status: 'pending' }
            ]
          }
        ]
      };
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));

      const result = await removeTask(tasksPath, '1.2');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully removed subtask 1.2');
      expect(result.removedTasks).toHaveLength(1);
      expect(result.removedTasks[0].id).toBe(2);

      // Verify the subtask was actually removed
      const updatedData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      const parentTask = updatedData.tasks.find(t => t.id === 1);
      expect(parentTask.subtasks).toHaveLength(2);
      expect(parentTask.subtasks.find(st => st.id === 2)).toBeUndefined();
    });
  });

  describe('Dependency cleanup', () => {
    it('should clean up dependencies when removing tasks', async () => {
      const tasksData = {
        tasks: [
          { id: 1, title: 'Task 1', status: 'done', dependencies: [] },
          { id: 2, title: 'Task 2', status: 'pending', dependencies: [1] },
          { id: 3, title: 'Task 3', status: 'pending', dependencies: [1, 2] }
        ]
      };
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));

      const result = await removeTask(tasksPath, '1');
      
      expect(result.success).toBe(true);

      // Verify dependencies were cleaned up
      const updatedData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      const task2 = updatedData.tasks.find(t => t.id === 2);
      const task3 = updatedData.tasks.find(t => t.id === 3);
      
      expect(task2.dependencies).toEqual([]);
      expect(task3.dependencies).toEqual([2]);
    });
  });

  describe('Task file management', () => {
    it('should delete corresponding task files', async () => {
      const tasksData = {
        tasks: [
          { id: 1, title: 'Task 1', status: 'pending' },
          { id: 2, title: 'Task 2', status: 'done' }
        ]
      };
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));
      
      // Create a task file that should be deleted
      const taskFilePath = path.join(testDir, 'task_002.txt');
      fs.writeFileSync(taskFilePath, 'Task 2 content');

      const result = await removeTask(tasksPath, '2');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Deleted task file');
      
      // Verify the task file was deleted
      expect(fs.existsSync(taskFilePath)).toBe(false);
    });
  });

  describe('Error scenarios', () => {
    it('should handle mixed success and failure', async () => {
      const tasksData = {
        tasks: [
          { id: 1, title: 'Task 1', status: 'pending' },
          { id: 2, title: 'Task 2', status: 'done' }
        ]
      };
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));

      const result = await removeTask(tasksPath, '1,999');
      
      // Should fail overall due to invalid ID, but still remove valid task
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task with ID 999 not found');
      expect(result.removedTasks).toHaveLength(1);
      expect(result.removedTasks[0].id).toBe(1);
    });

    it('should handle non-existent subtask', async () => {
      const tasksData = {
        tasks: [
          {
            id: 1,
            title: 'Parent Task',
            status: 'pending',
            subtasks: [
              { id: 1, title: 'Subtask 1', status: 'pending' }
            ]
          }
        ]
      };
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));

      const result = await removeTask(tasksPath, '1.999');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task with ID 1.999 not found');
    });
  });
});
