export const testIds = {
  /**
   * Wraps the page-level "add a new task" form in TasksManager. Needed
   * because every TaskItem also renders its own AddTaskForm instance (for
   * adding subtasks) with an identical aria-label ("Add a new task") — role
   * + accessible name alone can't disambiguate the top-level form from the
   * N per-task forms on the page.
   */
  taskSection: {
    new: 'new-task-section',
    search: 'task-search-input',
  },
  /**
   * Parent task card. Role="article" + accessible name (task title) is the
   * primary way tests should locate a specific task — this testid plus
   * data-task-id is a secondary, id-based hook for cases where matching by
   * title text isn't appropriate (e.g. asserting count across many cards).
   */
  task: {
    item: 'task-item',
  },
  /**
   * Subtask card. Unlike TaskItem, SubtaskItem renders a plain, non-landmark
   * <Card> with no aria-labelledby — there is no accessible-role path to a
   * specific subtask today, so this testid is load-bearing, not a
   * convenience. (Flagged as an a11y gap worth fixing separately.)
   */
  subtask: {
    item: 'subtask-item',
  },
  /**
   * One AI-generated draft row inside the DraftSubtasks form. The row's
   * title/description inputs both have generic aria-labels ("Subtask
   * title" / "Subtask description") that repeat identically across every
   * draft row, so a testid is the only way to address "the 2nd draft row"
   * without relying on DOM order via nth().
   */
  draftSubtask: {
    row: 'draft-subtask-row',
  },
} as const;
