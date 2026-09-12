import { Suspense } from 'react';

import { AppFooter } from '@/components/layout/app-footer';
import { AppHeader } from '@/components/layout/app-header';
import ContentSkeleton from '@/features/home/components/content-skeleton';
import HomeContent from '@/features/home/components/home-content';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1 justify-center">
        <Suspense fallback={<ContentSkeleton />}>
          <HomeContent />
        </Suspense>
      </div>

      <AppFooter />
    </main>
  );
}
