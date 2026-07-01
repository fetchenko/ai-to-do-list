import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { TaskFormFields } from "@/features/tasks/schema/tasks";
import { FormAsyncError } from "@/components/primitives/form-async-error";
import { TaskFieldsVariant } from "@/features/tasks/constants/input-fields-variants";
import { TaskInputTitle } from "@/features/tasks/components/task-input-title";
import { TaskInputDescription } from "@/features/tasks/components/task-input-description";

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
  hideLabels = false
}: TaskInputFieldsProps) {

  const rootErrorMessage = errors.root?.message;

  return (
    <div className="min-w-0 w-full space-y-4">
      {rootErrorMessage && <FormAsyncError message={rootErrorMessage} />}

      <div className="space-y-1.5">
        <TaskInputTitle
          hideLabel={hideLabels}
          autoFocus={autoFocus}
          inputProps={register('title')}
          error={errors.title}
          titleLabel="Task"
          titlePlaceholder="Task" />
      </div>
      <div className="space-y-1.5">
        <TaskInputDescription
          hideLabel={hideLabels}
          inputProps={register('description')}
          error={errors.description}
          descriptionLabel='Description (optional)'
          descriptionPlaceholder='Add detail for this task'
        />
      </div>
    </div>
  );
}