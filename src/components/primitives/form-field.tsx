import { FieldError } from '@/components/primitives/field-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

interface FormFieldProps {
  error?: string;
  hideLabel?: boolean;
  label: string;
  idPrefix: string;
  children: React.ReactNode;
}

export function FormField({
  error,
  hideLabel = false,
  label,
  idPrefix,
  children,
}: FormFieldProps) {
  return (
    <div className="w-full min-w-0 space-y-2">
      <Label
        htmlFor={idPrefix}
        className={cn(hideLabel && 'sr-only')}
      >
        {label}
      </Label>

      <div className="w-full min-w-0">
        {children}
      </div>

      <FieldError
        id={`${idPrefix}-error`}
        message={error}
      />
    </div>
  );
}