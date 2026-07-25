import { TaskCheckbox } from "@/features/tasks/components/task-checkbox/task-checkbox";
import { useToggleTask } from "@/features/tasks/hooks/use-toggle-task";
import { Task } from "@/features/tasks/types/tasks.types";

export function TaskCheckboxContainer({
  task,
}: {
  task: Task;
}) {
  const { checked, isPending, toggle } = useToggleTask(task);

  return (
    <TaskCheckbox
      checked={checked}
      disabled={isPending}
      label={task.title}
      onCheckedChange={toggle}
    />
  );
}