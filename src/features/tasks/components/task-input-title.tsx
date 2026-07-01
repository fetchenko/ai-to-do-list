import type { GlobalError } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { cn } from "@/shared/utils/classnames";
import { FieldError } from "@/components/primitives/field-error";
import { InputHTMLAttributes, useId } from "react";

interface TaskInputTitleProps {
  inputProps: InputHTMLAttributes<HTMLInputElement>;
  error?: GlobalError;
  autoFocus?: boolean;
  hideLabel?: boolean;
  titleLabel: string;
  titlePlaceholder: string;
}

export function TaskInputTitle({
  inputProps,
  error,
  autoFocus = false,
  hideLabel = false,
  titleLabel,
  titlePlaceholder,
}: TaskInputTitleProps) {
  const idPrefix = useId();

  return (
    <>
      <Label
        htmlFor={`${idPrefix}-title`}
        className={cn(hideLabel && "sr-only")}
      >
        {titleLabel}
      </Label>
      <Input
        id={`${idPrefix}-title`}
        autoFocus={autoFocus}
        placeholder={titlePlaceholder}
        aria-invalid={!!error?.message}
        aria-describedby={
          error?.message
            ? `${idPrefix}-title-error`
            : undefined
        }
        {...inputProps}
      />
      <FieldError
        id={`${idPrefix}-title-error`}
        message={error?.message}
      />
    </>
  );
}