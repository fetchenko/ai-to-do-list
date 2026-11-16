import { SubtaskResponse } from '@/features/tasks/types/subtasks.schema';
import { StreamEvent } from '@/shared/types/stream-event.types';

export type SubtaskStreamEvent = StreamEvent<SubtaskResponse>;
