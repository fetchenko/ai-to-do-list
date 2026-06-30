'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TaskFormFields, taskSchema } from '@/features/tasks/schema/tasks';
import { cn } from '@/shared/utils/classnames';

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
        <div className="flex-1 space-y-1">
          <Label htmlFor="task-title" className="sr-only">
            Task name
          </Label>
          <Input
            id="task-title"
            placeholder="Add a task…"
            autoComplete="off"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'task-title-error' : undefined}
            disabled={isSubmitting}
            {...register('title')}
          />
          {errors.title && (
            <p id="task-title-error" role="alert" className="text-destructive text-sm font-medium">
              {errors.title.message}
            </p>
          )}

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
              <Label htmlFor="task-description" className="sr-only">
                Description (optional)
              </Label>
              <Textarea
                id="task-description"
                placeholder="Add detail for this task"
                rows={3}
                disabled={isSubmitting}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'task-description-error' : undefined}
                {...register('description')}
              />
              {errors.description && (
                <p
                  id="task-description-error"
                  role="alert"
                  className="text-destructive mt-1 text-sm font-medium"
                >
                  {errors.description.message}
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>

          {error?.message && (
            <p role="alert" className="text-destructive text-sm font-medium">
              {error?.message}
            </p>
          )}
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
