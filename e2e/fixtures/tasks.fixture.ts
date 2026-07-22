import { TasksPage } from '@e2e/pages/tasks.page';
import { test as base } from '@playwright/test';
import { randomUUID } from 'crypto';

import { supabaseAdmin } from '@/infrastructure/supabase/admin';

type TaskFactory = {
  /** Returns a globally-unique title and registers it for cleanup. */
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

    // Teardown — runs whether the test passed, failed, or threw partway
    // through. This is intentionally NOT the app's own delete flow:
    // useDeleteTaskWithUndo defers the real softDeleteTask call by 8s via
    // setTimeout, and Playwright kills that timer the moment it closes the
    // page/context after a test. Relying on the UI to clean up after
    // itself silently leaves every test's data in Supabase forever.
    // Deleting by exact, per-test-unique title means this is scoped to
    // rows this test actually created — safe to run with parallel workers.
    if (createdTitles.length > 0) {
      const { error } = await supabaseAdmin
        .from('tasks')
        .delete()
        .in('title', createdTitles);

      if (error) {
        // Don't fail the test over cleanup — surface it loudly instead so
        // it doesn't silently accumulate orphaned rows.
        console.error(
          `[tasks.fixture] cleanup failed for [${createdTitles.join(', ')}]:`,
          error.message
        );
      }
    }
  },
});

export { expect } from '@playwright/test';

// --- backend-state helpers --------------------------------------------
//
// "Verify backend state" per the test generator rules: these read directly
// from Supabase via the service-role client so tests can confirm a UI
// action actually persisted, not just that the optimistic UI updated.

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
