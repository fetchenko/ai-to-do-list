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
      aria-live="assertive"
      className="rounded-md border border-destructive/50 p-4 space-y-3"
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
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? 'Retrying...' : 'Retry'}
        </Button>

        <Button
          variant="outline"
          onClick={onDismiss}
          disabled={retrying}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}