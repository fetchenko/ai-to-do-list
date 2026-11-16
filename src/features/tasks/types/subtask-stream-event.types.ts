import { SubtaskResponse } from '@/shared/schema/subtasks.schema';
import { StreamEvent } from '@/shared/types/stream-event.types';

export type SubtaskStreamEvent = StreamEvent<SubtaskResponse>;
