import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export function getHttpStatusCode(code: ErrorCode) {
  return ErrorHttpStatus[code] || ErrorHttpStatus.AI_GENERATION_FAILED;
}
