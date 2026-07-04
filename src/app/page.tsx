import { Suspense } from 'react';

import { AppFooter } from '@/components/layout/app-footer';
import { AppHeader } from '@/components/layout/app-header';
import { Container } from '@/components/layout/container';
import ContentSkeleton from '@/features/home/components/content-skeleton';
import UserContent from '@/features/home/components/user-content';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />

      <Container className="flex flex-1 py-6 sm:py-10">
        <Suspense fallback={<ContentSkeleton />}>
          <UserContent />
        </Suspense>
      </Container>

      <AppFooter />
    </main>
  );
}
