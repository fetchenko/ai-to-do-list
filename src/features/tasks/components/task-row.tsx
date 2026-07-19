import { ReactNode } from 'react';

type TaskRowProps = {
  leading?: ReactNode;
  content: ReactNode;
  trailing?: ReactNode;
};

export function TaskRow({
  leading,
  content,
  trailing,
}: TaskRowProps) {
  return (
    <div className="flex flex-1 items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {leading}
        <div className="min-w-0 flex-1">
          {content}
        </div>
      </div>
      {trailing && (
        <div className="shrink-0">
          {trailing}
        </div>
      )}
    </div>
  );
} 
