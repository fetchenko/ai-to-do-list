import { Button } from "@/components/ui/button";

type AiGenerationErrorProps = {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
  retrying?: boolean;
};

export function AiGenerationError({
  message,
  onRetry,
  onDismiss,
  retrying = false,
}: AiGenerationErrorProps) {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-md border border-destructive/50 p-4"
    >
      <div>
        <p className="font-medium">
          Couldn&apos;t generate subtasks
        </p>

        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? 'Retrying…' : 'Retry'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onDismiss}
          disabled={retrying}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}