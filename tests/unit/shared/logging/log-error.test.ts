import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { logError } from '@/shared/logging/log-error';

describe('logError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs error causes and context without logging arbitrary error details', () => {
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cause = new Error('Connection refused');
    const error = new AppError(
      ErrorCode.AI_UNAVAILABLE,
      503,
      'AI provider unavailable',
      { authorization: 'Bearer secret-token' },
      cause
    );

    logError(error, {
      source: 'ai',
      operation: 'generate-subtasks',
      provider: 'DeepSeekProvider',
    });

    expect(logger).toHaveBeenCalledOnce();

    const entry = logger.mock.calls[0][0] as {
      errorCode: string;
      source: string;
      operation: string;
      provider: string;
      error: {
        name: string;
        message: string;
        cause: { name: string; message: string };
      };
    };

    expect(entry).toMatchObject({
      errorCode: ErrorCode.AI_UNAVAILABLE,
      source: 'ai',
      operation: 'generate-subtasks',
      provider: 'DeepSeekProvider',
      error: {
        name: 'AppError',
        message: 'AI provider unavailable',
        cause: {
          name: 'Error',
          message: 'Connection refused',
        },
      },
    });

    expect(JSON.stringify(entry)).not.toContain('secret-token');
  });

  it('logs non-Error thrown values without serializing their contents', () => {
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError({ token: 'secret-token' }, {
      source: 'api',
      operation: 'generate-subtasks',
    });

    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        error: {
          name: 'NonErrorThrown',
          message: 'A non-Error value was thrown',
        },
      })
    );
    expect(JSON.stringify(logger.mock.calls[0])).not.toContain('secret-token');
  });
});
