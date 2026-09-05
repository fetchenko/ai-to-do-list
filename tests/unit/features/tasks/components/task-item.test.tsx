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
  beforeEach(() => vi.clearAllMocks());

  it('renders DraftSubtasks for every task without owning generation state', () => {
    render(<TaskItem task={task} subtasks={[subtask]} />);

    expect(screen.getByTestId('draft-subtasks')).toHaveTextContent('Drafts for task-1');
    expect(screen.getByTestId('subtask-list')).toHaveTextContent('Plan a trip: 1');
  });

  it('passes the task actions to TaskRow', async () => {
    const user = userEvent.setup();
    render(<TaskItem task={task} subtasks={[]} />);

    await user.click(screen.getByRole('button', { name: 'Edit task' }));
    await user.click(screen.getByRole('button', { name: 'Delete task' }));

    expect(mockActions[0].onSelect).toHaveBeenCalledTimes(1);
    expect(mockActions[1].onSelect).toHaveBeenCalledTimes(1);
  });

  it('uses base task actions rather than the former generation-aware task actions', async () => {
    const { useBaseTaskActions } = await import('@/features/tasks/hooks/use-base-task-actions');
    render(<TaskItem task={task} subtasks={[]} />);

    expect(vi.mocked(useBaseTaskActions)).toHaveBeenCalledWith(task);
  });

  it('passes the create-task action to AddTaskForm', async () => {
    const user = userEvent.setup();
    render(<TaskItem task={task} subtasks={[]} />);

    await user.click(screen.getByRole('button', { name: 'Add subtask' }));
    expect(mockCreateTask).toHaveBeenCalledWith({ title: 'New subtask' });
  });

  it('passes the current task to DraftSubtasks', () => {
    render(<TaskItem task={task} subtasks={[]} />);
    expect(screen.getByTestId('draft-subtasks')).toHaveTextContent('task-1');
  });

  it('keeps generated-draft UI isolated from the task actions', () => {
    render(<TaskItem task={task} subtasks={[]} />);

    expect(screen.getByTestId('draft-subtasks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete task' })).toBeInTheDocument();
  });
});
