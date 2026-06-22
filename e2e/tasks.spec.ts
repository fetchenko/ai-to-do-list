import { test, expect, Page } from "@playwright/test";

async function addTask(page: Page, title: string) {
  const input = page.getByTestId("add-task-input");
  await input.fill(title);
  await page
    .locator("fieldset")
    .filter({ has: input })
    .getByRole("button", { name: "Add" })
    .click();
}

function taskCard(page: Page, title: string) {
  return page.locator(`[data-testid="task-item"][data-task-title="${title}"]`);
}

test.describe("tasks", () => {
  test("user can create a task and see it in the list", async ({ page }) => {
    const title = `E2E create ${Date.now()}`;
    await page.goto("/");

    await addTask(page, title);

    await expect(taskCard(page, title)).toBeVisible();

    const card = taskCard(page, title);
    await card.getByTestId("task-actions-trigger").click();

    await expect(page.getByTestId("delete-task-button")).toBeVisible();

    await page.getByTestId("delete-task-button").click();
    await expect(card).toHaveCount(0);
  });

  test("user can mark a task as done", async ({ page }) => {
    const title = `E2E complete ${Date.now()}`;
    await page.goto("/");
    await addTask(page, title);

    const activeCard = taskCard(page, title);
    await activeCard.getByTestId("task-checkbox").click();

    await expect(activeCard).toHaveCount(0);

    await page.getByRole("tab", { name: "Done" }).click();
    const doneCard = taskCard(page, title);
    await expect(doneCard).toBeVisible();
    await expect(doneCard.getByTestId("task-checkbox")).toBeChecked();

    await doneCard.getByTestId("task-actions-trigger").click();
    await page.getByTestId("delete-task-button").click();
    await expect(doneCard).toHaveCount(0);
  });

  test("shows a validation error for a too-short title", async ({ page }) => {
    await page.goto("/");

    const input = page.getByTestId("add-task-input");
    await input.fill("hi");
    await page
      .locator("fieldset")
      .filter({ has: input })
      .getByRole("button", { name: "Add" })
      .click();

    await expect(
      page.getByText("Title must be at least 5 characters"),
    ).toBeVisible();
  });
});
