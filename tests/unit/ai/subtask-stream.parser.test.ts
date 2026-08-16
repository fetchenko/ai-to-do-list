import { describe, expect, it } from 'vitest';

import { SubtaskStreamParser } from '@/infrastructure/ai/utils/subtask-stream.parser';

describe('SubtaskStreamParser', () => {
  it('emits complete subtasks from one chunk', () => {
    const parser = new SubtaskStreamParser();

    expect(
      parser.push('{"subtasks":[{"title":"One"},{"title":"Two","description":"Details"}]}')
    ).toEqual([
      { title: 'One' },
      { title: 'Two', description: 'Details' },
    ]);

    parser.finish();
  });

  it('handles arbitrary chunk boundaries', () => {
    const parser = new SubtaskStreamParser();
    const chunks = ['{"sub', 'tasks": [', '{"title":"On', 'e"},{"title":"Two"}', ']}'];
    const result = chunks.flatMap((chunk) => parser.push(chunk));

    expect(result).toEqual([{ title: 'One' }, { title: 'Two' }]);
    expect(() => parser.finish()).not.toThrow();
  });

  it('does not mistake braces or quotes inside strings for JSON structure', () => {
    const parser = new SubtaskStreamParser();

    const result = parser.push(
      '{"subtasks":[{"title":"Use {braces} and \\"quotes\\" safely"}]}'
    );

    expect(result).toEqual([
      { title: 'Use {braces} and "quotes" safely' },
    ]);
    parser.finish();
  });

  it('waits for an incomplete object before emitting it', () => {
    const parser = new SubtaskStreamParser();

    expect(parser.push('{"subtasks":[{"title":"One"')).toEqual([]);
    expect(parser.push('}]}')).toEqual([{ title: 'One' }]);
    expect(() => parser.finish()).not.toThrow();
  });

  it('ignores unrelated text before the response object', () => {
    const parser = new SubtaskStreamParser();

    expect(parser.push('Here is the result: {"subtasks": [{"title":"One"}]}')).toEqual([
      { title: 'One' },
    ]);
    parser.finish();
  });

  it('rejects invalid streamed subtask objects', () => {
    const parser = new SubtaskStreamParser();

    expect(() => parser.push('{"subtasks":[{"description":"missing title"}]}')).toThrow(
      'Invalid streamed subtask format'
    );
  });

  it('rejects an incomplete stream at finish', () => {
    const parser = new SubtaskStreamParser();
    parser.push('{"subtasks":[{"title":"One"}');

    expect(() => parser.finish()).toThrow('AI stream ended with incomplete JSON');
  });

  it('rejects a stream without a subtasks array', () => {
    const parser = new SubtaskStreamParser();
    parser.push('{"result":[]}');

    expect(() => parser.finish()).toThrow('AI stream did not contain a subtasks array');
  });

  it('accepts an empty, properly closed array so the caller can apply its own empty-response policy', () => {
    const parser = new SubtaskStreamParser();
    expect(parser.push('{"subtasks":[]}')).toEqual([]);
    expect(() => parser.finish()).not.toThrow();
  });
});
