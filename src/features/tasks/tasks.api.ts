import { createClient } from "@/lib/supabase/client";
import { AiTask, DbTask, TaskInsert, TaskUpdate } from "../../types/tasks";
import { mapDbTasks, mapTaskToDb } from "./tasks.mapper";
import { API_ROUTES } from "@/lib/api-routes";
import { generateKeyBetween } from "fractional-indexing";
import { subtasksSchema } from "@/lib/validation/task";
import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/code";
import { fromSupabaseError } from "@/lib/errors/from-supabase-error";
import { PostgrestError } from "@supabase/supabase-js";
import { ErrorHttpStatus } from "@/shared/errors/http-status-map";

export async function addTask(
  parentTaskId: string | null,
  newTask: TaskInsert,
) {
  const supabase = createClient();

  const lastPosition = await getLastPosition(parentTaskId);

  const newPosition = generateKeyBetween(lastPosition ?? null, null);

  const { data, error } = await supabase
    .from("tasks")
    .insert(mapTaskToDb({ ...newTask, position: newPosition }));

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}

export async function getTasksWithSubtasks() {
  const supabase = createClient();

  const { data, error } = (await supabase
    .from("tasks")
    .select(
      `
    *,
    subtasks:tasks!parent_task_id(*)
  `,
    )
    .order("position")
    .is("parent_task_id", null)) as {
    data: DbTask[] | null;
    error: PostgrestError | null;
  };

  if (error) {
    throw fromSupabaseError(error);
  }

  return mapDbTasks(data);
}

export async function updateTask(id: string, newTask: TaskUpdate) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update(mapTaskToDb(newTask))
    .eq("id", id);

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}

export async function deleteTask(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}

export async function generateSubtasks(taskId: string): Promise<AiTask[]> {
  const res = await fetch(API_ROUTES.generateSubtasks, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new AppError(
      body?.error?.code ?? ErrorCode.UNKNOWN,
      res.status,
      body?.error?.message ?? "Failed to generate subtasks",
      body?.error?.details,
      body?.error?.retryable,
    );
  }

  const { data } = await res.json();

  const { data: parsed, success } = subtasksSchema.safeParse(data);

  if (!success) {
    throw new AppError(
      ErrorCode.AI_INVALID_RESPONSE_FORMAT,
      ErrorHttpStatus[ErrorCode.AI_INVALID_RESPONSE_FORMAT],
      "Invalid AI response format",
    );
  }
  if (!parsed.subtasks?.length) {
    throw new AppError(
      ErrorCode.AI_EMPTY_RESPONSE,
      ErrorHttpStatus[ErrorCode.AI_EMPTY_RESPONSE],
      "No meaningful subtasks could be generated.",
    );
  }

  const subtasks = parsed.subtasks.map((subtask) => ({
    ...subtask,
    id: crypto.randomUUID(),
  }));

  return subtasks;
}

export async function saveSubtasks(
  parentTaskId: string,
  subtasks: TaskInsert[],
) {
  const supabase = createClient();

  const lastPosition = await getLastPosition(parentTaskId);

  let prev = lastPosition ?? null;

  const rows = subtasks.map(({ id, ...subtask }) => {
    const next = generateKeyBetween(prev, null);
    prev = next;

    return mapTaskToDb({
      ...subtask,
      position: next,
      parentTaskId,
    });
  });

  const { data, error } = await supabase.from("tasks").insert(rows);

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}

export async function getLastPosition(parentTaskId: string | null) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_last_position", {
    p_parent_id: parentTaskId ?? undefined,
  });

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}
