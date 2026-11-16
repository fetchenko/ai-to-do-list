import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { StreamEvent } from '@/shared/types/stream-event.types';

export function toClientEvent(event: AiStreamEvent): StreamEvent {
  if (event.type === 'done') return { type: 'done' };
  return event;
}
