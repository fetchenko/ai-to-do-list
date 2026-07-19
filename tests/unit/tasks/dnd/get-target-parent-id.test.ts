import { describe, expect, it } from 'vitest';

import { getTargetParentId } from '@/features/tasks/utils/dnd/get-target-parent-id';

describe('getTargetParentId', () => {
  describe('when over item is a subtask', () => {
    it('returns parentTaskId from task', () => {
      const result = getTargetParentId({
        type: 'subtask',
        task: {
          parentTaskId: 'parent-1',
        },
      } as any);

      expect(result).toBe('parent-1');
    });

    it('returns null when subtask has no parent task', () => {
      const result = getTargetParentId({
        type: 'subtask',
        task: {
          parentTaskId: null,
        },
      } as any);

      expect(result).toBeNull();
    });
  });

  describe('when over item is empty subtasks container', () => {
    it('returns parentTaskId', () => {
      const result = getTargetParentId({
        type: 'empty-subtasks',
        parentTaskId: 'parent-2',
      } as any);

      expect(result).toBe('parent-2');
    });

    it('returns null when parentTaskId is null', () => {
      const result = getTargetParentId({
        type: 'empty-subtasks',
        parentTaskId: null,
      } as any);

      expect(result).toBeNull();
    });
  });

  describe('when over item is a container', () => {
    it('returns null', () => {
      const result = getTargetParentId({
        type: 'container',
      } as any);

      expect(result).toBeNull();
    });
  });

  describe('when over item is a task', () => {
    it('returns null', () => {
      const result = getTargetParentId({
        type: 'task',
      } as any);

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('returns undefined for unknown type', () => {
      const result = getTargetParentId({
        type: 'unknown',
      } as any);

      expect(result).toBeUndefined();
    });

    it('returns undefined when subtask task data is missing', () => {
      const result = getTargetParentId({
        type: 'subtask',
      } as any);

      expect(result).toBeNull();
    });

    it('returns undefined when empty-subtasks parentTaskId is missing', () => {
      const result = getTargetParentId({
        type: 'empty-subtasks',
      } as any);

      expect(result).toBeNull();
    });
  });
});
