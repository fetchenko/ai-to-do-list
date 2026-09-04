import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cancelAiGenerationLog,
  completeAiGenerationLog,
  failAiGenerationLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  from: vi.fn(),
  mapAiGenerationMetadataToUpdate: vi.fn(),
}));

vi.mock('@/infrastructure/supabase/admin', () => ({
  supabaseAdmin: { from: mocks.from },
}));
vi.mock('@/infrastructure/ai/utils/map-ai-generation-usage', () => ({
  mapAiGenerationMetadataToUpdate: mocks.mapAiGenerationMetadataToUpdate,
}));

function setupUpdate() {
  const query = {
    update: mocks.update,
    eq: vi.fn(),
  };
  mocks.from.mockReturnValue(query);
  mocks.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.eq.mockReturnValueOnce(query).mockReturnValueOnce(Promise.resolve({ error: null }));
  return query;
}

describe('ai-log.admin.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mapAiGenerationMetadataToUpdate.mockReturnValue({
      model: 'test',
      response: '[{"title":"Test"}]',
    });
  });

  it('persists completion metadata including the response', async () => {
    const query = setupUpdate();
    const metadata = { response: '[{"title":"Test"}]' } as never;

    await completeAiGenerationLog({ id: 'generation-1', metadata });

    expect(mocks.from).toHaveBeenCalledWith('ai_generations');
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      response: '[{"title":"Test"}]',
      model: 'test',
    }));
    expect(query.eq).toHaveBeenCalledWith('id', 'generation-1');
    expect(query.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('persists failure code and terminal status', async () => {
    const query = setupUpdate();

    await failAiGenerationLog({ id: 'generation-1', errorCode: 'AI_GENERATION_FAILED' });

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failed',
      error_code: 'AI_GENERATION_FAILED',
    }));
    expect(query.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('persists cancellation code and terminal status', async () => {
    const query = setupUpdate();

    await cancelAiGenerationLog({ id: 'generation-1', errorCode: 'AI_GENERATION_TIMEOUT' });

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'cancelled',
      error_code: 'AI_GENERATION_TIMEOUT',
    }));
    expect(query.eq).toHaveBeenCalledWith('status', 'pending');
  });
});
