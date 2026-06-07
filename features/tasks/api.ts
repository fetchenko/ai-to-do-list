import { createClient } from "@/lib/supabase/client";

export async function addTask({ title }: { title: String }) {
  const supabase = createClient();

  const { data, error } = await supabase.from("tasks").insert({
    title,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchTasks() {
  const supabase = createClient();

  const { data, error } = await supabase.from("tasks").select("*");

  if (!error) {
    return data;
  } else {
    throw new Error(error.message);
  }
}

export async function updateTask({
  taskId,
  title,
}: {
  taskId: String;
  title: String;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({ title })
    .eq("id", taskId);

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteTask({ taskId }: { taskId: String }) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    throw error;
  }

  return data;
}
