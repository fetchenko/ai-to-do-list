import "server-only";

import { DatabaseError } from "@/shared/errors/app-error";
import { supabaseAdmin } from "@/infrastructure/supabase/admin";

export async function getTaskForUser(taskId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("id, user_id, title")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new DatabaseError({ error });
  }
  return data;
}
