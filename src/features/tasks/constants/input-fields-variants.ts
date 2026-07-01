export type TaskFieldsVariant = 'task' | 'subtask';

export const VARIANTS = {
  task: {
    titleLabel: 'Task',
    titlePlaceholder: 'Task title',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Description (optional)',
  },
  subtask: {
    titleLabel: 'Subtask',
    titlePlaceholder: 'Subtask title',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Description (optional)',
  },
} satisfies Record<
  TaskFieldsVariant,
  {
    titleLabel: string;
    titlePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
  }
>;
