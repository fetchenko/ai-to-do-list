import { createClient } from "@/lib/supabase/client";
import { DbTask, Task } from "./tasks.types";
import { mapDbTasks, mapTaskUpdateToDb } from "./tasks.mapper";
import { API_ROUTES } from "@/lib/api-routes";
import { generateKeyBetween } from "fractional-indexing";

export async function addTask(
  parentTaskId: string | null,
  newTask: Partial<Task>,
) {
  const supabase = createClient();

  const lastPosition = await getLastPosition(parentTaskId);

  const newPosition = generateKeyBetween(lastPosition ?? null, null);

  const { data, error } = await supabase
    .from("tasks")
    .insert(mapTaskUpdateToDb({ ...newTask, position: newPosition }));

  if (error) {
    throw error;
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
    .is("parent_task_id", null)) as {
    data: DbTask[] | null;
    error: Error | null;
  };

  if (error) {
    throw error;
  }

  return mapDbTasks(data);
}

export async function updateTask(id: string, newTask: Partial<Task>) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update(mapTaskUpdateToDb(newTask))
    .eq("id", id);

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteTask(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return data;
}

export async function generateSubtasks({ title }: Partial<Task>) {
  try {
    const res = await fetch(API_ROUTES.generateSubtasks, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task: title }),
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const data = await res.json();

    if (!data?.subtasks || !Array.isArray(data.subtasks)) {
      throw new Error("Invalid AI response format");
    }

    const subtasks = data.subtasks.map((subtask: Task) => ({
      ...subtask,
      id: crypto.randomUUID(),
    }));

    return subtasks;
  } catch (err: any) {
    console.error("generateSubtasks failed:", err);
  }
}

export async function saveSubtasks(parentTaskId: string, subtasks: Task[]) {
  const supabase = createClient();

  const lastPosition = await getLastPosition(parentTaskId);

  let prev = lastPosition ?? null;

  const rows = subtasks.map((subtask) => {
    const next = generateKeyBetween(prev, null);
    prev = next;

    return {
      title: subtask.title,
      description: subtask.description,
      parent_task_id: parentTaskId,
      position: next,
    };
  });

  const { data, error } = await supabase.from("tasks").insert(rows);

  if (error) {
    throw error;
  }

  return data;
}

export async function getLastPosition(parentTaskId: string | null) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_last_position", {
    p_parent_id: parentTaskId ?? undefined,
  });

  if (error) {
    throw error;
  }

  return data;
}
