import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { FormError } from '@/components/blocks/form-error';
import { TaskInputDescription } from '@/features/tasks/components/task-input-description';
import { TaskInputTitle } from '@/features/tasks/components/task-input-title';
import { TaskFieldsVariant } from '@/features/tasks/constants/input-fields-variants';
import { TaskFormFields } from '@/features/tasks/schema/tasks';

interface TaskInputFieldsProps {
  register: UseFormRegister<TaskFormFields>;
  errors: FieldErrors<TaskFormFields>;
  variant?: TaskFieldsVariant;
  autoFocus?: boolean;
  hideLabels?: boolean;
}

export function TaskInputFields({
  register,
  errors,
  autoFocus = false,
  hideLabels = false,
}: TaskInputFieldsProps) {
  const rootErrorMessage = errors.root?.message;

  return (
    <div className="w-full min-w-0 space-y-4">
      {rootErrorMessage && <FormError message={rootErrorMessage} />}
      <div className="space-y-1.5">
        <TaskInputTitle
          hideLabel={hideLabels}
          autoFocus={autoFocus}
          inputProps={register('title')}
          error={errors.title}
          titleLabel="Task"
          titlePlaceholder="Task"
        />
      </div>
      <div className="space-y-1.5">
        <TaskInputDescription
          hideLabel={hideLabels}
          inputProps={register('description')}
          error={errors.description}
          descriptionLabel="Description (optional)"
          descriptionPlaceholder="Add detail for this task"
        />
      </div>
    </div>
  );
}
