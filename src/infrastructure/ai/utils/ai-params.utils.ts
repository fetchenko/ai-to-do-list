import {
  RequestGenSubtasks,
  requestGenSubtasksSchema,
} from '@/infrastructure/ai/schema/ai-request';
import { ValidationRequestError } from '@/shared/errors/app-error';

export async function parseAiParams(params: Promise<RequestGenSubtasks>) {
  const result = requestGenSubtasksSchema.safeParse(await params);

  if (!result.success) {
    throw new ValidationRequestError(
      result.error.issues[0]?.message ??
        'Invalid request payload, taskId is required'
    );
  }

  return result.data;
}
