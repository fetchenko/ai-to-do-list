import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { SubtaskStreamEvent } from '@/shared/types/stream-event.types';

export function toClientEvent(event: AiStreamEvent): SubtaskStreamEvent {
  if (event.type === 'done') {
    return { type: 'done' };
  }

  return event;
}
