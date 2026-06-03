export default function UserTasks({ user }: { user: any }) {
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