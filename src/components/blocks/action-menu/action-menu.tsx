'use client';

import { useState } from 'react';

import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';
import { MenuAction } from '@/components/blocks/action-menu/types';

interface ActionMenuProps {
  actions: MenuAction[];

  label?: string;
}


export function ActionMenu({
  actions,
  label = 'Open actions',
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);


  const execute = (action: MenuAction) => {
    action.onSelect();
    setOpen(false);
  };

  return (
    <>
      {/* Mobile */}
      <div className="sm:hidden">
        <Dialog
          open={open}
          onOpenChange={setOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={label}
            >
              <MoreHorizontal
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          </DialogTrigger>


          <DialogContent
            className={cn(
              'fixed inset-x-0 bottom-0 top-auto',
              'max-w-none translate-x-0 translate-y-0',
              'rounded-t-2xl p-2'
            )}
          >
            <div
              className="
                flex flex-col gap-1
                p-2
                pb-[max(0.5rem,env(safe-area-inset-bottom))]
              "
            >
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant="ghost"
                  disabled={action.disabled}
                  className={cn(
                    'h-11 justify-start text-base',
                    action.variant === 'destructive' &&
                    'text-destructive'
                  )}
                  onClick={() => execute(action)}
                >
                  {action.icon && (
                    <action.icon
                      className="mr-2 size-4"
                      aria-hidden="true"
                    />
                  )}

                  {action.label}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>


      {/* Desktop */}
      <div className="hidden sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              aria-label={label}
            >
              Actions
            </Button>
          </DropdownMenuTrigger>


          <DropdownMenuContent
            align="end"
            className="w-44"
          >
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                disabled={action.disabled}
                onSelect={() => execute(action)}
                className={cn(
                  action.variant === 'destructive' &&
                  'text-destructive'
                )}
              >
                {action.icon && (
                  <action.icon
                    className="mr-2 size-4"
                    aria-hidden="true"
                  />
                )}

                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}