'use client';

import { X } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { testIds } from '@/shared/testing/test-ids';

type DraftSubtaskRowProps = {
  titleRegister: UseFormRegisterReturn;
  descriptionRegister: UseFormRegisterReturn;
  titleError?: string;
  onRemove: () => void;
};

const textLikeFieldClass =
  'cursor-text border-0 border-b border-dashed border-muted-foreground/40 ' +
  'bg-transparent px-2 py-1 shadow-none rounded-none ' +
  'hover:border-muted-foreground/70 hover:bg-muted/40 ' +
  'focus-visible:rounded-md focus-visible:border-solid focus-visible:border-input ' +
  'focus-visible:bg-background focus-visible:shadow-sm focus-visible:ring-1 focus-visible:ring-ring';

export function DraftSubtaskRow({
  titleRegister,
  descriptionRegister,
  titleError,
  onRemove,
}: DraftSubtaskRowProps) {
  return (
    <li
      data-testid={testIds.draftSubtask.row}
      className="flex flex-col gap-1 rounded-md p-1 sm:flex-row sm:items-start"
    >
      <div className="min-w-0 flex-1">
        <Input
          data-testid="draft-subtask"
          aria-label="Subtask title"
          aria-invalid={!!titleError}
          className={cn('font-medium', textLikeFieldClass)}
          {...titleRegister}
        />
        {titleError && (
          <p role="alert" className="text-destructive px-2 text-xs">
            {titleError}
          </p>
        )}
        <Textarea
          aria-label="Subtask description"
          placeholder="Add a description (optional)"
          rows={1}
          className={cn(
            'text-muted-foreground resize-none text-sm',
            textLikeFieldClass
          )}
          {...descriptionRegister}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label="Remove draft subtask"
        className="text-muted-foreground self-end sm:self-start"
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </li>
  );
}
