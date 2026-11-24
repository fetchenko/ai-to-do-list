'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route segment error:', error);
  }, [error]);

  return (
    <main>
      <h1>Something went wrong</h1>
      <Button onClick={reset} type="button">
        Try again
      </Button>
    </main>
  );
}
