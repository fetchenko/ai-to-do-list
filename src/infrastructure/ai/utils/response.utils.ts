import {
  AiGenerationError,
  AiRateLimitsError,
  AiUnavailableError,
  ResponseFormatError,
} from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export async function parseResponseJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    const error = await response.text();
    const errorDetails = `Failed with error: ${error}, status: ${response.status} `;

    if (response.status === ErrorHttpStatus[ErrorCode.AI_RATE_LIMIT]) {
      throw new AiRateLimitsError(errorDetails);
    }
    if (response.status >= ErrorHttpStatus[ErrorCode.AI_UNAVAILABLE]) {
      throw new AiUnavailableError(errorDetails);
    }

    throw new AiGenerationError(errorDetails);
  }

  let body;

  try {
    body = await response.json();
  } catch (error) {
    throw new ResponseFormatError(`Failed to parse response: ${error}`);
  }

  return body;
}
