'use client';

import { useEffect } from 'react';

import { FallbackPage } from '@/components/blocks/fallback-page';
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
    <FallbackPage
      title="Something went wrong"
      description="An unexpected error occurred while loading this page. Please try again."
      action={
        <Button onClick={reset} type="button">
          Try again
        </Button>
      }
    />
  );
}
