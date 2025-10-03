/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import listTasks from '../../../scripts/modules/task-manager/list-tasks.js';

describe('list-tasks (JSON output)', () => {
  const testDir = '/tmp/lm-tasker-test-list';
  const tasksPath = path.join(testDir, 'tasks.json');

  const sample = {
    tasks: [
      {
        id: 1,
        title: 'Task 1',
        status: 'pending',
        priority: 'high',
        details: 'internal detail should not appear in JSON output',
        subtasks: [
          {
            id: 1,
            title: 'Subtask 1.1',
            status: 'done',
            details: 'subtask details to be omitted'
          },
          {
            id: 2,
            title: 'Subtask 1.2',
            status: 'pending',
            details: 'subtask details to be omitted'
          }
        ]
      },
      {
        id: 2,
        title: 'Task 2',
        status: 'done',
        priority: 'medium',
        details: 'done task'
      },
      {
        id: 3,
        title: 'Task 3',
        status: 'in-progress',
        priority: 'low',
        details: 'in progress task'
      }
    ]
  };

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(tasksPath, JSON.stringify(sample, null, 2));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('returns structured JSON with details removed (tasks and subtasks)', () => {
    const result = listTasks(tasksPath, undefined, true, 'json');

    expect(result).toBeDefined();
    expect(Array.isArray(result.tasks)).toBe(true);
    expect(result.tasks).toHaveLength(3);

    // Parent tasks should not include `details`
    result.tasks.forEach((t) => {
      expect(t.details).toBeUndefined();
    });

    // Subtasks (if present) should also have `details` removed
    const task1 = result.tasks.find((t) => t.id === 1);
    expect(task1).toBeDefined();
    expect(Array.isArray(task1.subtasks)).toBe(true);
    task1.subtasks.forEach((st) => {
      expect(st.details).toBeUndefined();
    });
  });

  it("filters by status when statusFilter != 'all'", () => {
    const result = listTasks(tasksPath, 'pending', true, 'json');
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].id).toBe(1);
  });

  it('returns all tasks when status is undefined or "all"', () => {
    const r1 = listTasks(tasksPath, undefined, false, 'json');
    expect(r1.tasks).toHaveLength(3);

    const r2 = listTasks(tasksPath, 'all', false, 'json');
    expect(r2.tasks).toHaveLength(3);
  });

  it('throws structured error when file is missing (json mode)', () => {
    if (fs.existsSync(tasksPath)) {
      fs.rmSync(tasksPath);
    }
    try {
      listTasks(tasksPath, undefined, false, 'json');
      // Should not reach here
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeDefined();
      expect(e.code).toBe('TASK_LIST_ERROR');
      expect(typeof e.message).toBe('string');
    }
  });
});


