import { expect, test } from '@e2e/fixtures/tasks.fixture';
import { randomUUID } from 'crypto';

test.describe('task search', () => {
  test('filters the task list by title as the user types', async ({
    tasksPage,
    taskFactory,
  }) => {
    const matchTitle = taskFactory.title('needle-alpha');
    const otherTitle = taskFactory.title('unrelated-beta');

    await tasksPage.goto();
    await tasksPage.addTask(matchTitle);
    await tasksPage.addTask(otherTitle);

    await expect(tasksPage.cardByTitle(matchTitle)).toBeVisible();
    await expect(tasksPage.cardByTitle(otherTitle)).toBeVisible();

    await tasksPage.search('needle-alpha');

    await expect(tasksPage.cardByTitle(matchTitle)).toBeVisible();
    await expect(tasksPage.cardByTitle(otherTitle)).toHaveCount(0);
  });

  test('matches on description text, not just title', async ({
    tasksPage,
    taskFactory,
  }) => {
    const matchTitle = taskFactory.title('desc-match');
    const otherTitle = taskFactory.title('desc-nomatch');
    const description = `unique-detail-${randomUUID()}`;

    await tasksPage.goto();
    await tasksPage.addTask(matchTitle, { description });
    await tasksPage.addTask(otherTitle);

    await tasksPage.search(description);

    await expect(tasksPage.cardByTitle(matchTitle)).toBeVisible();
    await expect(tasksPage.cardByTitle(otherTitle)).toHaveCount(0);
  });

  test('clearing the search restores the full list', async ({
    tasksPage,
    taskFactory,
  }) => {
    const titleA = taskFactory.title('clear-a');
    const titleB = taskFactory.title('clear-b');

    await tasksPage.goto();
    await tasksPage.addTask(titleA);
    await tasksPage.addTask(titleB);

    await tasksPage.search(titleA);
    await expect(tasksPage.cardByTitle(titleB)).toHaveCount(0);

    await tasksPage.clearSearch();
    await expect(tasksPage.cardByTitle(titleA)).toBeVisible();
    await expect(tasksPage.cardByTitle(titleB)).toBeVisible();
  });

  test('keeps a parent visible when only a subtask matches, showing just that subtask', async ({
    tasksPage,
    taskFactory,
  }) => {
    const parentTitle = taskFactory.title('parent-no-match');
    const matchingSubtask = taskFactory.title('subtask-needle');
    const otherSubtask = taskFactory.title('subtask-other');

    await tasksPage.goto();
    await tasksPage.addTask(parentTitle);
    const parentId = await tasksPage.resolveTaskId(parentTitle);

    await tasksPage.addSubtask(parentId, matchingSubtask);
    await tasksPage.addSubtask(parentId, otherSubtask);
    const matchingSubtaskId = await tasksPage.resolveSubtaskId(
      parentId,
      matchingSubtask
    );
    const otherSubtaskId = await tasksPage.resolveSubtaskId(
      parentId,
      otherSubtask
    );

    await tasksPage.search('subtask-needle');

    // Parent's own title doesn't match "subtask-needle" — it should stay
    // visible anyway because one of its subtasks does.
    await expect(tasksPage.taskCard(parentId)).toBeVisible();
    await expect(tasksPage.subtaskCard(matchingSubtaskId)).toBeVisible();
    await expect(tasksPage.subtaskCard(otherSubtaskId)).toHaveCount(0);
  });

  test('search stays applied when switching tabs', async ({
    tasksPage,
    taskFactory,
  }) => {
    const matchTitle = taskFactory.title('done-needle');
    const otherTitle = taskFactory.title('done-other');

    await tasksPage.goto();
    await tasksPage.addTask(matchTitle);
    await tasksPage.addTask(otherTitle);

    const matchId = await tasksPage.resolveTaskId(matchTitle);
    const otherId = await tasksPage.resolveTaskId(otherTitle);
    await tasksPage.markDone(matchId);
    await tasksPage.markDone(otherId);

    await tasksPage.search('done-needle');
    await tasksPage.openTab('Done');

    await expect(tasksPage.taskCard(matchId)).toBeVisible();
    await expect(tasksPage.taskCard(otherId)).toHaveCount(0);
  });

  test('shows a "no tasks match" message when the query has no matches', async ({
    page,
    tasksPage,
    taskFactory,
  }) => {
    const title = taskFactory.title('empty-state');
    const query = `no-such-task-${randomUUID().slice(0, 8)}`;

    await tasksPage.goto();
    await tasksPage.addTask(title);

    await tasksPage.search(query);

    await expect(tasksPage.cardByTitle(title)).toHaveCount(0);
    await expect(page.getByText(`No tasks match "${query}"`)).toBeVisible();
  });
});
