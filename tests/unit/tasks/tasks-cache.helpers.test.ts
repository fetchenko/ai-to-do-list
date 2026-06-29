import { createTask } from '@tests/factories/task.factory';
import { describe, expect, it } from 'vitest';

import { Task } from '@/features/tasks/types/tasks.types';
import {
  findTask,
  removeFromCache,
  restoreToCache,
  updateTaskInCache,
} from '@/features/tasks/utils/tasks-cache';

describe('task cache utils', () => {
  const tasks: Task[] = [
    createTask({
      id: 'task-1',
      title: 'Task 1',
      position: 'a0',
      subtasks: [],
    }),
    createTask({
      id: 'task-2',
      title: 'Task 2',
      position: 'a1',
      subtasks: [
        createTask({
          id: 'sub-1',
          title: 'Subtask 1',
          parentTaskId: 'task-2',
          position: 'a0',
        }),
        createTask({
          id: 'sub-2',
          title: 'Subtask 2',
          parentTaskId: 'task-2',
          position: 'a2',
        }),
      ],
    }),
  ];

  describe('findTask', () => {
    it('finds a root task', () => {
      const result = findTask(tasks, 'task-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('task-1');
    });

    it('finds a subtask', () => {
      const result = findTask(tasks, 'sub-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('sub-1');
    });

    it('returns undefined when task does not exist', () => {
      const result = findTask(tasks, 'missing');

      expect(result).toBeUndefined();
    });
  });

  describe('updateTaskInCache', () => {
    it('updates a root task', () => {
      const result = updateTaskInCache(tasks, 'task-1', {
        title: 'Updated Task',
      });

      expect(result.find((t) => t.id === 'task-1')?.title).toBe('Updated Task');
    });

    it('updates a subtask', () => {
      const result = updateTaskInCache(tasks, 'sub-1', {
        title: 'Updated Subtask',
      });

      const parent = result.find((t) => t.id === 'task-2');

      expect(parent?.subtasks?.find((s) => s.id === 'sub-1')?.title).toBe('Updated Subtask');
    });

    it('does not modify tasks when id is not found', () => {
      const result = updateTaskInCache(tasks, 'missing', {
        title: 'Updated',
      });

      expect(result).toEqual(tasks);
    });
  });

  describe('removeFromCache', () => {
    it('removes a root task', () => {
      const result = removeFromCache(tasks, {
        id: 'task-1',
      } as Task);

      expect(result.map((t) => t.id)).toEqual(['task-2']);
    });

    it('removes a subtask from its parent', () => {
      const result = removeFromCache(tasks, {
        id: 'sub-1',
        parentTaskId: 'task-2',
      } as Task);

      const parent = result.find((t) => t.id === 'task-2');

      expect(parent?.subtasks?.map((s) => s.id)).toEqual(['sub-2']);
    });
  });

  describe('restoreToCache', () => {
    it('restores a root task and keeps tasks sorted by position', () => {
      const cache = [
        createTask({
          id: 'task-1',
          position: 'a0',
          subtasks: [],
        }),
        createTask({
          id: 'task-3',
          position: 'a2',
          subtasks: [],
        }),
      ];

      const result = restoreToCache(cache, {
        id: 'task-2',
        position: 'a1',
      } as Task);

      expect(result.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('restores a subtask and keeps subtasks sorted by position', () => {
      const cache = [
        {
          id: 'task-1',
          position: 'a0',
          subtasks: [
            {
              id: 'sub-1',
              parentTaskId: 'task-1',
              position: 'a0',
            },
            {
              id: 'sub-3',
              parentTaskId: 'task-1',
              position: 'a2',
            },
          ],
        },
      ] as Task[];

      const result = restoreToCache(cache, {
        id: 'sub-2',
        parentTaskId: 'task-1',
        position: 'a1',
      } as Task);

      expect(result[0].subtasks?.map((s) => s.id)).toEqual(['sub-1', 'sub-2', 'sub-3']);
    });
  });
});
