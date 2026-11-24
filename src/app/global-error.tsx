'use client';

import { useEffect } from 'react';

import { FallbackPage } from '@/components/blocks/fallback-page';
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
      <body className="min-h-screen bg-background text-foreground">
        <FallbackPage
          title="Something went wrong"
          description="The application encountered an unexpected error. Please try again."
          action={
            <Button onClick={reset} type="button">
              Try again
            </Button>
          }
        />
      </body>
    </html>
  );
}
