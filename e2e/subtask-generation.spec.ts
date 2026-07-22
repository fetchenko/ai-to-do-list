import { expect, getSubtaskRows, test } from '@e2e/fixtures/tasks.fixture';

test.describe('AI subtask generation', () => {
  test('generates draft subtasks and saves them when accepted', async ({
    page,
    tasksPage,
    taskFactory,
  }) => {
    // Mocked at the network boundary so the test doesn't call the real AI
    // provider, cost tokens, or flake on response variability — it still
    // exercises all real client code that consumes the response.
    await page.route('**/api/subtasks/generate', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            subtasks: [
              { title: 'Mocked subtask one' },
              { title: 'Mocked subtask two' },
            ],
          },
        }),
      })
    );

    const title = taskFactory.title('ai-subtasks');
    await tasksPage.goto();
    await tasksPage.addTask(title);

    const card = tasksPage.cardByTitle(title);
    await expect(card).toBeVisible();
    const taskId = await tasksPage.resolveTaskId(title);

    await tasksPage.generateSubtasks(taskId);

    const drafts = tasksPage.draftRows();
    await drafts.first().waitFor();
    await expect(drafts).toHaveCount(2);
    await expect(
      drafts.nth(0).getByRole('textbox', { name: 'Subtask title' })
    ).toHaveValue('Mocked subtask one');

    await tasksPage.acceptDraftSubtasks();
    await expect(drafts).toHaveCount(0);
    await expect(card.getByText('Mocked subtask one')).toBeVisible();
    await expect(card.getByText('Mocked subtask two')).toBeVisible();

    await expect
      .poll(async () => (await getSubtaskRows(taskId)).length)
      .toBe(2);
  });

  test('shows the real rate-limit message when generation is rejected, and saves nothing', async ({
    page,
    tasksPage,
    taskFactory,
  }) => {
    // Real ErrorCode value (AI_RATE_LIMIT), not a made-up one — this test
    // is only meaningful if it exercises the app's actual error mapping.
    await page.route('**/api/subtasks/generate', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'AI_RATE_LIMIT', message: 'Rate limited' },
        }),
      })
    );

    const title = taskFactory.title('ai-rate-limit');
    await tasksPage.goto();
    await tasksPage.addTask(title);

    const card = tasksPage.cardByTitle(title);
    await expect(card).toBeVisible();
    const taskId = await tasksPage.resolveTaskId(title);

    await tasksPage.generateSubtasks(taskId);

    await expect(
      page.getByText(
        'Lots of generations happening right now — try again in a moment.'
      )
    ).toBeVisible();

    await expect(tasksPage.draftRows()).toHaveCount(0);
    expect(await getSubtaskRows(taskId)).toHaveLength(0);
  });
});
