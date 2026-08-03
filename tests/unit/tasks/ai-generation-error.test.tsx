import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import { AiGenerationError } from '@/features/tasks/components/ai-generation-error';
import { DraftSubtasks } from '@/features/tasks/components/forms/draft-subtasks';
import { AiUnavailableError } from '@/shared/errors/app-error';
import { createTask } from '@tests/factories/task.factory';

describe('AiGenerationError', () => {
  it('renders error message', () => {
    render(
      <AiGenerationError
        message="AI service unavailable"
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Couldn't generate subtasks",
      ),
    )
      .toBeInTheDocument();


    expect(
      screen.getByText(
        'AI service unavailable',
      ),
    )
      .toBeInTheDocument();
  });


  it('calls retry handler', async () => {
    const user = userEvent.setup();

    const onRetry = vi.fn();


    render(
      <AiGenerationError
        message="Failed"
        onRetry={onRetry}
        onDismiss={vi.fn()}
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


  it('calls dismiss handler', async () => {
    const user = userEvent.setup();

    const onDismiss = vi.fn();


    render(
      <AiGenerationError
        message="Failed"
        onRetry={vi.fn()}
        onDismiss={onDismiss}
      />,
    );


    await user.click(
      screen.getByRole('button', {
        name: 'Dismiss',
      }),
    );


    expect(onDismiss)
      .toHaveBeenCalledTimes(1);
  });

  it('disables actions while retrying', () => {
    render(
      <AiGenerationError
        message="Retrying"
        retrying
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: /Retrying/,
      }),
    )
      .toBeDisabled();

    expect(
      screen.getByRole('button', {
        name: 'Dismiss',
      }),
    )
      .toBeDisabled();
  });

  it('has accessible alert role', () => {
    render(
      <AiGenerationError
        message="Failed"
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );


    expect(
      screen.getByRole('alert'),
    )
      .toBeInTheDocument();
  });

  it('does not call retry while retrying', async () => {
    const user = userEvent.setup();

    const onRetry = vi.fn();

    render(
      <AiGenerationError
        message="Failed"
        retrying
        onRetry={onRetry}
        onDismiss={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole('button', {
        name: /Retrying/,
      }),
    );

    expect(onRetry)
      .not
      .toHaveBeenCalled();
  });

  it('calls dismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();

    const onDiscard = vi.fn();

    const task = createTask({ id: '1', title: 'task 1' })

    render(
      <DraftSubtasks
        task={task}
        drafts={[]}
        error={new AiUnavailableError('AI unavailable')}
        loading={false}
        onRetry={vi.fn()}
        onDiscard={onDiscard}
      />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Dismiss',
      }),
    );

    expect(onDiscard)
      .toHaveBeenCalledTimes(1);
  });
});
