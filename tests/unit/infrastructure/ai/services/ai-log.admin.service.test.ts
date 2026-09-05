import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cancelAiGenerationLog,
  completeAiGenerationLog,
  createAiGenerationLog,
  failAiGenerationLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  mapAiGenerationMetadataToUpdate: vi.fn(),
}));

vi.mock('@/infrastructure/supabase/admin', () => ({
  supabaseAdmin: { from: mocks.from },
}));
vi.mock('@/infrastructure/ai/utils/map-ai-generation-usage', () => ({
  mapAiGenerationMetadataToUpdate: mocks.mapAiGenerationMetadataToUpdate,
}));

function setupUpdate(error: unknown = null) {
  const query = {
    update: mocks.update,
    eq: vi.fn(),
  };
  mocks.from.mockReturnValue(query);
  mocks.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.eq.mockReturnValueOnce(query).mockReturnValueOnce(Promise.resolve({ error }));
  return query;
}

function setupInsert(data: { id: string } | null = { id: 'generation-1' }, error: unknown = null) {
  const query = {
    insert: mocks.insert,
    select: vi.fn(),
    single: vi.fn(),
  };
  mocks.from.mockReturnValue(query);
  mocks.insert.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.single.mockResolvedValue({ data, error });
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

  it('creates a pending generation log', async () => {
    setupInsert();

    await expect(
      createAiGenerationLog({
        userId: 'user-1',
        taskId: 'task-1',
        feature: 'generate-subtasks',
      })
    ).resolves.toBe('generation-1');

    expect(mocks.from).toHaveBeenCalledWith('ai_generations');
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        task_id: 'task-1',
        feature: 'generate-subtasks',
        status: 'pending',
        started_at: expect.any(String),
      })
    );
  });

  it('throws when generation log creation fails', async () => {
    const error = new Error('insert failed');
    setupInsert(null, error);

    await expect(
      createAiGenerationLog({
        userId: 'user-1',
        taskId: 'task-1',
        feature: 'generate-subtasks',
      })
    ).rejects.toBe(error);
  });

  it('persists completion metadata including the response', async () => {
    const query = setupUpdate();
    const metadata = { response: '[{"title":"Test"}]' } as never;

    await completeAiGenerationLog({ id: 'generation-1', metadata });

    expect(mocks.from).toHaveBeenCalledWith('ai_generations');
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        response: '[{"title":"Test"}]',
        model: 'test',
      })
    );
    expect(query.eq).toHaveBeenCalledWith('id', 'generation-1');
    expect(query.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('throws when completion persistence fails', async () => {
    const error = new Error('update failed');
    setupUpdate(error);

    await expect(
      completeAiGenerationLog({ id: 'generation-1', metadata: {} as never })
    ).rejects.toBe(error);
  });

  it('persists failure code and terminal status', async () => {
    const query = setupUpdate();

    await failAiGenerationLog({ id: 'generation-1', errorCode: 'AI_GENERATION_FAILED' });

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error_code: 'AI_GENERATION_FAILED',
      })
    );
    expect(query.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('throws when failure persistence fails', async () => {
    const error = new Error('update failed');
    setupUpdate(error);

    await expect(
      failAiGenerationLog({ id: 'generation-1', errorCode: 'AI_GENERATION_FAILED' })
    ).rejects.toBe(error);
  });

  it('persists cancellation code and terminal status', async () => {
    const query = setupUpdate();

    await cancelAiGenerationLog({ id: 'generation-1', errorCode: 'AI_GENERATION_TIMEOUT' });

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'cancelled',
        error_code: 'AI_GENERATION_TIMEOUT',
      })
    );
    expect(query.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('throws when cancellation persistence fails', async () => {
    const error = new Error('update failed');
    setupUpdate(error);

    await expect(
      cancelAiGenerationLog({ id: 'generation-1', errorCode: 'AI_GENERATION_TIMEOUT' })
    ).rejects.toBe(error);
  });
});
