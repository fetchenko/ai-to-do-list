import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";
import { DEFAULT_REDIRECTS, ROUTES } from "@/lib/routes.config";
import { AuthButtonSkeleton } from "@/components/auth/auth-button-skeleton";

function AuthenticatedContent({ user }: { user: any }) {
  return (
    <div className="flex-1 flex flex-col gap-6 px-4 w-full">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.email}! 👋</h1>
          <p className="text-muted-foreground mt-2">Here's your to-do list</p>
        </div>

        <div className="grid gap-4">
          <div className="border rounded-lg p-4 bg-accent/50">
            <h2 className="font-semibold mb-4">Your Tasks</h2>
            {/* TODO: Add TodoList component */}
            <p className="text-sm text-muted-foreground">
              No tasks yet. Create your first task!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicContent() {
  return (
    <div className="flex-1 flex flex-col gap-20 items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">AI To-Do List</h1>
        <p className="text-xl text-muted-foreground">
          Your intelligent task manager powered by AI
        </p>
        <p className="text-muted-foreground max-w-md mx-auto">
          Organize your tasks, get AI-powered subtask suggestions, and boost your productivity
        </p>
      </div>

      <div className="flex gap-4">
        <Link href={ROUTES.authLogin} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Sign In
        </Link>
        <Link href={ROUTES.authSignup} className="px-6 py-2 border rounded-lg hover:bg-accent">
          Sign Up
        </Link>
      </div>
    </div>
  );
}

// Separate async component for user data
async function UserContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user ? (
    <AuthenticatedContent user={user} />
  ) : (
    <PublicContent />
  );
}

// Skeleton/Loading component
function ContentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-muted rounded-lg w-1/3"></div>
      <div className="h-20 bg-muted rounded-lg"></div>
    </div>
  );
}

export default async function Home() {

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={DEFAULT_REDIRECTS.public}>AI To-Do List</Link>
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

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}