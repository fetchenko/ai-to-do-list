import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DraftSubtasks } from '@/features/tasks/components/forms/draft-subtasks';
import { useSubtaskDraftsStream } from '@/features/tasks/hooks/use-subtask-drafts-stream';
import { useAddSubtasks } from '@/features/tasks/hooks/use-add-subtasks';
import type { AiTask, Task } from '@/features/tasks/types/tasks.types';
import { AiUnavailableError, ValidationRequestError } from '@/shared/errors/app-error';

vi.mock('@/features/tasks/hooks/use-subtask-drafts-stream', () => ({
  useSubtaskDraftsStream: vi.fn(),
}));

vi.mock('@/features/tasks/hooks/use-add-subtasks', () => ({
  useAddSubtasks: vi.fn(),
}));

const mockedUseSubtaskDraftsStream = vi.mocked(useSubtaskDraftsStream);
const mockedUseAddSubtasks = vi.mocked(useAddSubtasks);

const task: Task = {
  id: 'task-1',
  title: 'Create feature',
} as Task;

const mockGenerate = vi.fn();
const mockRetry = vi.fn();
const mockDiscard = vi.fn();
const mockSaveSubtasks = vi.fn().mockResolvedValue([]);

let onSubtask: ((draft: AiTask) => void) | undefined;

function configureHook(
  overrides: Partial<{
    error: Error | null;
    isGenerating: boolean;
  }> = {}
) {
  mockedUseSubtaskDraftsStream.mockImplementation((_taskId, callback) => {
    onSubtask = callback;

    return {
      error: null,
      isGenerating: false,
      generate: mockGenerate,
      retry: mockRetry,
      discard: mockDiscard,
      ...overrides,
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
    onSubtask = undefined;
    mockedUseAddSubtasks.mockReturnValue({
      saveSubtasks: mockSaveSubtasks,
      isSaving: false,
    });
    configureHook();
  });

  it('passes task id and onSubtask callback to useSubtaskDraftsStream', () => {
    renderComponent();

    expect(mockedUseSubtaskDraftsStream).toHaveBeenCalledWith(
      task.id,
      expect.any(Function)
    );
    expect(onSubtask).toEqual(expect.any(Function));
  });

  it('renders the idle state', () => {
    renderComponent();

    expect(
      screen.getByRole('button', { name: 'Generate Subtask' })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('accept-draft-subtasks')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
  });

  it('calls generate when Generate Subtask is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Generate Subtask' }));

    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('shows a focused status region while generating', () => {
    configureHook({ isGenerating: true });
    renderComponent();

    expect(screen.getByRole('status')).toHaveTextContent('Generating…');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByRole('button', { name: 'Generate Subtask' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('adds a streamed subtask to the React Hook Form field array', async () => {
    renderComponent();

    await act(async () => {
      onSubtask?.({
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
      onSubtask?.({ id: '1', title: 'Research hotels', description: 'Compare locations' });
      onSubtask?.({ id: '2', title: 'Book flights', description: 'Check flight options' });
      onSubtask?.({ id: '3', title: 'Plan transport', description: 'Compare options' });
    });

    expect(screen.getAllByTestId('draft-subtask')).toHaveLength(3);
    expect(screen.getByDisplayValue('Research hotels')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Book flights')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Plan transport')).toBeInTheDocument();
    expect(screen.getByTestId('accept-draft-subtasks')).toHaveTextContent('Add 3 subtasks');
  });

  it('allows a streamed field to be edited', async () => {
    renderComponent();

    await act(async () => {
      onSubtask?.({ id: '1', title: 'Original title', description: 'Original description' });
    });

    const user = userEvent.setup();
    const title = screen.getByDisplayValue('Original title');
    await user.clear(title);
    await user.type(title, 'Edited title');

    expect(screen.getByDisplayValue('Edited title')).toBeInTheDocument();
  });

  it('removes a streamed field', async () => {
    renderComponent();

    await act(async () => {
      onSubtask?.({ id: '1', title: 'First' });
      onSubtask?.({ id: '2', title: 'Second' });
    });

    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Remove draft subtask' })[0]);

    await waitFor(() => {
      expect(screen.getAllByTestId('draft-subtask')).toHaveLength(1);
    });
    expect(screen.getByDisplayValue('Second')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('First')).not.toBeInTheDocument();
  });

  it('saves the current form fields', async () => {
    renderComponent();

    await act(async () => {
      onSubtask?.({ id: '1', title: 'Original title', description: 'Description' });
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('accept-draft-subtasks'));

    await waitFor(() => {
      expect(mockSaveSubtasks).toHaveBeenCalledWith([
        expect.objectContaining({ title: 'Original title', description: 'Description' }),
      ]);
    });
    expect(mockDiscard).toHaveBeenCalledTimes(1);
  });

  it('discards generated fields', async () => {
    renderComponent();

    await act(async () => {
      onSubtask?.({ id: '1', title: 'Draft' });
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(mockDiscard).toHaveBeenCalledTimes(1);
  });

  it('renders the generation error state', () => {
    configureHook({ error: new AiUnavailableError('AI unavailable') });
    renderComponent();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText("Couldn't generate subtasks")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('calls retry from a retryable error', async () => {
    configureHook({ error: new AiUnavailableError('AI unavailable') });
    renderComponent();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }));

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry for a non-retryable error', () => {
    configureHook({ error: new ValidationRequestError({}) });
    renderComponent();

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('keeps streamed fields when a later generation error occurs', async () => {
    configureHook({ error: new AiUnavailableError('AI unavailable') });
    renderComponent();

    await act(async () => {
      onSubtask?.({ id: '1', title: 'Partial draft' });
    });

    expect(screen.getByDisplayValue('Partial draft')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('disables the save action while saving', async () => {
    mockedUseAddSubtasks.mockReturnValue({
      saveSubtasks: mockSaveSubtasks,
      isSaving: true,
    });
    renderComponent();

    await act(async () => {
      onSubtask?.({ id: '1', title: 'Draft' });
    });

    expect(screen.getByTestId('accept-draft-subtasks')).toBeDisabled();
  });
});
