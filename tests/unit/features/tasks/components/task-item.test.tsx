import type { PropsWithChildren } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TaskItem from '@/features/tasks/components/task-item';
import type { Task } from '@/features/tasks/types/tasks.types';
import { testIds } from '@/shared/testing/test-ids';

const { mockCreateTask } = vi.hoisted(() => ({
  mockCreateTask: vi.fn(),
}));

vi.mock('@/features/tasks/hooks/use-create-task', () => ({
  useCreateTask: vi.fn(() => ({
    mutateAsync: mockCreateTask,
    error: null,
  })),
}));

vi.mock('@/features/tasks/components/forms/draft-subtasks-form', () => ({
  DraftSubtasks: ({ task }: { task: Task }) => (
    <div data-testid="draft-subtasks">Drafts for {task.id}</div>
  ),
}));

vi.mock('@/features/tasks/components/subtask-list', () => ({
  default: ({
    parentTitle,
    subtasks,
  }: {
    parentTitle: string;
    subtasks: Task[];
  }) => (
    <div data-testid="subtask-list">
      {parentTitle}: {subtasks.length}
    </div>
  ),
}));

vi.mock('@/features/tasks/components/forms/add-task-form', () => ({
  AddTaskForm: ({
    onAddTask,
  }: {
    onAddTask: (input: { title: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onAddTask({ title: 'New subtask' })}
    >
      Add subtask
    </button>
  ),
}));

vi.mock('@/features/tasks/components/task-row', () => ({
  TaskRow: ({
    task,
    titleId,
  }: {
    task: Task;
    titleId: string;
  }) => (
    <div data-testid="task-row">
      <p id={titleId}>{task.title}</p>
    </div>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    ...props
  }: PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
}));

const task: Task = {
  id: 'task-1',
  title: 'Plan a trip',
  description: 'Trip planning',
  completedAt: null,
  createdAt: null,
  deletedAt: null,
  dueDate: null,
  parentTaskId: null,
  position: 'a0',
  priority: null,
  status: 'active',
  updatedAt: null,
  userId: 'user-1',
};

const subtask: Task = {
  ...task,
  id: 'subtask-1',
  title: 'Book hotel',
  parentTaskId: 'task-1',
  position: 'a1',
};

describe('TaskItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the task row', () => {
    render(<TaskItem task={task} subtasks={[]} />);

    expect(screen.getByTestId('task-row')).toBeInTheDocument();
    expect(screen.getByText('Plan a trip')).toBeInTheDocument();
  });

  it('renders the subtask list with the current task and subtasks', () => {
    render(<TaskItem task={task} subtasks={[subtask]} />);

    expect(screen.getByTestId('subtask-list')).toHaveTextContent(
      'Plan a trip: 1'
    );
  });

  it('renders DraftSubtasks for the current task', () => {
    render(<TaskItem task={task} subtasks={[]} />);

    expect(screen.getByTestId('draft-subtasks')).toHaveTextContent(
      'Drafts for task-1'
    );
  });

  it('passes the create-task action to AddTaskForm', async () => {
    const user = userEvent.setup();

    render(<TaskItem task={task} subtasks={[]} />);

    await user.click(
      screen.getByRole('button', { name: 'Add subtask' })
    );

    expect(mockCreateTask).toHaveBeenCalledTimes(1);
    expect(mockCreateTask).toHaveBeenCalledWith({
      title: 'New subtask',
    });
  });

  it('associates the task article with its title', () => {
    render(<TaskItem task={task} subtasks={[]} />);

    const article = screen.getByRole('article');
    const title = screen.getByText('Plan a trip');

    expect(article).toHaveAttribute(
      'aria-labelledby',
      'task-title-task-1'
    );

    expect(title).toHaveAttribute(
      'id',
      'task-title-task-1'
    );
  });

  it('renders the task item with the task id', () => {
    render(<TaskItem task={task} subtasks={[]} />);

    const item = screen.getByTestId(testIds.task.item);

    expect(item).toHaveAttribute('data-task-id', 'task-1');
  });
});