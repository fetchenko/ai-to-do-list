import { useId } from 'react';

import { FieldErrors, UseFormRegister } from 'react-hook-form';

import { FormField } from '@/components/primitives/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TaskForm } from '@/features/tasks/schema/tasks';

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 1000;

interface FieldProps {
  register: UseFormRegister<TaskForm>;
  errors: FieldErrors<TaskForm>;
  hideLabel?: boolean;
  autoFocus?: boolean;
  label?: string;
  placeholder?: string;
}

export function TitleField({
  register,
  errors,
  hideLabel = false,
  autoFocus = false,
  label = 'Task',
  placeholder = 'Add a task',
}: FieldProps) {
  const id = useId();

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
        aria-describedby={errors.title ? `${id}-error` : undefined}
        {...register('title')}
      />
    </FormField>
  );
}

export function DescriptionField({
  register,
  errors,
  hideLabel = false,
  label = 'Description (optional)',
  placeholder = 'Add detail for this task',
}: FieldProps) {
  const id = useId();

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
        aria-describedby={errors.description ? `${id}-error` : undefined}
        {...register('description')}
      />
    </FormField>
  );
}