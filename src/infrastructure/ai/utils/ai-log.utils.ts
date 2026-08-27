import { AiErrorResult, AiLogs } from '@/infrastructure/ai/types/ai.types';

export function getInitialAiLog(userId: string, taskId: string) {
  return {
    task_id: taskId,
    user_id: userId,
    feature: 'generate-subtasks',
    status: 'pending',
    started_at: new Date().toISOString(),
  };
}

export function getSuccessAiLogs(aiLogUpdates: AiLogs, raw: string | null) {
  return {
    ...aiLogUpdates,
    response: raw,
    status: 'success',
    finished_at: new Date().toISOString(),
  };
}

export function getFailedAiLogs(error: Omit<AiErrorResult, 'status'>) {
  return {
    status: 'failed',
    finished_at: new Date().toISOString(),
    error_code: error.code,
  };
}
