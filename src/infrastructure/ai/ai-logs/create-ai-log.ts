import { supabaseAdmin } from "@/infrastructure/supabase/admin";
import { AiGeneration } from "@/shared/types/database.types";

export async function createAiLog(
  input: AiGeneration["Insert"],
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("ai_generations")
      .insert(input)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create ai_generations log:", error);
      return null;
    }

    return data?.id ?? null;
  } catch (err) {
    console.error("Unexpected create log failure:", err);
    return null;
  }
}
