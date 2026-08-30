import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TaskItem from '@/features/tasks/components/task-item';
import type { Task } from '@/features/tasks/types/tasks.types';

const mockActions = [
  { id: 'edit', label: 'Edit', onSelect: vi.fn() },
  { id: 'delete', label: 'Delete', variant: 'destructive' as const, onSelect: vi.fn() },
];
const mockCreateTask = vi.fn();

vi.mock('@/features/tasks/hooks/use-base-task-actions', () => ({
  useBaseTaskActions: vi.fn(() => mockActions),
}));
vi.mock('@/features/tasks/hooks/use-create-task', () => ({
  useCreateTask: vi.fn(() => ({ mutateAsync: mockCreateTask, error: null })),
}));
vi.mock('@/features/tasks/components/forms/draft-subtasks', () => ({
  DraftSubtasks: ({ task }: { task: Task }) => <div data-testid="draft-subtasks">Drafts for {task.id}</div>,
}));
vi.mock('@/features/tasks/components/subtask-list', () => ({
  default: ({ parentTitle, subtasks }: { parentTitle: string; subtasks: Task[] }) => (
    <div data-testid="subtask-list">{parentTitle}: {subtasks.length}</div>
  ),
}));
vi.mock('@/features/tasks/components/forms/add-task-form', () => ({
  AddTaskForm: ({ onAddTask }: { onAddTask: typeof mockCreateTask }) => (
    <button type="button" onClick={() => onAddTask({ title: 'New subtask' })}>Add subtask</button>
  ),
}));
vi.mock('@/features/tasks/components/task-row', () => ({
  TaskRow: ({ task, actions }: { task: Task; actions: typeof mockActions }) => (
    <div>
      <h2>{task.title}</h2>
      <button type="button" onClick={actions[0].onSelect}>Edit task</button>
      <button type="button" onClick={actions[1].onSelect}>Delete task</button>
    </div>
  ),
}));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
}));

const task: Task = {
  id: 'task-1', title: 'Plan a trip', description: 'Trip planning',
  completedAt: null, createdAt: null, deletedAt: null, dueDate: null,
  parentTaskId: null, position: 'a0', priority: null, status: 'active',
  updatedAt: null, userId: 'user-1',
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

  it('always renders DraftSubtasks for the task', () => {
    render(<TaskItem task={task} subtasks={[subtask]} />);

    expect(screen.getByTestId('draft-subtasks')).toHaveTextContent('Drafts for task-1');
    expect(screen.getByTestId('subtask-list')).toHaveTextContent('Plan a trip: 1');
  });

  it('passes the base task actions to the task row', async () => {
    const user = userEvent.setup();
    render(<TaskItem task={task} subtasks={[]} />);

    await user.click(screen.getByRole('button', { name: 'Edit task' }));
    await user.click(screen.getByRole('button', { name: 'Delete task' }));

    expect(mockActions[0].onSelect).toHaveBeenCalledTimes(1);
    expect(mockActions[1].onSelect).toHaveBeenCalledTimes(1);
  });

  it('passes the create-task action to AddTaskForm', async () => {
    const user = userEvent.setup();
    render(<TaskItem task={task} subtasks={[]} />);

    await user.click(screen.getByRole('button', { name: 'Add subtask' }));
    expect(mockCreateTask).toHaveBeenCalledWith({ title: 'New subtask' });
  });

  it('renders the task identity and keeps generated drafts scoped to the task', () => {
    render(<TaskItem task={task} subtasks={[]} />);

    const item = screen.getByTestId('task-item');
    expect(item).toHaveAttribute('data-task-id', 'task-1');
    expect(screen.getByRole('heading', { name: 'Plan a trip' })).toBeInTheDocument();
  });
});
