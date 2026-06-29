import { Suspense } from 'react';

import Link from 'next/link';

import { DEFAULT_REDIRECTS } from '@/app/config/routes.config';
import { AuthButton } from '@/features/auth/components/auth-button';
import { AuthButtonSkeleton } from '@/features/auth/components/auth-button-skeleton';
import ContentSkeleton from '@/features/home/components/content-skeleton';
import UserContent from '@/features/home/components/user-content';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-4">
        <nav className="border-b-foreground/10 flex h-16 w-full justify-center border-b">
          <div className="flex w-full max-w-5xl items-center justify-between px-3 text-sm sm:px-5">
            <div className="flex items-center gap-5 truncate font-semibold">
              <Link href={DEFAULT_REDIRECTS.public} className="truncate">
                AI To-Do List
              </Link>
            </div>
            <Suspense fallback={<AuthButtonSkeleton />}>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <div className="flex w-full max-w-5xl flex-1 flex-col gap-20 p-5">
          <Suspense fallback={<ContentSkeleton />}>
            <UserContent />
          </Suspense>
        </div>

        <footer className="mx-auto flex w-full flex-wrap items-center justify-center gap-4 border-t py-8 text-center text-xs sm:gap-8 sm:py-16">
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
