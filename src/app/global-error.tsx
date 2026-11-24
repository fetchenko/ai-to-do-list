'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main>
          <h1>Something went wrong</h1>
          <Button onClick={reset} type="button">
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
}
