import Link from 'next/link';

import { ROUTES } from '@/app/config/routes.config';

export default function Hero() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-20 px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">AI To-Do List</h1>
        <p className="text-muted-foreground text-xl">Your intelligent task manager powered by AI</p>
        <p className="text-muted-foreground mx-auto max-w-md">
          Organize your tasks, get AI-powered subtask suggestions, and boost your productivity
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href={ROUTES.authLogin}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2"
        >
          Sign In
        </Link>
        <Link href={ROUTES.authSignup} className="hover:bg-accent rounded-lg border px-6 py-2">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
