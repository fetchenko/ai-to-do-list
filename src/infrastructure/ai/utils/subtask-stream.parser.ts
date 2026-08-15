import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';

export class SubtaskStreamParser {
  private buffer = '';
  private cursor = 0;
  private arrayStarted = false;
  private objectStart = -1;
  private objectDepth = 0;
  private inString = false;
  private escaped = false;

  push(chunk: string) {
    this.buffer += chunk;

    const subtasksStart = this.arrayStarted
      ? -1
      : this.buffer.indexOf('"subtasks"');

    if (subtasksStart >= 0) {
      const arrayStart = this.buffer.indexOf('[', subtasksStart);

      if (arrayStart >= 0) {
        this.arrayStarted = true;
        this.cursor = Math.max(this.cursor, arrayStart + 1);
      }
    }

    if (!this.arrayStarted) {
      return [];
    }

    const subtasks: Array<{
      title: string;
      description?: string;
    }> = [];

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
        const parsed = subtasksResponseSchema.shape.subtasks.element.safeParse(
          JSON.parse(rawObject)
        );

        if (parsed.success) {
          subtasks.push(parsed.data);
        } else {
          throw new Error('Invalid streamed subtask format');
        }

        this.objectStart = -1;
      }
    }

    if (this.objectStart === -1 && this.cursor > 8192) {
      this.buffer = this.buffer.slice(this.cursor);
      this.cursor = 0;
    }

    return subtasks;
  }
}
