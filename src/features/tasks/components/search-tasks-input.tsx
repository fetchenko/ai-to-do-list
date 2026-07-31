'use client';

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { testIds } from '@/shared/testing/test-ids';

interface SearchTasksInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchTasksInput({ value, onChange, className }: SearchTasksInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tasks"
        aria-label="Search tasks"
        data-testid={testIds.taskSection.search}
        className="pl-9 pr-9 appearance-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
