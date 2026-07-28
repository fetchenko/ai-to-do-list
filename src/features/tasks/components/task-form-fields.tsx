import { FieldErrors, UseFormRegister } from 'react-hook-form';

import { FormField } from '@/components/primitives/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TaskForm } from '@/features/tasks/schema/tasks';

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 1000;

interface FieldProps {
  /** Unique per form instance so ids never collide when multiple forms render at once
   *  (e.g. the top-level add form + a per-subtask add form). */
  idPrefix: string;
  register: UseFormRegister<TaskForm>;
  errors: FieldErrors<TaskForm>;
  hideLabel?: boolean;
  autoFocus?: boolean;
  /** These components intentionally don't know about "task" vs "subtask" —
   *  callers (AddTaskForm/EditTaskForm) resolve copy from TASK_FORM_COPY
   *  and pass it in, keeping this file a single-responsibility field renderer. */
  label?: string;
  placeholder?: string;
}

export function TitleField({
  idPrefix,
  register,
  errors,
  hideLabel = false,
  autoFocus = false,
  label = 'Task',
  placeholder = 'Add a task',
}: FieldProps) {
  const id = `${idPrefix}-title`;
  const errorId = `${id}-error`;

  return (
    <FormField
      idPrefix={id}
      label={label}
      error={errors.title?.message}
      hideLabel={hideLabel}
    >
      <Input
        id={id}
        autoFocus={autoFocus}
        maxLength={TITLE_MAX_LENGTH}
        placeholder={placeholder}
        aria-invalid={!!errors.title}
        aria-describedby={errors.title ? errorId : undefined}
        {...register('title')}
      />
    </FormField>
  );
}

export function DescriptionField({
  idPrefix,
  register,
  errors,
  hideLabel = false,
  label = 'Description (optional)',
  placeholder = 'Add detail for this task',
}: FieldProps) {
  const id = `${idPrefix}-description`;
  const errorId = `${id}-error`;

  return (
    <FormField
      idPrefix={id}
      label={label}
      error={errors.description?.message}
      hideLabel={hideLabel}
    >
      <Textarea
        id={id}
        rows={3}
        maxLength={DESCRIPTION_MAX_LENGTH}
        placeholder={placeholder}
        className="resize-y"
        aria-invalid={!!errors.description}
        aria-describedby={errors.description ? errorId : undefined}
        {...register('description')}
      />
    </FormField>
  );
}
