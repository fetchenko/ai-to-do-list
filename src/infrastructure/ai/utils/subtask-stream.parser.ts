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
  private arrayClosed = false;
  private objectStart = -1;
  private objectDepth = 0;
  private inString = false;
  private escaped = false;

  push(chunk: string): StreamedSubtask[] {
    if (!chunk) return [];
    this.buffer += chunk;

    if (!this.arrayStarted) {
      const arrayStart = this.findSubtasksArray();
      if (arrayStart === -1) return [];

      this.arrayStarted = true;
      this.cursor = arrayStart + 1;
    }

    if (this.arrayClosed) return [];

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
          this.arrayClosed = true;
          this.cursor += 1;
          break;
        }
        continue;
      }

      if (this.inString) {
        if (this.escaped) this.escaped = false;
        else if (char === '\\') this.escaped = true;
        else if (char === '"') this.inString = false;
        continue;
      }

      if (char === '"') {
        this.inString = true;
        continue;
      }

      if (char === '{') this.objectDepth += 1;
      else if (char === '}') this.objectDepth -= 1;

      if (this.objectDepth < 0) {
        throw new Error('Invalid streamed subtask JSON');
      }

      if (this.objectDepth === 0) {
        const rawObject = this.buffer.slice(this.objectStart, this.cursor + 1);

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

    return subtasks;
  }

  finish(): void {
    if (!this.arrayStarted) {
      throw new Error('AI stream did not contain a subtasks array');
    }

    if (
      !this.arrayClosed ||
      this.objectStart !== -1 ||
      this.inString ||
      this.escaped
    ) {
      throw new Error('AI stream ended with incomplete JSON');
    }
  }

  private findSubtasksArray(): number {
    let inString = false;
    let escaped = false;

    for (let index = 0; index < this.buffer.length; index += 1) {
      const char = this.buffer[index];

      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }

      if (char !== '"') continue;

      const keyEnd = this.buffer.indexOf('"', index + 1);
      if (keyEnd === -1) return -1;

      const key = this.buffer.slice(index + 1, keyEnd);
      if (key !== 'subtasks') {
        index = keyEnd;
        continue;
      }

      let cursor = keyEnd + 1;
      while (/\s/.test(this.buffer[cursor] ?? '')) cursor += 1;

      if (this.buffer[cursor] !== ':') {
        index = keyEnd;
        continue;
      }

      cursor += 1;
      while (/\s/.test(this.buffer[cursor] ?? '')) cursor += 1;

      return this.buffer[cursor] === '[' ? cursor : -1;
    }

    return -1;
  }
}
