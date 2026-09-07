'use client';

import { useCallback } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { AiGenerationError } from '@/features/tasks/components/ai-generation-error';
import { DraftSubtaskRow } from '@/features/tasks/components/forms/draft-subtask-row';
import TasksSkeleton from '@/features/tasks/components/tasks-skeleton';
import { useAddSubtasks } from '@/features/tasks/hooks/use-add-subtasks';
import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import {
  DraftSubtasksForm,
  draftSubtasksSchema,
} from '@/features/tasks/schema/tasks';
import { AiGeneratedTask, Task } from '@/features/tasks/types/tasks.types';
import { normalizeAiTask } from '@/features/tasks/utils/normalize-ai-tasks';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { isRetryableError } from '@/shared/errors/utils/retryable-errors';

export function DraftSubtasks({ task }: { task: Task }) {
  const { saveSubtasks, isSaving } = useAddSubtasks(task.id);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DraftSubtasksForm>({
    resolver: zodResolver(draftSubtasksSchema),
    defaultValues: {
      drafts: [],
    },
  });

  const { fields, remove, append } = useFieldArray({
    control,
    name: 'drafts',
  });

  const handleSubtask = useCallback(
    (draftSubtask: AiGeneratedTask) => {
      append(normalizeAiTask(draftSubtask), {
        shouldFocus: false,
      });
    },
    [append]
  );

  const { error, isGenerating, generate, retry, discard } = useSubtaskDrafts(
    task.id,
    handleSubtask
  );

  const handleSubmitDrafts = async (values: DraftSubtasksForm) => {
    await saveSubtasks(values.drafts);
    handleDiscard();
  };

  const handleGenerate = useCallback(() => {
    reset();
    generate();
  }, [generate, reset]);

  const handleDiscard = useCallback(() => {
    reset();
    discard();
  }, [discard, reset]);

  return (
    <section
      aria-label={`AI-generated draft subtasks for ${task.title}`}
      className="space-y-2"
    >
      {!isGenerating && fields.length === 0 && !error && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isSaving}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Generate Subtask
          </Button>
        </div>
      )}

      {isGenerating && (
        <div className="space-y-2" role="status" aria-live="polite">
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
            Generating…
          </p>
          {fields.length === 0 && <TasksSkeleton />}
        </div>
      )}

      {error && (
        <AiGenerationError
          message={getFriendlyErrorMessage(error)}
          onRetry={retry}
          onDismiss={handleDiscard}
          retryable={isRetryableError(error)}
        />
      )}

      {fields.length > 0 && (
        <form
          onSubmit={handleSubmit(handleSubmitDrafts)}
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
              onClick={handleDiscard}
              disabled={isSaving || isGenerating}
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isGenerating}
              data-testid="accept-draft-subtasks"
            >
              {isSaving
                ? 'Adding…'
                : `Add ${fields.length} subtask${fields.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
