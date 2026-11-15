import { AiClientStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';

/**
 * Generic HTTP streaming protocol consumed by the frontend.
 * Feature-specific meaning is carried by the event data, not by event names.
 */
export type AiStreamClientEvent = AiClientStreamEvent;
