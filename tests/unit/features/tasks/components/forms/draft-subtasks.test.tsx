import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DraftSubtasks } from '@/features/tasks/components/forms/draft-subtasks';
import { saveSubtasks, streamSubtasks } from '@/features/tasks/services/subtasks.service';
import type { SubtaskStreamEvent } from '@/features/tasks/types/stream-event.types';
import type { Task } from '@/features/tasks/types/tasks.types';
import { AiUnavailableError } from '@/shared/errors/app-error';

vi.mock('@/features/tasks/services/subtasks.service', () => ({
  streamSubtasks: vi.fn(),
  saveSubtasks: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));

const mockedStreamSubtasks = vi.mocked(streamSubtasks);
const mockedSaveSubtasks = vi.mocked(saveSubtasks);

const task: Task = {
  id: 'task-1', title: 'Plan a trip', description: null,
  completedAt: null, createdAt: null, deletedAt: null, dueDate: null,
  parentTaskId: null, position: 'a0', priority: null, status: 'active',
  updatedAt: null, userId: 'user-1',
};

function createStream(chunks: SubtaskStreamEvent[]): AsyncGenerator<SubtaskStreamEvent> {
  return (async function* () { for (const chunk of chunks) yield chunk; })();
}

function renderComponent() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DraftSubtasks task={task} />
    </QueryClientProvider>
  );
}

describe('DraftSubtasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSaveSubtasks.mockResolvedValue([]);
  });

  it('renders the idle state', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /generate subtask/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('accept-draft-subtasks')).not.toBeInTheDocument();
    expect(screen.queryByText(/AI-generated — tap any field/i)).not.toBeInTheDocument();
  });

  it('shows the generating state while the stream is pending', async () => {
    let resolve!: () => void;
    mockedStreamSubtasks.mockReturnValue((async function* () {
      await new Promise<void>((r) => { resolve = r; });
      yield { type: 'done' };
    })());

    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: /generate subtask/i }));

    expect(screen.getByText('Generating…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate subtask/i })).not.toBeInTheDocument();

    resolve();
    await waitFor(() => expect(screen.queryByText('Generating…')).not.toBeInTheDocument());
  });

  it('appends each streamed subtask to the React Hook Form field array', async () => {
    mockedStreamSubtasks.mockReturnValue(createStream([
      { type: 'subtask', subtask: { title: 'Research hotels', description: 'Compare locations' } },
      { type: 'subtask', subtask: { title: 'Book flights', description: 'Check flight options' } },
      { type: 'done' },
    ]));

    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: /generate subtask/i }));

    await waitFor(() => expect(screen.getAllByTestId('draft-subtask')).toHaveLength(2));
    expect(screen.getByDisplayValue('Research hotels')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Compare locations')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Book flights')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Check flight options')).toBeInTheDocument();
    expect(screen.getByText(/AI-generated — tap any field/i)).toBeInTheDocument();
    expect(screen.getByTestId('accept-draft-subtasks')).toHaveTextContent('Add 2 subtasks');
  });

  it('uses the singular add label for one draft', async () => {
    mockedStreamSubtasks.mockReturnValue(createStream([
      { type: 'subtask', subtask: { title: 'One' } },
    ]));
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: /generate subtask/i }));
    await waitFor(() => expect(screen.getByTestId('accept-draft-subtasks')).toHaveTextContent('Add 1 subtask'));
  });

  it('allows generated fields to be edited and submits the edited values', async () => {
    mockedStreamSubtasks.mockReturnValue(createStream([
      { type: 'subtask', subtask: { title: 'Original title', description: 'Original description' } },
    ]));
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: /generate subtask/i }));

    const title = await screen.findByDisplayValue('Original title');
    await user.clear(title);
    await user.type(title, 'Edited title');
    await user.click(screen.getByTestId('accept-draft-subtasks'));

    await waitFor(() => expect(mockedSaveSubtasks).toHaveBeenCalledWith('task-1', [
      expect.objectContaining({ title: 'Edited title', description: 'Original description' }),
    ]));
  });

  it('removes a generated field', async () => {
    mockedStreamSubtasks.mockReturnValue(createStream([
      { type: 'subtask', subtask: { title: 'First' } },
      { type: 'subtask', subtask: { title: 'Second' } },
    ]));
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: /generate subtask/i }));
    await waitFor(() => expect(screen.getAllByTestId('draft-subtask')).toHaveLength(2));

    await user.click(screen.getAllByRole('button', { name: 'Remove draft subtask' })[0]);
    await waitFor(() => expect(screen.getAllByTestId('draft-subtask')).toHaveLength(1));
    expect(screen.getByDisplayValue('Second')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('First')).not.toBeInTheDocument();
  });

  it('discards generated fields and returns to idle', async () => {
    mockedStreamSubtasks.mockReturnValue(createStream([
      { type: 'subtask', subtask: { title: 'Draft' } },
    ]));
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: /generate subtask/i }));
    await screen.findByDisplayValue('Draft');

    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.queryByDisplayValue('Draft')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate subtask/i })).toBeInTheDocument();
  });

  it('shows an error when generation fails before producing drafts', async () => {
    mockedStreamSubtasks.mockImplementation(() => (async function* () {
      throw new AiUnavailableError('AI failed');
    })());
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: /generate subtask/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.queryByTestId('draft-subtask')).not.toBeInTheDocument();
  });

  it('keeps already streamed fields when a later stream error occurs', async () => {
    mockedStreamSubtasks.mockReturnValue(createStream([
      { type: 'subtask', subtask: { title: 'Partial draft' } },
      { type: 'error', error: { success: false, status: 503, code: 'AI_UNAVAILABLE', message: 'AI unavailable' } },
    ]));
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: /generate subtask/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Partial draft')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
