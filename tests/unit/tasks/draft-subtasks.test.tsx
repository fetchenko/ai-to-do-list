import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import type { Task } from '@/features/tasks/types/tasks.types';
import { AiUnavailableError } from '@/shared/errors/app-error';

vi.mock('@/features/tasks/hooks/use-add-subtasks', () => ({
  useAddSubtasks: () => ({
    saveSubtasks: vi.fn(),
    isSaving: false,
  }),
}));

import { DraftSubtasks } from '@/features/tasks/components/forms/draft-subtasks';

const task: Task = {
  id: 'task-1',
  title: 'Create feature',
} as Task;

describe('DraftSubtasks', () => {
  it('renders AI generation error state', () => {
    render(
      <DraftSubtasks
        task={task}
        drafts={[]}
        error={new AiUnavailableError('AI unavailable')}
        loading={false}
        onRetry={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('alert'),
    )
      .toBeInTheDocument();


    expect(
      screen.getByText(
        "Couldn't generate subtasks",
      ),
    )
      .toBeInTheDocument();
  });


  it('calls retry from error state', async () => {
    const user = userEvent.setup();

    const onRetry = vi.fn();


    render(
      <DraftSubtasks
        task={task}
        drafts={[]}
        error={new AiUnavailableError('AI unavailable')}
        loading={false}
        onRetry={onRetry}
        onDiscard={vi.fn()}
      />,
    );


    await user.click(
      screen.getByRole('button', {
        name: 'Retry',
      }),
    );


    expect(onRetry)
      .toHaveBeenCalledTimes(1);
  });


  it('shows loading skeleton while generating', () => {
    render(
      <DraftSubtasks
        task={task}
        drafts={[]}
        error={null}
        loading
        onRetry={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('alert'),
    ).not.toBeInTheDocument();
  });
});
