'use client';

import { ChevronDown, Loader2, Plus } from 'lucide-react';

import { FormError } from '@/components/blocks/form-error';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DescriptionField,
  TitleField,
} from '@/features/tasks/components/task-form-fields';
import {
  TASK_FORM_COPY,
  TaskFormVariant,
} from '@/features/tasks/constants/task-form-copy.constants';
import { useAddTaskForm } from '@/features/tasks/hooks/use-add-task-form';
import { TaskForm } from '@/features/tasks/schema/tasks';
import { cn } from '@/lib/utils/cn';

interface AddTaskFormProps {
  onAddTask: (values: TaskForm) => Promise<unknown>;
  className?: string;
  error?: Error | null;
  /** Unique id namespace for this form instance. Required because AddTaskForm
   *  can render more than once at a time (top-level + per-subtask), and ids
   *  must stay unique across the whole page. Defaults to "add" for the
   *  common single-instance case. */
  idPrefix?: string;
  /** There's no Task object yet to infer this from (we're creating one),
   *  so the caller states it explicitly. Drives labels/placeholders/aria-label. */
  variant?: TaskFormVariant;
}

export function AddTaskForm({
  onAddTask,
  error,
  className,
  idPrefix = 'add',
  variant = 'task',
}: AddTaskFormProps) {
  const copy = TASK_FORM_COPY[variant];

  const {
    register,
    onSubmit,
    formState: { errors, isSubmitting },
    isDescriptionOpen,
    setIsDescriptionOpen,
  } = useAddTaskForm(onAddTask);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label={copy.formLabel}
      className={cn(
        'bg-card mx-auto w-full max-w-2xl space-y-3 rounded-xl border p-3 sm:p-4',
        className
      )}
    >
      <fieldset
        disabled={isSubmitting}
        className="flex flex-col gap-2 sm:flex-row sm:items-start"
      >
        <FormError message={error?.message} />
        <div className="flex-1 space-y-1">
          <TitleField
            idPrefix={idPrefix}
            register={register}
            errors={errors}
            hideLabel
            label={copy.title.label}
            placeholder={copy.title.placeholder}
          />
          <Collapsible
            open={isDescriptionOpen}
            onOpenChange={setIsDescriptionOpen}
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-8 px-2"
              >
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform',
                    isDescriptionOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
                <span>
                  {isDescriptionOpen ? 'Hide description' : 'Add description'}
                </span>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-2">
              <DescriptionField
                idPrefix={idPrefix}
                register={register}
                errors={errors}
                hideLabel
                label={copy.description.label}
                placeholder={copy.description.placeholder}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
        <Button type="submit" className="w-full shrink-0 sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>{copy.submittingLabel}</span>
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden="true" />
              <span>{copy.submitLabel}</span>
            </>
          )}
        </Button>
      </fieldset>
    </form>
  );
}
