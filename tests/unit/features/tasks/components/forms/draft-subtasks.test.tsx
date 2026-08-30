import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DraftSubtasks } from '@/features/tasks/components/forms/draft-subtasks';
import { useSubtaskDraftsStream } from '@/features/tasks/hooks/use-subtask-drafts-stream';
import type { AiTask, Task } from '@/features/tasks/types/tasks.types';
import { AiUnavailableError } from '@/shared/errors/app-error';

vi.mock('@/features/tasks/hooks/use-subtask-drafts-stream', () => ({
  useSubtaskDraftsStream: vi.fn(),
}));
vi.mock('@/features/tasks/hooks/use-add-subtasks', () => ({
  useAddSubtasks: vi.fn(() => ({ saveSubtasks: vi.fn().mockResolvedValue([]), isSaving: false })),
}));
vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));

const mockedUseSubtaskDraftsStream = vi.mocked(useSubtaskDraftsStream);

const task: Task = {
  id: 'task-1', title: 'Plan a trip', description: null,
  completedAt: null, createdAt: null, deletedAt: null, dueDate: null,
  parentTaskId: null, position: 'a0', priority: null, status: 'active',
  updatedAt: null, userId: 'user-1',
};

const mockGenerate = vi.fn();
const mockRetry = vi.fn();
const mockDiscard = vi.fn();

let streamedSubtaskHandler: ((draft: AiTask) => void) | undefined;
let hookState: {
  error: Error | null;
  isGenerating: boolean;
  isComplete: boolean;
};

function configureHook(overrides: Partial<typeof hookState> = {}) {
  hookState = {
    error: null,
    isGenerating: false,
    isComplete: false,
    ...overrides,
  };

  mockedUseSubtaskDraftsStream.mockImplementation((_taskId, onSubtask) => {
    streamedSubtaskHandler = onSubtask;
    return {
      drafts: [],
      error: hookState.error,
      isGenerating: hookState.isGenerating,
      isComplete: hookState.isComplete,
      generate: mockGenerate,
      retry: mockRetry,
      discard: mockDiscard,
    };
  });
}

function renderComponent() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <DraftSubtasks task={task} />
    </QueryClientProvider>
  );
}

describe('DraftSubtasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamedSubtaskHandler = undefined;
    configureHook();
  });

  it('renders the idle state', () => {
    renderComponent();

    expect(screen.getByRole('button', { name: /generate subtask/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('accept-draft-subtasks')).not.toBeInTheDocument();
    expect(screen.queryByText(/AI-generated — tap any field/i)).not.toBeInTheDocument();
  });

  it('passes the task id and callback to useSubtaskDraftsStream', () => {
    renderComponent();

    expect(mockedUseSubtaskDraftsStream).toHaveBeenCalledWith(
      'task-1',
      expect.any(Function)
    );
    expect(streamedSubtaskHandler).toEqual(expect.any(Function));
  });

  it('calls generate after resetting the form when Generate Subtask is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: /generate subtask/i }));

    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('shows the generating state while generation is pending', () => {
    configureHook({ isGenerating: true });
    renderComponent();

    expect(screen.getByText('Generating…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate subtask/i })).not.toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('adds a streamed subtask to the React Hook Form field array through onSubtask', async () => {
    renderComponent();

    await act(async () => {
      streamedSubtaskHandler?.({
        id: 'generated-1',
        title: 'Research hotels',
        description: 'Compare locations',
      });
    });

    expect(screen.getByDisplayValue('Research hotels')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Compare locations')).toBeInTheDocument();
    expect(screen.getByText(/AI-generated — tap any field/i)).toBeInTheDocument();
    expect(screen.getByTestId('accept-draft-subtasks')).toHaveTextContent('Add 1 subtask');
  });

  it('adds every streamed subtask as a separate form field', async () => {
    renderComponent();

    await act(async () => {
      streamedSubtaskHandler?.({ id: '1', title: 'Research hotels', description: 'Compare locations' });
      streamedSubtaskHandler?.({ id: '2', title: 'Book flights', description: 'Check flight options' });
      streamedSubtaskHandler?.({ id: '3', title: 'Plan transport', description: 'Compare options' });
    });

    expect(screen.getAllByTestId('draft-subtask')).toHaveLength(3);
    expect(screen.getByDisplayValue('Research hotels')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Book flights')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Plan transport')).toBeInTheDocument();
    expect(screen.getByTestId('accept-draft-subtasks')).toHaveTextContent('Add 3 subtasks');
  });

  it('allows generated fields to be edited and submits the edited values', async () => {
    const saveSubtasks = vi.fn().mockResolvedValue([]);
    const { useAddSubtasks } = await import('@/features/tasks/hooks/use-add-subtasks');
    vi.mocked(useAddSubtasks).mockReturnValue({ saveSubtasks, isSaving: false });

    renderComponent();
    await act(async () => {
      streamedSubtaskHandler?.({ id: 'generated-1', title: 'Original title', description: 'Original description' });
    });

    const user = userEvent.setup();
    const title = screen.getByDisplayValue('Original title');
    await user.clear(title);
    await user.type(title, 'Edited title');
    await user.click(screen.getByTestId('accept-draft-subtasks'));

    await waitFor(() => expect(saveSubtasks).toHaveBeenCalledWith([
      expect.objectContaining({ title: 'Edited title', description: 'Original description' }),
    ]));
    expect(mockDiscard).toHaveBeenCalledTimes(1);
  });

  it('removes a generated field', async () => {
    renderComponent();
    await act(async () => {
      streamedSubtaskHandler?.({ id: '1', title: 'First' });
      streamedSubtaskHandler?.({ id: '2', title: 'Second' });
    });

    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Remove draft subtask' })[0]);

    await waitFor(() => expect(screen.getAllByTestId('draft-subtask')).toHaveLength(1));
    expect(screen.getByDisplayValue('Second')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('First')).not.toBeInTheDocument();
  });

  it('discards generated fields and calls the stream discard handler', async () => {
    renderComponent();
    await act(async () => {
      streamedSubtaskHandler?.({ id: '1', title: 'Draft' });
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(mockDiscard).toHaveBeenCalledTimes(1);
  });

  it('shows an error and exposes retry/dismiss actions', () => {
    configureHook({ error: new AiUnavailableError('AI unavailable') });
    renderComponent();

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls retry from the generation error action', async () => {
    configureHook({ error: new AiUnavailableError('AI unavailable') });
    renderComponent();

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await userEvent.setup().click(retryButton);

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('calls discard from the generation error dismiss action', async () => {
    configureHook({ error: new AiUnavailableError('AI unavailable') });
    renderComponent();

    const dismissButton = screen.getByRole('button', { name: /dismiss|close/i });
    await userEvent.setup().click(dismissButton);

    expect(mockDiscard).toHaveBeenCalledTimes(1);
  });

  it('keeps streamed form fields visible when the hook reports a later error', async () => {
    configureHook({ error: new AiUnavailableError('AI unavailable') });
    renderComponent();

    await act(async () => {
      streamedSubtaskHandler?.({ id: '1', title: 'Partial draft' });
    });

    expect(screen.getByDisplayValue('Partial draft')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
