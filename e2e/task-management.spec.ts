import {
  UNDO_WINDOW_ASSERTION_TIMEOUT_MS,
  expect,
  getTaskRow,
  test,
} from '@e2e/fixtures/tasks.fixture';

test.describe('task management', () => {
  test('creating a task adds it to the Active list and persists it', async ({
    page,
    tasksPage,
    taskFactory,
  }) => {
    const title = taskFactory.title('create');
    await tasksPage.goto();

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('/rest/v1/tasks') &&
          res.request().method() === 'POST'
      ),
      tasksPage.addTask(title),
    ]);
    expect(response.ok()).toBe(true);

    const card = tasksPage.cardByTitle(title);
    await expect(card).toBeVisible();

    const taskId = await tasksPage.resolveTaskId(title);
    await expect
      .poll(async () => (await getTaskRow(taskId))?.status)
      .toBe('active');
  });

  test('marking a task done moves it from Active to Done', async ({
    tasksPage,
    taskFactory,
  }) => {
    const title = taskFactory.title('complete');
    await tasksPage.goto();
    await tasksPage.addTask(title);

    const activeCard = tasksPage.cardByTitle(title);
    await expect(activeCard).toBeVisible();
    const taskId = await tasksPage.resolveTaskId(title);

    await tasksPage.markDone(taskId);
    await expect(activeCard).toHaveCount(0);

    await tasksPage.openTab('Done');
    const doneCard = tasksPage.taskCard(taskId);
    await expect(doneCard).toBeVisible();
    await expect(doneCard.getByRole('checkbox')).toBeChecked();

    await expect
      .poll(async () => (await getTaskRow(taskId))?.status)
      .toBe('done');
  });

  test('deleting a task removes it from the UI immediately, and from the database after the undo window', async ({
    tasksPage,
    taskFactory,
  }) => {
    const title = taskFactory.title('delete');
    await tasksPage.goto();
    await tasksPage.addTask(title);

    const card = tasksPage.cardByTitle(title);
    await expect(card).toBeVisible();
    const taskId = await tasksPage.resolveTaskId(title);

    await tasksPage.deleteTask(taskId);
    await expect(card).toHaveCount(0);

    // The delete is optimistic in the UI; useDeleteTaskWithUndo defers the
    // real soft-delete by 8s (UNDO_WINDOW_MS). Poll past that window to
    // confirm the backend actually committed it, rather than trusting the
    // optimistic UI state.
    await expect
      .poll(async () => (await getTaskRow(taskId))?.deleted_at, {
        timeout: UNDO_WINDOW_ASSERTION_TIMEOUT_MS,
      })
      .not.toBeNull();
  });

  test('subtasks can be edited and deleted, but never offer "Generate subtasks"', async ({
    page,
    tasksPage,
    taskFactory,
  }) => {
    const parentTitle = taskFactory.title('parent');
    const subtaskTitle = taskFactory.title('subtask');

    await tasksPage.goto();
    await tasksPage.addTask(parentTitle);
    const parentId = await tasksPage.resolveTaskId(parentTitle);

    await tasksPage.addSubtask(parentId, subtaskTitle);
    const subtaskId = await tasksPage.resolveSubtaskId(parentId, subtaskTitle);
    await expect(tasksPage.subtaskCard(subtaskId)).toBeVisible();

    await tasksPage.openSubtaskActionsMenu(subtaskId);
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Generate subtasks' })
    ).not.toBeVisible();

    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(tasksPage.subtaskCard(subtaskId)).toHaveCount(0);

    // Same optimistic-delete-with-undo deferral as the task-deletion test above:
    // useDeleteTaskWithUndo delays the real soft-delete by UNDO_WINDOW_MS (8s).
    // Poll past that window rather than trusting the optimistic UI state.
    await expect
      .poll(async () => (await getTaskRow(subtaskId))?.deleted_at, {
        timeout: UNDO_WINDOW_ASSERTION_TIMEOUT_MS,
      })
      .not.toBeNull();
  });
});
