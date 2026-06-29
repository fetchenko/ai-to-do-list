import { Page, expect, test } from '@playwright/test';

async function addTask(page: Page, title: string) {
  const input = page.getByTestId('add-task-input');
  await input.fill(title);
  await page
    .locator('fieldset')
    .filter({ has: input })
    .getByRole('button', { name: 'Add' })
    .click();
}

function taskCard(page: Page, title: string) {
  return page.locator(`[data-testid="task-item"][data-task-title="${title}"]`);
}

test.describe('AI subtask generation', () => {
  test('generates draft subtasks and saves them when accepted', async ({ page }) => {
    // Mock the AI endpoint so the test doesn't call DeepSeek, doesn't cost
    // tokens, and doesn't flake on AI response variability.
    await page.route('**/api/subtasks/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            subtasks: [{ title: 'Mocked subtask one' }, { title: 'Mocked subtask two' }],
          },
        }),
      });
    });

    const title = `E2E ai-subtasks ${Date.now()}`;
    await page.goto('/');
    await addTask(page, title);

    const card = taskCard(page, title);
    await card.getByTestId('task-actions-trigger').click();
    await page.getByTestId('generate-subtasks-button').click();

    const drafts = page.getByTestId('draft-subtask');
    await expect(drafts).toHaveCount(2);
    await expect(page.locator('[data-subtask-title="Mocked subtask one"]')).toBeVisible();

    await page.getByRole('button', { name: 'Accept All' }).click();

    await expect(drafts).toHaveCount(0);
    await expect(card.getByText('Mocked subtask one')).toBeVisible();
    await expect(card.getByText('Mocked subtask two')).toBeVisible();

    await card.getByTestId('task-actions-trigger').click();
    await page.getByTestId('delete-task-button').click();
    await expect(card).toHaveCount(0);
  });

  test('shows an error toast when generation fails', async ({ page }) => {
    await page.route('**/api/subtasks/generate', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'AI_QUOTA_EXCEEDED', message: 'Quota exceeded' },
        }),
      });
    });

    const title = `E2E ai-error ${Date.now()}`;
    await page.goto('/');
    await addTask(page, title);

    const card = taskCard(page, title);
    await card.getByTestId('task-actions-trigger').click();
    await page.getByTestId('generate-subtasks-button').click();

    await expect(page.locator('[data-sonner-toast]')).toBeVisible();

    await card.getByTestId('task-actions-trigger').click();
    await page.getByTestId('delete-task-button').click();
    await expect(card).toHaveCount(0);
  });
});
