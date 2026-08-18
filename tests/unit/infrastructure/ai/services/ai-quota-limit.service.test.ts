import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkAiQuotaLimit } from '@/infrastructure/ai/services/ai-quota-limit.service';
import { AiRequestLimitError } from '@/shared/errors/app-error';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
}));

vi.mock('@/infrastructure/supabase/admin', () => ({
  supabaseAdmin: {
    from: mocks.from,
  },
}));

describe('checkAiQuotaLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.from.mockReturnValue({
      select: mocks.select,
    });

    mocks.select.mockReturnValue({
      eq: mocks.eq,
    });

    mocks.eq.mockReturnValue({
      eq: mocks.eq,
    });
  });

  it('allows the request when the user is below the quota', async () => {
    mocks.eq.mockReturnValueOnce({
      eq: mocks.eq,
    });

    mocks.eq.mockReturnValueOnce({
      eq: mocks.eq,
    });

    mocks.eq.mockResolvedValue({
      count: 19,
    });

    await expect(checkAiQuotaLimit('user-1', 20)).resolves.toBeUndefined();

    expect(mocks.from).toHaveBeenCalledWith('ai_generations');
  });

  it('throws when the user has reached the quota', async () => {
    mocks.eq.mockReturnValueOnce({
      eq: mocks.eq,
    });

    mocks.eq.mockReturnValueOnce({
      eq: mocks.eq,
    });

    mocks.eq.mockResolvedValue({
      count: 20,
    });

    await expect(checkAiQuotaLimit('user-1', 20)).rejects.toBeInstanceOf(
      AiRequestLimitError
    );
  });

  it('allows the request when there are no successful generations', async () => {
    mocks.eq.mockReturnValueOnce({
      eq: mocks.eq,
    });

    mocks.eq.mockReturnValueOnce({
      eq: mocks.eq,
    });

    mocks.eq.mockResolvedValue({
      count: null,
    });

    await expect(checkAiQuotaLimit('user-1', 20)).resolves.toBeUndefined();
  });
});
