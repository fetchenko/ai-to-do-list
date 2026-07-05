'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { FormError } from '@/components/blocks/form-error';
import { FormField } from '@/components/primitives/form-field';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TaskForm, taskSchema } from '@/features/tasks/schema/tasks';
import { cn } from '@/lib/utils/cn';

interface AddTaskFormProps {
  onAddTask: (values: TaskForm) => Promise<null>;
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
  } = useForm<TaskForm>({
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
      aria-label="Add a new task"
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
          <FormField
            idPrefix="add-title"
            label="Task"
            error={errors.title?.message}
            hideLabel
          >
            <Input
              id="add-title"
              placeholder="Add a task"
              aria-invalid={!!errors?.title}
              aria-describedby={!!errors?.title ? `add-title-error` : undefined}
              {...register('title')}
            />
          </FormField>
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
              <FormField
                idPrefix="add-description"
                label="Description (optional)"
                error={errors.description?.message}
                hideLabel
              >
                <Textarea
                  id="add-description"
                  rows={3}
                  placeholder="Add detail for this task"
                  className="resize-y"
                  aria-invalid={!!errors.description}
                  aria-describedby={
                    !!errors.description ? `add-description-error` : undefined
                  }
                  {...register('description')}
                />
              </FormField>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <Button type="submit" className="w-full shrink-0 sm:w-auto">
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
      </fieldset>
    </form>
  );
}
