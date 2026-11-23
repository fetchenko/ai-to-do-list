import { ErrorCode } from '@/shared/errors/code';

import { ClientError } from './client-error';

const ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.INVALID_REQUEST]:
    "That request wasn't valid. Please check your input.",
  [ErrorCode.AUTHORIZATION_ERROR]: "You're not authorized to do that.",
  [ErrorCode.UNAUTHORIZED]: 'Please sign in to continue.',
  [ErrorCode.FORBIDDEN]: "You don't have permission to do that.",
  [ErrorCode.DATABASE_ERROR]:
    'We had trouble saving your changes. Please try again.',
  [ErrorCode.INVALID_RESPONSE]:
    'Something went wrong on our end. Please try again.',
  [ErrorCode.AI_LOCK_ACTIVE]:
    'AI is generating a response. Please wait and try again later.',
  [ErrorCode.AI_LOCK_REQUEST_FAILED]:
    "Couldn't check generation status. Please try again.",
  [ErrorCode.AI_GENERATION_TIMEOUT]:
    'Generating subtasks took too long. Please try again.',
  [ErrorCode.AI_RATE_LIMIT]:
    'Lots of generations happening right now — try again in a moment.',
  [ErrorCode.AI_GENERATION_FAILED]:
    "We couldn't generate subtasks. Please try again.",
  [ErrorCode.AI_REQUEST_ERROR]:
    "We couldn't complete the AI request. Please try again.",
  [ErrorCode.AI_GENERATION_SERVER_SHUTDOWN]:
    'Generation was interrupted. Please try again.',
  [ErrorCode.AI_STREAM_ENDED_WITHOUT_TERMINAL_EVENT]:
    'Generation ended unexpectedly. Please try again.',
  [ErrorCode.AI_UNAVAILABLE]: 'Subtask generation is temporarily unavailable.',
  [ErrorCode.AI_INVALID_RESPONSE_FORMAT]:
    "We couldn't process the response. Please try again.",
  [ErrorCode.AI_EMPTY_RESPONSE]:
    'No subtasks could be generated. Try rewording the task.',
  [ErrorCode.AI_REQUEST_LIMIT]: "You've reached your AI request limit for now.",
  [ErrorCode.NETWORK_ERROR]:
    'Network error — check your connection and try again.',
  [ErrorCode.INTERNAL_SERVER_ERROR]:
    'Something went wrong on our end. Please try again.',
  [ErrorCode.UNKNOWN]: 'Something went wrong. Please try again.',
};

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ClientError) {
    return ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES[ErrorCode.UNKNOWN];
  }

  if (error instanceof TypeError) {
    return ERROR_MESSAGES[ErrorCode.NETWORK_ERROR];
  }

  return ERROR_MESSAGES[ErrorCode.UNKNOWN];
}
