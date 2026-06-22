import { createClient } from "@/infrastructure/supabase/client";
import { generateKeyBetween } from "fractional-indexing";
import { fromSupabaseError } from "@/shared/errors/from-supabase-error";
import { getLastPosition } from "../repository/tasks.repository";
import { TaskInsert } from "../types/tasks.types";
import { mapTaskInsertToDb } from "../mappers/tasks.mapper";

export async function addTask(
  parentTaskId: string | null,
  newTask: TaskInsert,
) {
  const supabase = createClient();

  const lastPosition = await getLastPosition(parentTaskId);

  const newPosition = generateKeyBetween(lastPosition ?? null, null);

  const { data, error } = await supabase
    .from("tasks")
    .insert(mapTaskInsertToDb({ ...newTask, position: newPosition }));

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}
