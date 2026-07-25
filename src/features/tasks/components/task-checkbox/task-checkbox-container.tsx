import { TaskCheckbox } from "@/features/tasks/components/task-checkbox/task-checkbox";
import { useTaskActions } from "@/features/tasks/hooks/use-task-actions";
import { Task } from "@/features/tasks/types/tasks.types";

export function TaskCheckboxContainer({
  task,
}: {
  task: Task;
}) {
  const actions = useTaskActions(task);

  return (
    <TaskCheckbox
      checked={actions.toggle.checked}
      disabled={actions.toggle.isPending}
      label={task.title}
      onCheckedChange={
        actions.toggle.execute
      }
    />
  );
}