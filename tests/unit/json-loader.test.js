/**
 * Unit tests for JsonLoader class
 */

import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import { JsonLoader } from '../../scripts/modules/tmui/src/utils/jsonLoader.js';

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  statSync: jest.fn()
}));

describe('JsonLoader', () => {
  let jsonLoader;
  const mockProjectRoot = '/mock/project/root';
  const mockTasksFile = path.join(mockProjectRoot, 'tasks', 'tasks.json');
  
  // Sample task data for testing
  const mockTasksData = {
    tasks: [
      {
        id: 1,
        title: 'Task 1',
        status: 'pending',
        details: 'Task 1 details',
        subtasks: [
          { id: 1, title: 'Subtask 1.1', status: 'done', details: 'Subtask 1.1 details' },
          { id: 2, title: 'Subtask 1.2', status: 'pending', details: 'Subtask 1.2 details' }
        ]
      },
      {
        id: 2,
        title: 'Task 2',
        status: 'done',
        details: 'Task 2 details',
        subtasks: []
      },
      {
        id: 3,
        title: 'Task 3',
        status: 'in-progress',
        details: 'Task 3 details',
        subtasks: [
          { id: 1, title: 'Subtask 3.1', status: 'pending', details: 'Subtask 3.1 details' }
        ]
      }
    ]
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create JsonLoader instance with mock options
    jsonLoader = new JsonLoader({
      projectRoot: mockProjectRoot,
      tasksFile: mockTasksFile,
      debug: false
    });
    
    // Default mock implementation for readFileSync
    fs.readFileSync.mockImplementation(() => JSON.stringify(mockTasksData));
  });

  describe('readTasksJson', () => {
    test('should read and parse tasks.json file successfully', () => {
      const result = jsonLoader.readTasksJson();
      
      expect(fs.readFileSync).toHaveBeenCalledWith(mockTasksFile, 'utf8');
      expect(result).toEqual(mockTasksData);
    });

    test('should return null and log error when file read fails', () => {
      // Mock console.error to prevent actual logging during test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock readFileSync to throw an error
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      const result = jsonLoader.readTasksJson();
      
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getTasks', () => {
    test('should return all tasks when no filter is provided', async () => {
      const result = await jsonLoader.getTasks();
      
      expect(result.tasks).toHaveLength(3);
      expect(result.tasks).toEqual(mockTasksData.tasks);
    });

    test('should filter tasks by status', async () => {
      const result = await jsonLoader.getTasks({ status: 'pending' });
      
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe(1);
    });

    test('should remove subtasks when withSubtasks is false', async () => {
      const result = await jsonLoader.getTasks({ withSubtasks: false });
      
      expect(result.tasks).toHaveLength(3);
      expect(result.tasks[0].subtasks).toBeUndefined();
      expect(result.tasks[1].subtasks).toBeUndefined();
      expect(result.tasks[2].subtasks).toBeUndefined();
    });

    test('should return empty tasks array and default stats when file read fails', async () => {
      // Mock readTasksJson to return null (simulating file read error)
      jest.spyOn(jsonLoader, 'readTasksJson').mockReturnValue(null);
      
      const result = await jsonLoader.getTasks();
      
      expect(result.tasks).toEqual([]);
      expect(result.stats).toEqual(jsonLoader.getEmptyStats());
    });
  });

  describe('getTask', () => {
    test('should return a specific task by ID', async () => {
      const result = await jsonLoader.getTask(2);
      
      expect(result).toEqual(mockTasksData.tasks[1]);
    });

    test('should return a specific subtask by ID', async () => {
      const result = await jsonLoader.getTask('1.2');
      
      expect(result).toEqual(mockTasksData.tasks[0].subtasks[1]);
    });

    test('should return null when task is not found', async () => {
      const result = await jsonLoader.getTask(999);
      
      expect(result).toBeNull();
    });

    test('should return null when subtask is not found', async () => {
      const result = await jsonLoader.getTask('1.999');
      
      expect(result).toBeNull();
    });

    test('should filter subtasks by status', async () => {
      const task = await jsonLoader.getTask(1, { statusFilter: 'done' });
      
      expect(task.subtasks).toHaveLength(1);
      expect(task.subtasks[0].id).toBe(1);
    });
  });

  describe('updateTaskStatus', () => {
    test('should update main task status', async () => {
      const result = await jsonLoader.updateTaskStatus(1, 'done');
      
      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
      
      // Verify the task status was updated in the data passed to writeFileSync
      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.tasks[0].status).toBe('done');
    });

    test('should update subtask status', async () => {
      const result = await jsonLoader.updateTaskStatus('1.2', 'done');
      
      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
      
      // Verify the subtask status was updated in the data passed to writeFileSync
      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.tasks[0].subtasks[1].status).toBe('done');
    });

    test('should return false when task is not found', async () => {
      const result = await jsonLoader.updateTaskStatus(999, 'done');
      
      expect(result).toBe(false);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test('should return false when subtask is not found', async () => {
      const result = await jsonLoader.updateTaskStatus('1.999', 'done');
      
      expect(result).toBe(false);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('calculateStats', () => {
    test('should calculate correct statistics for tasks and subtasks', () => {
      const stats = jsonLoader.calculateStats(mockTasksData.tasks);
      
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1); // Task 2 is 'done'
      expect(stats.inProgress).toBe(1); // Task 3 is 'in-progress'
      expect(stats.pending).toBe(1); // Task 1 is 'pending'
      
      expect(stats.subtasks.total).toBe(3);
      expect(stats.subtasks.completed).toBe(1); // Subtask 1.1 is 'done'
      expect(stats.subtasks.pending).toBe(2); // Subtasks 1.2 and 3.1 are 'pending'
      
      // Check completion percentages
      expect(stats.completionPercentage).toBeCloseTo(33.33, 1);
      expect(stats.subtasks.completionPercentage).toBeCloseTo(33.33, 1);
    });

    test('should return empty stats when tasks array is null or empty', () => {
      expect(jsonLoader.calculateStats(null)).toEqual(jsonLoader.getEmptyStats());
      expect(jsonLoader.calculateStats([])).toEqual(jsonLoader.getEmptyStats());
    });
  });
});
