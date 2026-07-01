import type { GlobalError } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/shared/utils/classnames";
import { FieldError } from "@/components/primitives/field-error";
import { InputHTMLAttributes, useId } from "react";

interface TaskInputFieldsProps {
  inputProps: InputHTMLAttributes<HTMLTextAreaElement>;
  error?: GlobalError;
  hideLabel?: boolean;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionRows?: number;
}

export function TaskInputDescription({
  inputProps,
  error,
  hideLabel = false,
  descriptionLabel,
  descriptionPlaceholder,
  descriptionRows = 3
}: TaskInputFieldsProps) {
  const idPrefix = useId();

  return (
    <>
      <Label
        htmlFor={`${idPrefix}-description`}
        className={cn(hideLabel && "sr-only")}
      >
        {descriptionLabel}
      </Label>
      <Textarea
        id={`${idPrefix}-description`}
        rows={descriptionRows}
        placeholder={descriptionPlaceholder}
        className="resize-y"
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${idPrefix}-description-error`
            : undefined
        }
        {...inputProps}
      />
      <FieldError
        id={`${idPrefix}-description-error`}
        message={error?.message}
      />
    </>
  );
}