'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MoreHorizontal } from 'lucide-react';

type TaskActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  onGenerateSubtasks?: () => void;
  showGenerate?: boolean;
};

export function TaskActionsMenu({
  onEdit,
  onDelete,
  onGenerateSubtasks,
  showGenerate = false,
}: TaskActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="task actions">
              Actions
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44">
            {showGenerate && onGenerateSubtasks && (
              <DropdownMenuItem
                onClick={onGenerateSubtasks}
              >
                Generate subtasks
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={onEdit}>
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-500"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="sm:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="open task actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DialogTrigger>

          <DialogContent
            className="fixed bottom-0 left-0 right-0 top-auto rounded-t-2xl p-2"
          >
            <div className="flex flex-col gap-2 p-2">
              {showGenerate && onGenerateSubtasks && (
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    onGenerateSubtasks();
                    setOpen(false);
                  }}
                >
                  Generate subtasks
                </Button>
              )}

              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  onEdit();
                  setOpen(false);
                }}
              >
                Edit
              </Button>

              <Button
                variant="ghost"
                className="justify-start text-red-500"
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}