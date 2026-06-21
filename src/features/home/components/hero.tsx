import Link from "next/link";
import { ROUTES } from "@/app/config/routes.config";

export default function Hero() {
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