import type { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { TaskFormFields } from "@/features/tasks/schema/tasks";
import { cn } from "@/shared/utils/classnames";

interface TaskInputFieldsProps {
  idPrefix: string;
  form: UseFormReturn<TaskFormFields>;

  autoFocus?: boolean;
  hideLabels?: boolean;

  titlePlaceholder?: string;
  descriptionPlaceholder?: string;

  descriptionRows?: number;
}

export function TaskInputFields({
  idPrefix,
  form,
  autoFocus = false,
  hideLabels = false,
  descriptionRows = 3,
  titlePlaceholder = "Task title",
  descriptionPlaceholder = "Description (optional)",
}: TaskInputFieldsProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="min-w-0 w-full space-y-4">
      <div className="space-y-1.5">
        <Label
          htmlFor={`${idPrefix}-title`}
          className={cn(hideLabels && "sr-only")}
        >
          Title
        </Label>

        <Input
          id={`${idPrefix}-title`}
          autoFocus={autoFocus}
          placeholder={titlePlaceholder}
          aria-invalid={!!errors.title}
          aria-describedby={
            errors.title
              ? `${idPrefix}-title-error`
              : undefined
          }
          {...register("title")}
        />

        {errors.title && (
          <p
            id={`${idPrefix}-title-error`}
            role="alert"
            className="text-destructive text-sm"
          >
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`${idPrefix}-description`}
          className={cn(hideLabels && "sr-only")}
        >
          Description (optional)
        </Label>

        <Textarea
          id={`${idPrefix}-description`}
          rows={descriptionRows}
          placeholder={descriptionPlaceholder}
          className="resize-y"
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description
              ? `${idPrefix}-description-error`
              : undefined
          }
          {...register("description")}
        />

        {errors.description && (
          <p
            id={`${idPrefix}-description-error`}
            role="alert"
            className="text-destructive text-sm"
          >
            {errors.description.message}
          </p>
        )}
      </div>
    </div>
  );
}