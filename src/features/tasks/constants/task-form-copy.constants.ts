export type TaskFormVariant = 'task' | 'subtask';

interface TaskFormFieldCopy {
  label: string;
  placeholder: string;
}

interface TaskFormCopy {
  formLabel: string; // aria-label on the <form>
  submitLabel: string; // idle submit button text
  submittingLabel: string; // submit button text while pending
  title: TaskFormFieldCopy;
  description: TaskFormFieldCopy;
}

export const TASK_FORM_COPY: Record<TaskFormVariant, TaskFormCopy> = {
  task: {
    formLabel: 'Add a new task',
    submitLabel: 'Add task',
    submittingLabel: 'Adding…',
    title: { label: 'Task', placeholder: 'Add a task' },
    description: {
      label: 'Description (optional)',
      placeholder: 'Add detail for this task',
    },
  },
  subtask: {
    formLabel: 'Add a new subtask',
    submitLabel: 'Add subtask',
    submittingLabel: 'Adding…',
    title: { label: 'Subtask', placeholder: 'Add a subtask' },
    description: {
      label: 'Description (optional)',
      placeholder: 'Add detail for this subtask',
    },
  },
};
