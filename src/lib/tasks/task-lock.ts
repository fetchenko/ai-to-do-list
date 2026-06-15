import { AiLockRequestError } from "@/shared/errors/app-error";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function lockTask(taskId: string) {
  const { data: taskData } = await supabaseAdmin
    .from("tasks")
    .select("ai_locked")
    .eq("id", taskId)
    .single();

  if (taskData?.ai_locked) {
    throw new AiLockRequestError("AI already running");
  }

  const { data: updatedTaskData } = await supabaseAdmin
    .from("tasks")
    .update({ ai_locked: true })
    .eq("id", taskId)
    .eq("ai_locked", false)
    .select("ai_locked")
    .single();

  return updatedTaskData?.ai_locked;
}

export async function unlockTask(taskId: string) {
  await supabaseAdmin
    .from("tasks")
    .update({ ai_locked: false })
    .eq("id", taskId);
}
