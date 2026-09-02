import { describe, expect, it, vi } from 'vitest';

import { AiGenerationLogResource } from '@/infrastructure/ai/generations/ai-generation-log-resource';
import {
  cancelAiGenerationLog,
  completeAiGenerationLog,
  failAiGenerationLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import { AI_GENERATION_CANCEL_CODES } from '@/shared/errors/code';

vi.mock('@/infrastructure/ai/services/ai-log.admin.service', () => ({
  cancelAiGenerationLog: vi.fn(),
  completeAiGenerationLog: vi.fn(),
  failAiGenerationLog: vi.fn(),
}));

describe('AiGenerationLogResource', () => {
  it('exposes the generation log id', () => {
    expect(new AiGenerationLogResource('log-1').id).toBe('log-1');
  });

  it('maps completion to the log service', async () => {
    const resource = new AiGenerationLogResource('log-1');
    const input = { metadata: {} as never, response: 'raw response' };

    await resource.complete(input);

    expect(completeAiGenerationLog).toHaveBeenCalledWith({
      id: 'log-1',
      ...input,
    });
  });

  it('maps failure to the log service', async () => {
    const resource = new AiGenerationLogResource('log-1');

    await resource.fail({ code: 'AI_GENERATION_FAILED' });

    expect(failAiGenerationLog).toHaveBeenCalledWith({
      id: 'log-1',
      errorCode: 'AI_GENERATION_FAILED',
    });
  });

  it('maps cancellation reason to the log service error code', async () => {
    const resource = new AiGenerationLogResource('log-1');

    await resource.cancel('client_disconnect');

    expect(cancelAiGenerationLog).toHaveBeenCalledWith({
      id: 'log-1',
      errorCode: AI_GENERATION_CANCEL_CODES.client_disconnect,
    });
  });
});
