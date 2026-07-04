import Link from 'next/link';

import { ROUTES } from '@/app/config/routes.config';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center">
      <section
        aria-labelledby="hero-title"
        className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <header className="space-y-6">
            <h1
              id="hero-title"
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              AI To-Do List
            </h1>

            <p className="text-muted-foreground text-lg sm:text-xl">
              Your intelligent task manager powered by AI
            </p>

            <p className="text-muted-foreground mx-auto max-w-xl text-base leading-7 sm:text-lg">
              Organize your tasks, generate AI-powered subtasks instantly, and
              stay focused on what matters most.
            </p>
          </header>

          <nav
            aria-label="Authentication actions"
            className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={ROUTES.authLogin}>Sign In</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href={ROUTES.authSignup}>Create Account</Link>
            </Button>
          </nav>
        </div>
      </section>
    </main>
  );
}
