import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorAlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" role="alert" className={cn(className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}