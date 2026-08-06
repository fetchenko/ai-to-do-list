import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import { AiGenerationError } from '@/features/tasks/components/ai-generation-error';

describe('AiGenerationError', () => {
  it('renders error message', () => {
    render(
      <AiGenerationError
        message="AI service unavailable"
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
        retryable
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
        retryable
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
        retryable={false}
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

  it('has accessible alert role', () => {
    render(
      <AiGenerationError
        message="Failed"
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
        retryable
      />,
    );


    expect(
      screen.getByRole('alert'),
    )
      .toBeInTheDocument();
  });
});
