import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <Button asChild>
        <Link href="/">Go to home</Link>
      </Button>
    </main>
  );
}
