import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

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
  retryable,
}: AiGenerationErrorProps) {
  return (
    <Alert
      variant="destructive"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-4 w-4" />

      <AlertTitle>
        Couldn&apos;t generate subtasks
      </AlertTitle>

      <AlertDescription className="space-y-4">
        <p>{message}</p>

        <div className="flex gap-2">
          {retryable && (
            <Button
              type="button"
              variant="secondary"
              onClick={onRetry}
            >
              Retry
            </Button>
          )}

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