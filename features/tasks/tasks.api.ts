import { createClient } from '@/lib/supabase/client';
import { Task } from './tasks.types';
import { mapTask } from './tasks.mapper';
import { API_ROUTES } from '@/lib/api-routes';

export async function addTask(newTask: Task) {
  const supabase = createClient();

  const { data, error } = await supabase.from('tasks').insert({
    title: newTask.title,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchTasks(): Promise<Task[]> {
  const supabase = createClient();

  const { data, error } = await supabase.from('tasks').select('*');

  if (!error) {
    return data.map(mapTask);
  } else {
    throw new Error(error.message);
  }
}

export async function updateTask(newTask: Task) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .update({ title: newTask.title })
    .eq('id', newTask.id);

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteTask(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) {
    throw error;
  }

  return data;
}

export async function generateSubtasks({ title }: Partial<Task>) {
  try {
    const res = await fetch(API_ROUTES.generateSubtasks, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: title }),
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const data = await res.json();

    if (!data?.subtasks || !Array.isArray(data.subtasks)) {
      throw new Error('Invalid AI response format');
    }

    const subtasks = data.subtasks.map((subtask: Task) => ({
      ...subtask,
      id: crypto.randomUUID(),
    }));

    return subtasks;
  } catch (err: any) {
    console.error('generateSubtasks failed:', err);
  }
}

export async function saveSubtasks(parentTaskId: string, subtasks: Task[]) {
  const supabase = createClient();

  const { data, error } = await supabase.from('tasks').insert(
    subtasks.map((subtask) => ({
      title: subtask.title,
      description: subtask.description,
      parent_task_id: parentTaskId,
    })),
  );

  if (error) {
    throw error;
  }

  return data;
}
