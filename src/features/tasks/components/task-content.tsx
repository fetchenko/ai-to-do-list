import { Task } from "@/features/tasks/types/tasks.types";

type TaskContentProps = {
  task: Task;
};

export function TaskContent({
  task,
}: TaskContentProps) {
  return (
    <>
      <p className="font-medium break-words">
        {task.title}
      </p>

      {task.description && (
        <p className="text-muted-foreground text-sm break-words">
          {task.description}
        </p>
      )}
    </>
  );
}