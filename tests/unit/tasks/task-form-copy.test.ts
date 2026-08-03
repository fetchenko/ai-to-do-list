import { describe, expect, it } from 'vitest';

import {
  TASK_FORM_COPY,
  TaskFormVariant,
} from '@/features/tasks/constants/task-form-copy.constants';

const variants: TaskFormVariant[] = ['task', 'subtask'];

describe('TASK_FORM_COPY', () => {
  it('gives "task" and "subtask" distinct copy everywhere it matters', () => {
    // This is the regression this test exists for: it's easy to "simplify"
    // TASK_FORM_COPY.subtask by copy-pasting TASK_FORM_COPY.task later and
    // forgetting to change the words. If that happens, AddTaskForm/EditTaskForm
    // would render, typecheck, and lint cleanly — nothing would catch it
    // except a human reading the UI. This assertion catches it in CI instead.
    const [task, subtask] = variants.map((v) => TASK_FORM_COPY[v]);

    expect(task.formLabel).not.toBe(subtask.formLabel);
    expect(task.submitLabel).not.toBe(subtask.submitLabel);
    expect(task.title.label).not.toBe(subtask.title.label);
    expect(task.title.placeholder).not.toBe(subtask.title.placeholder);
    expect(task.description.placeholder).not.toBe(
      subtask.description.placeholder
    );
  });

  it('has no blank copy for any variant', () => {
    for (const variant of variants) {
      const copy = TASK_FORM_COPY[variant];

      expect(copy.formLabel.trim()).not.toBe('');
      expect(copy.submitLabel.trim()).not.toBe('');
      expect(copy.submittingLabel.trim()).not.toBe('');
      expect(copy.title.label.trim()).not.toBe('');
      expect(copy.title.placeholder.trim()).not.toBe('');
      expect(copy.description.label.trim()).not.toBe('');
      expect(copy.description.placeholder.trim()).not.toBe('');
    }
  });
});
