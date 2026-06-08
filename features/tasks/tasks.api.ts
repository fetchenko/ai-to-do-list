import { createClient } from "@/lib/supabase/client";
import { Task } from "./tasks.types";
import { mapTask } from "./tasks.mapper";

export async function addTask(newTask: Task) {
  const supabase = createClient();

  const { data, error } = await supabase.from("tasks").insert({
    title: newTask.title,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchTasks(): Promise<Task[]> {
  const supabase = createClient();

  const { data, error } = await supabase.from("tasks").select("*");

  if (!error) {
    return data.map(mapTask);
  } else {
    throw new Error(error.message);
  }
}

export async function updateTask(newTask: Task) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({ title: newTask.title })
    .eq("id", newTask.id);

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
