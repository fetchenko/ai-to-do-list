import { describe, expect, it } from 'vitest';
import { SubtaskStreamParser } from './subtask-stream.parser';

const response = (subtasks: unknown[]) =>
  JSON.stringify({
    task_summary: 'Build a todo app',
    subtasks,
  });

describe('SubtaskStreamParser', () => {
  it('parses subtasks when the stream is split at arbitrary boundaries', () => {
    const parser = new SubtaskStreamParser();
    const json = response([
      { title: 'Create project directory', description: 'Initialize the project.' },
      { title: 'Install dependencies', description: 'Run npm install.' },
    ]);

    const chunks = [
      json.slice(0, 5),
      json.slice(5, 15),
      json.slice(15, 37),
      json.slice(37, 58),
      json.slice(58),
    ];

    const subtasks = chunks.flatMap((chunk) => parser.push(chunk));
    parser.finish();

    expect(subtasks).toEqual([
      { title: 'Create project directory', description: 'Initialize the project.' },
      { title: 'Install dependencies', description: 'Run npm install.' },
    ]);
  });

  it('handles escaped quotes and braces inside strings', () => {
    const parser = new SubtaskStreamParser();
    const chunks = [
      '{"task_summary":"Build app","subtasks":[{"title":"Handle \\\"quoted\\\" text","description":"Use { and } safely"}]}' ,
    ];

    const subtasks = chunks.flatMap((chunk) => parser.push(chunk));
    parser.finish();

    expect(subtasks).toEqual([
      {
        title: 'Handle "quoted" text',
        description: 'Use { and } safely',
      },
    ]);
  });

  it('returns multiple completed subtasks from one chunk', () => {
    const parser = new SubtaskStreamParser();

    const subtasks = parser.push(
      response([
        { title: 'One' },
        { title: 'Two', description: 'Second' },
        { title: 'Three' },
      ])
    );

    parser.finish();

    expect(subtasks).toEqual([
      { title: 'One' },
      { title: 'Two', description: 'Second' },
      { title: 'Three' },
    ]);
  });

  it('waits for a complete object before emitting it', () => {
    const parser = new SubtaskStreamParser();

    expect(parser.push('{"subtasks":[{"title":"First"')).toEqual([]);
    expect(parser.push(',"description":"Description"}')).toEqual([
      { title: 'First', description: 'Description' },
    ]);
    expect(parser.push(']}')).toEqual([]);

    parser.finish();
  });

  it('throws when the stream does not contain a subtasks array', () => {
    const parser = new SubtaskStreamParser();

    parser.push('{"task_summary":"Build app"}');

    expect(() => parser.finish()).toThrow(
      'AI stream did not contain a subtasks array'
    );
  });

  it('throws when the stream ends before the subtasks array closes', () => {
    const parser = new SubtaskStreamParser();

    parser.push('{"subtasks":[{"title":"First"}');

    expect(() => parser.finish()).toThrow(
      'AI stream ended with incomplete JSON'
    );
  });

  it('throws for an invalid streamed subtask', () => {
    const parser = new SubtaskStreamParser();

    expect(() =>
      parser.push('{"subtasks":[{"description":"Missing title"}]}')
    ).toThrow('Invalid streamed subtask format');
  });
});
