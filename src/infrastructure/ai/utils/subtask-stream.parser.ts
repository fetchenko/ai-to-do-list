import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';

const subtaskSchema = subtasksResponseSchema.shape.subtasks.element;

export type StreamedSubtask = {
  title: string;
  description?: string;
};

export class SubtaskStreamParser {
  private buffer = '';
  private cursor = 0;
  private arrayStarted = false;
  private objectStart = -1;
  private objectDepth = 0;
  private inString = false;
  private escaped = false;

  push(chunk: string): StreamedSubtask[] {
    this.buffer += chunk;

    if (!this.arrayStarted) {
      const subtasksStart = this.buffer.indexOf('"subtasks"');

      if (subtasksStart >= 0) {
        const arrayStart = this.buffer.indexOf('[', subtasksStart);

        if (arrayStart >= 0) {
          this.arrayStarted = true;
          this.cursor = Math.max(this.cursor, arrayStart + 1);
        }
      }
    }

    if (!this.arrayStarted) {
      return [];
    }

    const subtasks: StreamedSubtask[] = [];

    for (; this.cursor < this.buffer.length; this.cursor += 1) {
      const char = this.buffer[this.cursor];

      if (this.objectStart === -1) {
        if (char === '{') {
          this.objectStart = this.cursor;
          this.objectDepth = 1;
          this.inString = false;
          this.escaped = false;
        } else if (char === ']') {
          break;
        }
        continue;
      }

      if (this.inString) {
        if (this.escaped) {
          this.escaped = false;
        } else if (char === '\\') {
          this.escaped = true;
        } else if (char === '"') {
          this.inString = false;
        }
        continue;
      }

      if (char === '"') {
        this.inString = true;
        continue;
      }

      if (char === '{') {
        this.objectDepth += 1;
      } else if (char === '}') {
        this.objectDepth -= 1;
      }

      if (this.objectDepth === 0) {
        const rawObject = this.buffer.slice(
          this.objectStart,
          this.cursor + 1
        );

        let parsedObject: unknown;

        try {
          parsedObject = JSON.parse(rawObject);
        } catch {
          throw new Error('Invalid streamed subtask JSON');
        }

        const parsed = subtaskSchema.safeParse(parsedObject);

        if (!parsed.success) {
          throw new Error('Invalid streamed subtask format');
        }

        subtasks.push(parsed.data);
        this.objectStart = -1;
      }
    }

    if (this.objectStart === -1 && this.cursor > 8192) {
      this.buffer = this.buffer.slice(this.cursor);
      this.cursor = 0;
    }

    return subtasks;
  }

  finish(): void {
    if (!this.arrayStarted) {
      throw new Error('AI stream did not contain a subtasks array');
    }

    if (this.objectStart !== -1 || this.inString) {
      throw new Error('AI stream ended with incomplete JSON');
    }
  }
}
