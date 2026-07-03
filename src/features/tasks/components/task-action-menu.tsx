'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  onGenerateSubtasks?: () => void;
  showGenerate?: boolean;
};

type Action = {
  key: string;
  label: string;
  onClick: () => void;
  destructive?: boolean;
};

export function TaskActionsMenu({
  onEdit,
  onDelete,
  onGenerateSubtasks,
  showGenerate = false,
}: TaskActionsMenuProps) {
  const [open, setOpen] = useState(false);

  const actions: Action[] = [
    ...(showGenerate && onGenerateSubtasks
      ? [{ key: 'generate', label: 'Generate subtasks', onClick: onGenerateSubtasks }]
      : []),
    { key: 'edit', label: 'Edit', onClick: onEdit },
    { key: 'delete', label: 'Delete', onClick: onDelete, destructive: true },
  ];

  const runAndClose = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <>
      <div className="sm:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="open task actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DialogTrigger>

          <DialogContent
            className={cn(
              'fixed inset-x-0 bottom-0 top-auto max-w-none',
              'translate-x-0 translate-y-0 rounded-t-2xl p-2',
            )}
          >
            <div className="flex flex-col gap-1 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              {actions.map((action) => (
                <Button
                  key={action.key}
                  variant="ghost"
                  className={cn(
                    'h-11 justify-start text-base',
                    action.destructive && 'text-destructive',
                  )}
                  onClick={() => runAndClose(action.onClick)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="task actions">
              Actions
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44">
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.key}
                onClick={action.onClick}
                className={cn(action.destructive && 'text-destructive')}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}