import { TasksPage } from '@e2e/pages/tasks.page';
import { test as base } from '@playwright/test';
import { randomUUID } from 'crypto';

import { supabaseAdmin } from '@/infrastructure/supabase/admin';

type TaskFactory = {
  title: (label: string) => string;
};

type Fixtures = {
  tasksPage: TasksPage;
  taskFactory: TaskFactory;
};

export const test = base.extend<Fixtures>({
  tasksPage: async ({ page }, use) => {
    await use(new TasksPage(page));
  },

  taskFactory: async ({}, use) => {
    const createdTitles: string[] = [];

    await use({
      title: (label: string) => {
        const title = `E2E ${label} ${randomUUID()}`;
        createdTitles.push(title);
        return title;
      },
    });

    if (createdTitles.length > 0) {
      const { error } = await supabaseAdmin
        .from('tasks')
        .delete()
        .in('title', createdTitles);

      if (error) {
        console.error(
          `[tasks.fixture] cleanup failed for [${createdTitles.join(', ')}]:`,
          error.message
        );
      }
    }
  },
});

export { expect } from '@playwright/test';

export async function getTaskRow(taskId: string) {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getSubtaskRows(parentTaskId: string) {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('parent_task_id', parentTaskId);

  if (error) throw error;
  return data ?? [];
}
