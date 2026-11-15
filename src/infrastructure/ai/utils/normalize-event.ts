import {
  AiClientStreamEvent,
  AiStreamEvent,
} from '@/infrastructure/ai/types/ai-stream.types';

export function toClientEvent(event: AiStreamEvent): AiClientStreamEvent {
  if (event.type === 'done') return { type: 'done' };
  return event;
}
