'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TaskFormFields, taskSchema } from '@/features/tasks/schema/tasks';
import { cn } from '@/shared/utils/classnames';
import { FormAsyncError } from '@/components/primitives/form-async-error';
import { TaskInputTitle } from '@/features/tasks/components/task-input-title';
import { TaskInputDescription } from '@/features/tasks/components/task-input-description';

interface AddTaskFormProps {
  onAddTask: (values: TaskFormFields) => Promise<null>;
  className?: string;
  error?: Error | null;
}

export function AddTaskForm({ onAddTask, error, className }: AddTaskFormProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormFields>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await onAddTask(values);
    reset();
    setIsDescriptionOpen(false);
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-title="Add a new task"
      className={cn(
        'bg-card mx-auto w-full max-w-2xl space-y-3 rounded-xl border p-3 sm:p-4',
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <FormAsyncError
          message={error?.message}
        />
        <div className="flex-1 space-y-1">
          <TaskInputTitle
            hideLabel
            inputProps={{ ...register('title'), disabled: isSubmitting }}
            error={errors.title}
            titleLabel='Task'
            titlePlaceholder='Add a task…'
          />

          <Collapsible open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-foreground h-8 px-2"
              >
                <ChevronDown
                  className={cn('size-4 transition-transform', isDescriptionOpen && 'rotate-180')}
                  aria-hidden="true"
                />
                <span>{isDescriptionOpen ? 'Hide description' : 'Add description'}</span>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-2">
              <TaskInputDescription
                hideLabel
                inputProps={{ ...register('description'), disabled: isSubmitting }}
                error={errors.description}
                descriptionLabel='Description (optional)'
                descriptionPlaceholder='Add detail for this task'
                descriptionRows={3}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full shrink-0 sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Adding…</span>
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden="true" />
              <span>Add task</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
