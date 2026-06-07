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

export async function fetchTasks () {
  const supabase = createClient();

  const response = await supabase
    .from('tasks')
    .select('*');

    if (!response.error) {
    return response.data;
  } else {
    throw new Error(response.error.message);
  }
};

