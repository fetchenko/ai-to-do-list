import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DraftSubtasks } from '@/features/tasks/components/forms/draft-subtasks-form';
import { useAddSubtasks } from '@/features/tasks/hooks/use-add-subtasks';
import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import type { AiGeneratedTask, Task } from '@/features/tasks/types/tasks.types';
import { AiUnavailableError } from '@/shared/errors/ai-app-error';
import { ValidationRequestError } from '@/shared/errors/app-error';

vi.mock('@/features/tasks/hooks/use-subtask-drafts', () => ({
  useSubtaskDrafts: vi.fn(),
}));

vi.mock('@/features/tasks/hooks/use-add-subtasks', () => ({
  useAddSubtasks: vi.fn(),
}));

const mockedUseSubtaskDrafts = vi.mocked(useSubtaskDrafts);
const mockedUseAddSubtasks = vi.mocked(useAddSubtasks);

const task: Task = {
  id: 'task-1',
  title: 'Create feature',
} as Task;

const mockGenerate = vi.fn();
const mockRetry = vi.fn();
const mockCancel = vi.fn();
const mockDiscard = vi.fn();
const mockSaveSubtasks = vi.fn().mockResolvedValue([]);

let onSubtask: ((draft: AiGeneratedTask) => void) | undefined;

function configureDraftHook(
  overrides: Partial<{
    error: Error | null;
    isGenerating: boolean;
  }> = {}
) {
  mockedUseSubtaskDrafts.mockImplementation((_taskId, callback) => {
    onSubtask = callback;

    return {
      error: null,
      isGenerating: false,
      generate: mockGenerate,
      retry: mockRetry,
      cancel: mockCancel,
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

async function streamSubtask(draft: Partial<AiGeneratedTask> = {}) {
  await act(async () => {
    onSubtask?.({
      id: 'generated-1',
      title: 'Generated subtask',
      description: 'Generated description',
      ...draft,
    });
  });
}

describe('DraftSubtasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onSubtask = undefined;

    mockedUseAddSubtasks.mockReturnValue({
      saveSubtasks: mockSaveSubtasks,
      isSaving: false,
    });

    configureDraftHook();
  });

  describe('idle state', () => {
    it('renders the generate button', () => {
      renderComponent();

      expect(
        screen.getByRole('button', { name: 'Generate Subtask' })
      ).toBeInTheDocument();

      expect(
        screen.queryByTestId('draft-subtasks-form')
      ).not.toBeInTheDocument();
    });

    it('generates subtasks when Generate Subtask is clicked', async () => {
      renderComponent();

      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: 'Generate Subtask' }));

      expect(mockGenerate).toHaveBeenCalledTimes(1);
    });

    it('disables Generate Subtask while saving', () => {
      mockedUseAddSubtasks.mockReturnValue({
        saveSubtasks: mockSaveSubtasks,
        isSaving: true,
      });

      renderComponent();

      expect(
        screen.getByRole('button', { name: 'Generate Subtask' })
      ).toBeDisabled();
    });
  });

  describe('generating state', () => {
    it('shows the generating status', () => {
      configureDraftHook({ isGenerating: true });
      renderComponent();

      expect(screen.getByRole('status')).toHaveTextContent('Generating…');
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('hides Generate Subtask while generating', () => {
      configureDraftHook({ isGenerating: true });
      renderComponent();

      expect(
        screen.queryByRole('button', { name: 'Generate Subtask' })
      ).not.toBeInTheDocument();
    });

    it('shows the generating state when no drafts have been streamed', () => {
      configureDraftHook({ isGenerating: true });
      renderComponent();

      expect(screen.getByRole('status')).toHaveTextContent('Generating…');
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('drafts', () => {
    it('renders a streamed subtask', async () => {
      renderComponent();

      await streamSubtask({
        title: 'Research hotels',
        description: 'Compare locations',
      });

      expect(screen.getByDisplayValue('Research hotels')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Compare locations')).toBeInTheDocument();

      expect(
        screen.getByText(/AI-generated — tap any field to edit/i)
      ).toBeInTheDocument();

      expect(screen.getByTestId('accept-draft-subtasks')).toHaveTextContent(
        'Add 1 subtask'
      );
    });

    it('renders multiple streamed subtasks', async () => {
      renderComponent();

      await act(async () => {
        onSubtask?.({
          id: '1',
          title: 'Research hotels',
          description: 'Compare locations',
        });

        onSubtask?.({
          id: '2',
          title: 'Book flights',
          description: 'Check flight options',
        });

        onSubtask?.({
          id: '3',
          title: 'Plan transport',
          description: 'Compare options',
        });
      });

      expect(screen.getAllByTestId('draft-subtask')).toHaveLength(3);

      expect(screen.getByDisplayValue('Research hotels')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Book flights')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Plan transport')).toBeInTheDocument();

      expect(screen.getByTestId('accept-draft-subtasks')).toHaveTextContent(
        'Add 3 subtasks'
      );
    });

    it('hides Generate Subtask when drafts exist', async () => {
      renderComponent();

      await streamSubtask();

      expect(
        screen.queryByRole('button', { name: 'Generate Subtask' })
      ).not.toBeInTheDocument();
    });

    it('allows a draft to be edited', async () => {
      renderComponent();

      await streamSubtask({
        title: 'Original title',
        description: 'Original description',
      });

      const user = userEvent.setup();
      const title = screen.getByDisplayValue('Original title');

      await user.clear(title);
      await user.type(title, 'Edited title');

      expect(screen.getByDisplayValue('Edited title')).toBeInTheDocument();
    });

    it('removes a draft', async () => {
      renderComponent();

      await act(async () => {
        onSubtask?.({ id: '1', title: 'First' });
        onSubtask?.({ id: '2', title: 'Second' });
      });

      const user = userEvent.setup();

      await user.click(
        screen.getAllByRole('button', {
          name: 'Remove draft subtask',
        })[0]
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('draft-subtask')).toHaveLength(1);
      });

      expect(screen.getByDisplayValue('Second')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('First')).not.toBeInTheDocument();
    });
  });

  describe('saving', () => {
    it('saves the current drafts', async () => {
      renderComponent();

      await streamSubtask({
        title: 'Research hotels',
        description: 'Compare locations',
      });

      await userEvent
        .setup()
        .click(screen.getByTestId('accept-draft-subtasks'));

      await waitFor(() => {
        expect(mockSaveSubtasks).toHaveBeenCalledWith([
          expect.objectContaining({
            title: 'Research hotels',
            description: 'Compare locations',
          }),
        ]);
      });
    });

    it('discards drafts after saving', async () => {
      renderComponent();

      await streamSubtask({ title: 'Draft' });

      await userEvent
        .setup()
        .click(screen.getByTestId('accept-draft-subtasks'));

      await waitFor(() => {
        expect(mockDiscard).toHaveBeenCalledTimes(1);
      });
    });

    it('shows Adding… while saving', async () => {
      mockedUseAddSubtasks.mockReturnValue({
        saveSubtasks: mockSaveSubtasks,
        isSaving: true,
      });

      renderComponent();

      await streamSubtask({ title: 'Draft' });

      const saveButton = screen.getByTestId('accept-draft-subtasks');

      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveTextContent('Adding…');
    });

    it('disables Discard while saving', async () => {
      mockedUseAddSubtasks.mockReturnValue({
        saveSubtasks: mockSaveSubtasks,
        isSaving: true,
      });

      renderComponent();

      await streamSubtask({ title: 'Draft' });

      expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
    });

    it('disables Discard while generating', async () => {
      configureDraftHook({ isGenerating: true });
      renderComponent();

      await streamSubtask({ title: 'Draft' });

      expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
    });

    it('disables the save action while generating', async () => {
      configureDraftHook({ isGenerating: true });
      renderComponent();

      await streamSubtask({ title: 'Draft' });

      expect(screen.getByTestId('accept-draft-subtasks')).toBeDisabled();
    });
  });

  describe('discarding', () => {
    it('discards drafts when Discard is clicked', async () => {
      renderComponent();

      await streamSubtask({ title: 'Draft' });

      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: 'Discard' }));

      expect(mockDiscard).toHaveBeenCalledTimes(1);
      expect(screen.queryByDisplayValue('Draft')).not.toBeInTheDocument();
    });
  });

  describe('errors', () => {
    it('renders a generation error', () => {
      configureDraftHook({
        error: new AiUnavailableError('AI unavailable'),
      });

      renderComponent();

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText("Couldn't generate subtasks")
      ).toBeInTheDocument();
    });

    it('shows Retry for a retryable error', () => {
      configureDraftHook({
        error: new AiUnavailableError('AI unavailable'),
      });

      renderComponent();

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('calls retry when Retry is clicked', async () => {
      configureDraftHook({
        error: new AiUnavailableError('AI unavailable'),
      });

      renderComponent();

      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: 'Retry' }));

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('hides Retry for a non-retryable error', () => {
      configureDraftHook({
        error: new ValidationRequestError({}),
      });

      renderComponent();

      expect(
        screen.queryByRole('button', { name: 'Retry' })
      ).not.toBeInTheDocument();
    });

    it('dismisses the error', async () => {
      configureDraftHook({
        error: new AiUnavailableError('AI unavailable'),
      });

      renderComponent();

      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: 'Dismiss' }));

      expect(mockDiscard).toHaveBeenCalledTimes(1);
    });

    it('keeps streamed drafts when an error occurs', async () => {
      configureDraftHook({
        error: new AiUnavailableError('AI unavailable'),
      });

      renderComponent();

      await streamSubtask({ title: 'Partial draft' });

      expect(screen.getByDisplayValue('Partial draft')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
