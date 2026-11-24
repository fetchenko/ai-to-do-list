import Link from 'next/link';

import { FallbackPage } from '@/components/blocks/fallback-page';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <FallbackPage
      status="404"
      title="Page not found"
      description="The page you are looking for does not exist or may have been moved."
      action={
        <Button asChild>
          <Link href="/">Go to home</Link>
        </Button>
      }
    />
  );
}
