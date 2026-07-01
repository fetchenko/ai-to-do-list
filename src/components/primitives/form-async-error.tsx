// components/ui/form-async-error.tsx
import { cn } from "@/shared/utils/classnames"
import { AlertCircle } from "lucide-react"

interface FormAsyncErrorProps {
  message?: string | null
  className?: string
  onRetry?: () => void
}

export function FormAsyncError({ message, className, onRetry }: FormAsyncErrorProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-start gap-2 rounded-md border border-destructive/30",
        "bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{message}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 underline underline-offset-2 hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}