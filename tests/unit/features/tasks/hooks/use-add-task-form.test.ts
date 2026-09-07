import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAddTaskForm } from '@/features/tasks/hooks/use-add-task-form';

describe('useAddTaskForm', () => {
  it('calls onAddTask with the entered values, then resets the form and closes the description panel', async () => {
    const onAddTask = vi.fn().mockResolvedValue({ id: 'task-1' });
    const { result } = renderHook(() => useAddTaskForm(onAddTask));

    act(() => {
      result.current.setValue('title', 'Buy oat milk');
      result.current.setIsDescriptionOpen(true);
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(onAddTask).toHaveBeenCalledTimes(1);
    expect(onAddTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Buy oat milk' })
    );
    expect(result.current.getValues('title')).toBe('');
    expect(result.current.isDescriptionOpen).toBe(false);
  });

  it('does NOT reset the form when the submission fails, so the person does not have to retype it', async () => {
    const onAddTask = vi.fn().mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useAddTaskForm(onAddTask));

    act(() => {
      result.current.setValue('title', 'Buy oat milk');
    });

    // The old implementation had no try/catch around `await onAddTask(...)`,
    // so a rejection here would propagate out of onSubmit as an unhandled
    // rejection. This assertion is the regression test for that fix: the
    // call below must resolve, not throw.
    await expect(
      act(async () => {
        await result.current.onSubmit();
      })
    ).resolves.not.toThrow();

    expect(onAddTask).toHaveBeenCalledTimes(1);
    expect(result.current.getValues('title')).toBe('Buy oat milk');
  });

  it('does not call onAddTask when the title fails zod validation', async () => {
    const onAddTask = vi.fn();
    // react-hook-form's `formState` is a lazily-subscribing proxy: a field
    // only triggers re-renders once something reads it *during* render.
    // AddTaskForm does this naturally via `const { formState: { errors } } =
    // useAddTaskForm(...)`; renderHook needs to mimic that explicitly, or
    // result.current.formState.errors will silently stay stale after submit.
    const { result } = renderHook(() => {
      const form = useAddTaskForm(onAddTask);
      void form.formState.errors;
      return form;
    });

    // taskSchema requires title.min(5); default value is ''.
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(onAddTask).not.toHaveBeenCalled();
    expect(result.current.formState.errors.title?.message).toBe(
      'Title must be at least 5 characters'
    );
  });

  it('starts with the description panel closed', () => {
    const { result } = renderHook(() => useAddTaskForm(vi.fn()));

    expect(result.current.isDescriptionOpen).toBe(false);
  });
});
