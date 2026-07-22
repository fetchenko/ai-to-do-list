'use client';

import { useEffect, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DraftSubtaskRow } from '@/features/tasks/components/draft-subtask-row';
import { useSaveSubtasks } from '@/features/tasks/hooks/use-save-subtasks';
import { DraftForm, draftSchema } from '@/features/tasks/schema/tasks';
import { AiTask, Task } from '@/features/tasks/types/tasks.types';
import { normalizeAiTasks } from '@/features/tasks/utils/tasks.utils';

type DraftSubtasksProps = {
  task: Task;
  drafts: AiTask[];
  onDiscard: () => void;
};

export function DraftSubtasks({ task, drafts, onDiscard }: DraftSubtasksProps) {
  const formDefaults = useMemo<DraftForm>(
    () => ({
      drafts: normalizeAiTasks(drafts),
    }),
    [drafts]
  );

  const { saveSubtasks, isSaving } = useSaveSubtasks(task.id);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DraftForm>({
    resolver: zodResolver(draftSchema),
    defaultValues: formDefaults,
  });

  const { fields, remove } = useFieldArray({ control, name: 'drafts' });

  useEffect(() => {
    reset(formDefaults);
  }, [formDefaults, reset]);

  if (fields.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
        No drafts left to review.
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 pl-1"
          onClick={onDiscard}
        >
          Close
        </Button>
      </div>
    );
  }

  const onSubmit = async (values: DraftForm) => {
    await saveSubtasks(values.drafts);
    onDiscard();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3"
      aria-label={`AI-generated draft subtasks for ${task.title}`}
      data-testid="draft-subtasks-form"
    >
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
        <span>AI-generated — tap any field to edit before adding</span>
      </div>
      <ul className="space-y-2">
        {fields.map((field, index) => (
          <DraftSubtaskRow
            key={field.id}
            titleRegister={register(`drafts.${index}.title`)}
            descriptionRegister={register(`drafts.${index}.description`)}
            titleError={errors.drafts?.[index]?.title?.message}
            onRemove={() => remove(index)}
          />
        ))}
      </ul>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onDiscard}
          disabled={isSaving}
        >
          Discard
        </Button>
        <Button type="submit" disabled={isSaving} data-testid="accept-draft-subtasks">
          {isSaving
            ? 'Adding…'
            : `Add ${fields.length} subtask${fields.length > 1 ? 's' : ''}`}
        </Button>
      </div>
    </form>
  );
}
