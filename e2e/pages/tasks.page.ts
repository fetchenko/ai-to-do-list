import { Locator, Page } from '@playwright/test';

import { testIds } from '@/shared/testing/test-ids';

export class TasksPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  private newTaskSection(): Locator {
    return this.page.getByTestId(testIds.taskSection.new);
  }

  async addTask(title: string) {
    const section = this.newTaskSection();
    await section.getByPlaceholder('Add a task').fill(title);
    await section.getByRole('button', { name: 'Add task' }).click();
  }

  taskCard(taskId: string): Locator {
    return this.page.locator(
      `[data-testid="${testIds.task.item}"][data-task-id="${taskId}"]`
    );
  }

  cardByTitle(title: string): Locator {
    return this.page.getByTestId(testIds.task.item).filter({ hasText: title });
  }

  async resolveTaskId(title: string): Promise<string> {
    const id = await this.cardByTitle(title).getAttribute('data-task-id');
    if (!id) {
      throw new Error(`Could not resolve a data-task-id for "${title}"`);
    }
    return id;
  }

  private actionsTrigger(taskId: string): Locator {
    return this.taskCard(taskId).getByRole('button', {
      name: 'task actions',
      exact: true,
    });
  }

  async openActionsMenu(taskId: string) {
    await this.actionsTrigger(taskId).click();
  }

  async deleteTask(taskId: string) {
    await this.openActionsMenu(taskId);
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
  }

  async generateSubtasks(taskId: string) {
    await this.openActionsMenu(taskId);
    await this.page
      .getByRole('menuitem', { name: 'Generate subtasks' })
      .click();
  }

  async markDone(taskId: string) {
    await this.taskCard(taskId).getByRole('checkbox').click();
  }

  async openTab(name: 'Active' | 'Done') {
    await this.page.getByRole('tab', { name }).click();
  }

  draftRows(): Locator {
    return this.page.getByTestId(testIds.draftSubtask.row);
  }

  async acceptDraftSubtasks() {
    await this.page.getByRole('button', { name: /Add \d+ subtasks?/ }).click();
  }

  async discardDraftSubtasks() {
    await this.page.getByRole('button', { name: 'Discard' }).click();
  }
}
