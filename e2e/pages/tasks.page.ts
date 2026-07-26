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
  // subtask to that task) — both currently share the identical aria-label
  // "Add a new task" (a `variant` prop to give subtask forms distinct
  // copy — "Add a subtask" / "Subtask title" — was discussed but is not
  // yet implemented in add-task-form.tsx). Role+name alone can't
  // disambiguate the top-level form, so it's wrapped in a `data-testid`
  // container and every top-level lookup is scoped inside it.
  private newTaskSection(): Locator {
    return this.page.getByTestId(testIds.taskSection.new);
  }

  async addTask(title: string) {
    const section = this.newTaskSection();
    await section.getByPlaceholder('Add a task').fill(title);

    await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.url().includes('/rest/v1/tasks') &&
          res.request().method() === 'POST',
        { timeout: 10_000 }
      ),
      section.getByRole('button', { name: 'Add task' }).click(),
    ]);
  }

  // Per-task subtask form. Scoped by taskCard(parentTaskId) instead of a
  // testid — TaskItem renders exactly one AddTaskForm, for its own
  // subtasks, so scoping to the card is sufficient today. If/when the
  // `variant` prop lands, update the placeholder/button text below to
  // 'Subtask title' / 'Add subtask' and this can drop the testid-free
  // reliance on "only one form per card" and match by name instead.
  async addSubtask(parentTaskId: string, title: string) {
    const form = this.taskCard(parentTaskId).getByRole('form', {
      name: 'Add a new task',
    });
    await form.getByPlaceholder('Add a task').fill(title);
    await form.getByRole('button', { name: 'Add task' }).click();
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

  // --- locating a subtask -------------------------------------------------
  subtaskCard(taskId: string): Locator {
    return this.page.locator(
      `[data-testid="${testIds.subtask.item}"][data-task-id="${taskId}"]`
    );
  }

  subtaskCardByTitle(parentTaskId: string, title: string): Locator {
    return this.taskCard(parentTaskId)
      .getByTestId(testIds.subtask.item)
      .filter({ hasText: title });
  }

  async resolveSubtaskId(parentTaskId: string, title: string): Promise<string> {
    const id = await this.subtaskCardByTitle(parentTaskId, title).getAttribute(
      'data-task-id'
    );
    if (!id) {
      throw new Error(
        `Could not resolve a data-task-id for subtask "${title}"`
      );
    }
    return id;
  }

  // --- task actions menu -------------------------------------------------
  //
  // ActionMenu (components/blocks/action-menu) renders a mobile Dialog
  // trigger and a desktop DropdownMenu trigger with the SAME aria-label
  // ("Actions for {title}") — only one is ever in the accessibility tree
  // at a given viewport, the other is display:none. The regex match
  // (rather than an exact string) avoids coupling this locator to the
  // task's title text; scoping by taskCard(taskId) is what actually
  // guarantees uniqueness against other tasks' "Actions for X" buttons.
  private actionsTrigger(taskId: string): Locator {
    return this.taskCard(taskId).getByRole('button', { name: 'Actions' });
  }

  async openActionsMenu(taskId: string) {
    await this.actionsTrigger(taskId).click();
  }

  async deleteTask(taskId: string) {
    await this.openActionsMenu(taskId);
    // Desktop-only role today — mobile's sheet uses plain buttons, not
    // menuitems. Fine while the suite runs a single desktop-width
    // project; revisit if a mobile viewport project is ever added.
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
  }

  async generateSubtasks(taskId: string) {
    await this.openActionsMenu(taskId);
    await this.page
      .getByRole('menuitem', { name: 'Generate subtasks' })
      .click();
  }

  // --- subtask actions menu ----------------------------------------------
  //
  // SubtaskItem uses the same shared ActionMenu as TaskItem, via
  // useSubtaskActions (edit/delete only — no "Generate subtasks").
  private subtaskActionsTrigger(taskId: string): Locator {
    return this.subtaskCard(taskId).getByRole('button', { name: 'Actions' });
  }

  async openSubtaskActionsMenu(taskId: string) {
    await this.subtaskActionsTrigger(taskId).click();
  }

  async deleteSubtask(taskId: string) {
    await this.openSubtaskActionsMenu(taskId);
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
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
