import { getTaskForUser } from "../tasks/get-task";
// import { lockTask, unlockTask } from "../tasks/task-lock";
import { createAiLog } from "./logs/create-log";
import { generateSubtasks } from "./generate-subtasks";
import { updateAiLog } from "./logs/update-log";

export async function generateSubtasksForTask({
  taskId,
  userId,
  signal,
}: {
  taskId: string;
  userId: string;
  signal: AbortSignal;
}) {
  const task = await getTaskForUser(taskId, userId);
  let result;
  let startedAt = Date.now();

  // todo: implement lock generating subtasks request
  // await lockTask(taskId);

  const aiLogId = await createAiLog({
    task_id: task.id,
    user_id: userId,
    feature: "generate-subtasks",
    status: "pending",
    model: "",
    started_at: new Date().toISOString(),
  });

  try {
    result = await generateSubtasks(task.title, signal);

    if (aiLogId) {
      await updateAiLog(aiLogId, {
        status: "success",
        prompt: result.prompt,
        response: result.raw,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
        input_tokens: result.parsedData.usage?.input_tokens,
        output_tokens: result.parsedData.usage?.output_tokens,
        total_tokens: result.parsedData.usage?.total_tokens,
      });
    }
  } finally {
    // await unlockTask(task.id);
  }

  return { ...result, aiLogId };
}
