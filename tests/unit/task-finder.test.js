/**
 * Task finder tests
 */

import { findTaskById } from '../../scripts/modules/utils.js';
import { emptySampleTasks, sampleTasks } from '../fixtures/sample-tasks.js';

describe('Task Finder', () => {
	describe('findTaskById function', () => {
		test('should find a task by numeric ID', () => {
			const result = findTaskById(sampleTasks.tasks, 2);
			expect(result.task).toBeDefined();
			expect(result.task.id).toBe(2);
			expect(result.task.title).toBe('Create Core Functionality');
			expect(result.originalSubtaskCount).toBeNull();
		});

		test('should find a task by string ID', () => {
			const result = findTaskById(sampleTasks.tasks, '2');
			expect(result.task).toBeDefined();
			expect(result.task.id).toBe(2);
			expect(result.originalSubtaskCount).toBeNull();
		});

		test('should find a subtask using dot notation', () => {
			const result = findTaskById(sampleTasks.tasks, '3.1');
			expect(result.task).toBeDefined();
			expect(result.task.id).toBe(1);
			expect(result.task.title).toBe('Create Header Component');
			expect(result.task.isSubtask).toBe(true);
			expect(result.task.parentTask.id).toBe(3);
			expect(result.originalSubtaskCount).toBeNull();
		});

		test('should return null for non-existent task ID', () => {
			const result = findTaskById(sampleTasks.tasks, 99);
			expect(result.task).toBeNull();
			expect(result.originalSubtaskCount).toBeNull();
		});

		test('should return null for non-existent subtask ID', () => {
			const result = findTaskById(sampleTasks.tasks, '3.99');
			expect(result.task).toBeNull();
			expect(result.originalSubtaskCount).toBeNull();
		});

		test('should return null for non-existent parent task ID in subtask notation', () => {
			const result = findTaskById(sampleTasks.tasks, '99.1');
			expect(result.task).toBeNull();
			expect(result.originalSubtaskCount).toBeNull();
		});

		test('should return null when tasks array is empty', () => {
			const result = findTaskById(emptySampleTasks.tasks, 1);
			expect(result.task).toBeNull();
			expect(result.originalSubtaskCount).toBeNull();
		});
		test('should work correctly when no status filter is provided', () => {
			// Pass null as the status filter
			const result = findTaskById(sampleTasks.tasks, 2, null);

			expect(result.task).toBeDefined();
			expect(result.task.id).toBe(2);
		});

		test('should filter subtasks by status when status filter is provided', () => {
			// Find a task with subtasks and filter by status
			const result = findTaskById(sampleTasks.tasks, 3, 'pending');

			expect(result.task).toBeDefined();
			expect(result.task.id).toBe(3);
			// Should have filtered subtasks based on status
			if (result.task.subtasks) {
				result.task.subtasks.forEach((subtask) => {
					expect(subtask.status).toBe('pending');
				});
			}
		});

		test('should handle invalid status filter gracefully', () => {
			// Pass an object instead of a string as status filter
			const result = findTaskById(sampleTasks.tasks, 2, { invalid: 'object' });

			expect(result.task).toBeDefined();
			expect(result.task.id).toBe(2);
			// Should not filter since statusFilter is not a string
		});
	});
});
