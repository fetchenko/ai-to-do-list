import { AiGeneration } from "@/shared/types/database.types";
import { supabaseAdmin } from "@/infrastructure/supabase/admin";

export async function updateAiLog(
  logId: string,
  updates: AiGeneration["Update"],
) {
  if (!logId) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from("ai_generations")
      .update(updates)
      .eq("id", logId)
      .select("id")
      .single();
    if (error) {
      console.error("Failed to update ai_generations log:", error);
    }

    return data?.id ?? null;
  } catch (err) {
    console.error("Unexpected logging failure:", err);
    return null;
  }
}
