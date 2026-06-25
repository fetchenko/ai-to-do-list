import { AuthButton } from "@/features/auth/components/auth-button";
import { ThemeSwitcher } from "@/features/theme/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";
import { DEFAULT_REDIRECTS } from "@/app/config/routes.config";
import { AuthButtonSkeleton } from "@/features/auth/components/auth-button-skeleton";
import ContentSkeleton from "@/features/home/components/content-skeleton";
import UserContent from "@/features/home/components/user-content";

export default async function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-4 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center px-3 sm:px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold truncate">
              <Link href={DEFAULT_REDIRECTS.public} className="truncate">
                AI To-Do List
              </Link>
            </div>
            <Suspense fallback={<AuthButtonSkeleton />}>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5 w-full">
          <Suspense fallback={<ContentSkeleton />}>
            <UserContent />
          </Suspense>
        </div>

        <footer className="w-full flex flex-wrap items-center justify-center border-t mx-auto text-center text-xs gap-4 sm:gap-8 py-8 sm:py-16">
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}