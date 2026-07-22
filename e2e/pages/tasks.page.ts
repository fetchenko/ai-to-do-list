import { Locator, Page } from '@playwright/test';

import { testIds } from '@/shared/testing/test-ids';

/**
 * Actions only — no expect() calls in here. Tests own their assertions;
 * this class just knows how to do things a user can do.
 */
export class TasksPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  // --- creating a task ------------------------------------------------
  //
  // AddTaskForm is rendered twice on screen at once: once at the top of
  // the page (add a top-level task) and once per expanded TaskItem (add a
  // subtask to that task) — both share the identical aria-label "Add a
  // new task". Role+name alone can't tell them apart, so the top-level
  // one is wrapped in a `data-testid` container (see component-changes.md)
  // and every lookup here is scoped inside it.
  private newTaskSection(): Locator {
    return this.page.getByTestId(testIds.taskSection.new);
  }

  async addTask(title: string) {
    const section = this.newTaskSection();
    await section.getByPlaceholder('Add a task').fill(title);
    await section.getByRole('button', { name: 'Add task' }).click();
  }

  // --- locating a task --------------------------------------------------

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

  // --- task actions menu -------------------------------------------------
  //
  // aria-label is "task actions" (desktop dropdown trigger) vs
  // "open task actions" (mobile dialog trigger, hidden on desktop
  // viewport but still present in the DOM). Playwright's default name
  // matching is substring-based, so "task actions" would match BOTH —
  // `exact: true` is required here, not optional.
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

  // --- status --------------------------------------------------------

  async markDone(taskId: string) {
    await this.taskCard(taskId).getByRole('checkbox').click();
  }

  async openTab(name: 'Active' | 'Done') {
    await this.page.getByRole('tab', { name }).click();
  }

  // --- AI draft subtasks ------------------------------------------------
  //
  // Every draft row's title/description fields share the identical
  // aria-labels "Subtask title" / "Subtask description" — there's no
  // accessible way to say "the 2nd row" without a testid.
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
