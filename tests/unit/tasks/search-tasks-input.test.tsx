import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SearchTasksInput } from '@/features/tasks/components/search-tasks-input';

describe('SearchTasksInput', () => {
  it('renders as an accessible searchbox with the current value', () => {
    render(<SearchTasksInput value="milk" onChange={vi.fn()} />);

    const input = screen.getByRole('searchbox', { name: 'Search tasks' });
    expect(input).toHaveValue('milk');
  });

  it('calls onChange with each keystroke as the user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SearchTasksInput value="" onChange={onChange} />);
    await user.type(
      screen.getByRole('searchbox', { name: 'Search tasks' }),
      'milk'
    );

    // Uncontrolled-in-the-test rendering means onChange fires once per
    // keystroke, each with only that single character — the component
    // never merges them, that's the parent's job via controlled `value`.
    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange.mock.calls.map((call) => call[0])).toEqual([
      'm',
      'i',
      'l',
      'k',
    ]);
  });

  it('does not render a clear button when the value is empty', () => {
    render(<SearchTasksInput value="" onChange={vi.fn()} />);

    expect(
      screen.queryByRole('button', { name: 'Clear search' })
    ).not.toBeInTheDocument();
  });

  it('renders a clear button when the value is non-empty, and it clears the query on click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SearchTasksInput value="milk" onChange={onChange} />);

    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('');
  });
});
