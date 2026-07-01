import { cn } from "@/shared/utils/classnames"

interface FieldErrorProps {
  id?: string
  message?: string
  className?: string
}

export function FieldError({ id, message, className }: FieldErrorProps) {
  if (!message) return null

  return (
    <p id={id} role="alert" className={cn("text-destructive text-sm", className)}>
      {message}
    </p>
  )
}