import {
  AiGenerationError,
  AiRateLimitsError,
  AiUnavailableError,
  ResponseFormatError,
} from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export async function parseResponseJson(response: Response): Promise<unknown> {
  let body: unknown;

  try {
    body = await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new AiUnavailableError({ status: response.status });
    }
    throw new ResponseFormatError({ error });
  }

  if (!response.ok) {
    if (response.status === ErrorHttpStatus[ErrorCode.AI_RATE_LIMIT]) {
      throw new AiRateLimitsError(body);
    }
    if (response.status >= ErrorHttpStatus[ErrorCode.AI_UNAVAILABLE]) {
      throw new AiUnavailableError(body);
    }
    throw new AiGenerationError(body);
  }

  return body;
}
