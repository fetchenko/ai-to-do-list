import { Suspense } from 'react';

import Link from 'next/link';

import { DEFAULT_REDIRECTS } from '@/app/config/routes.config';
import { AuthButton } from '@/features/auth/components/auth-button';
import { AuthButtonSkeleton } from '@/features/auth/components/auth-button-skeleton';

export function AppHeader() {
  return (
    <header className="border-b">
      <div className='mx-auto w-full px-4 sm:px-6 lg:px-8'>
        <nav
          aria-label="Primary navigation"
          className="flex h-16 items-center justify-between"
        >
          <Link
            href={DEFAULT_REDIRECTS.public}
            className="truncate text-base font-semibold sm:text-lg"
          >
            AI To-Do
          </Link>

          <Suspense fallback={<AuthButtonSkeleton />}>
            <AuthButton />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
