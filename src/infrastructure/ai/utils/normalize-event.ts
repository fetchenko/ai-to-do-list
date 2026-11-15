import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { AiStreamClientEvent } from '@/shared/types/stream-event.types';

export function toClientEvent(event: AiStreamEvent): AiStreamClientEvent {
  if (event.type === 'done') return { type: 'done' };
  return event;
}
