'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/cn';

interface TaskCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function TaskCheckbox({
  checked,
  disabled,
  label,
  onCheckedChange,
  className,
}: TaskCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      disabled={disabled}
      onCheckedChange={(value) => onCheckedChange(Boolean(value))}
      aria-label={
        checked
          ? `Mark "${label}" as not done`
          : `Mark "${label}" as done`
      }
      className={cn('mt-1', className)}
    />
  );
}