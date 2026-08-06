import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

type AiGenerationErrorProps = {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
  retryable: boolean;
};

export function AiGenerationError({
  message,
  onRetry,
  onDismiss,
  retryable
}: AiGenerationErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />

      <AlertTitle>Couldn&apos;t generate subtasks</AlertTitle>

      <AlertDescription className="space-y-4">
        <p>{message}</p>

        <div className="flex gap-2">
          {retryable && <Button
            type="button"
            onClick={onRetry}
          >
            Retry
          </Button>
          }

          <Button
            type="button"
            variant="outline"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}