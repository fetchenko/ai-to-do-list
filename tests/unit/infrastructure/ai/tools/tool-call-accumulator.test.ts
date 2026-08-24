import { describe, expect, it } from 'vitest';

import { ToolCallAccumulator } from '@/infrastructure/ai/tools/tool-call-accumulator';

describe('ToolCallAccumulator', () => {
  it('starts accumulating a tool call', () => {
    const accumulator = new ToolCallAccumulator();

    const result = accumulator.add({
      index: 0,
      id: 'call_0',
      function: {
        name: 'create_subtask',
        arguments: '{"title":"Buy',
      },
    });

    expect(result).toEqual({
      type: 'accumulating',
    });
  });

  it('accumulates argument fragments', () => {
    const accumulator = new ToolCallAccumulator();

    accumulator.add({
      index: 0,
      id: 'call_0',
      function: {
        name: 'create_subtask',
        arguments: '{"title":"Buy',
      },
    });

    accumulator.add({
      index: 0,
      function: {
        arguments: ' a mobile phone"}',
      },
    });

    const result = accumulator.finish();

    expect(result).toEqual({
      type: 'completed',
      toolCall: {
        index: 0,
        id: 'call_0',
        name: 'create_subtask',
        arguments: '{"title":"Buy a mobile phone"}',
      },
    });
  });

  it('preserves id and name from the initial fragment', () => {
    const accumulator = new ToolCallAccumulator();

    accumulator.add({
      index: 0,
      id: 'call_0',
      function: {
        name: 'create_subtask',
        arguments: '{',
      },
    });

    const result = accumulator.finish();

    expect(result).toEqual({
      type: 'completed',
      toolCall: {
        index: 0,
        id: 'call_0',
        name: 'create_subtask',
        arguments: '{',
      },
    });
  });

  it('handles id and name arriving in later fragments', () => {
    const accumulator = new ToolCallAccumulator();

    accumulator.add({
      index: 0,
      function: {
        arguments: '{',
      },
    });

    accumulator.add({
      index: 0,
      id: 'call_0',
      function: {
        name: 'create_subtask',
        arguments: '"title":"Buy phone"}',
      },
    });

    const result = accumulator.finish();

    expect(result).toEqual({
      type: 'completed',
      toolCall: {
        index: 0,
        id: 'call_0',
        name: 'create_subtask',
        arguments: '{"title":"Buy phone"}',
      },
    });
  });

  it('completes the current call when the index changes', () => {
    const accumulator = new ToolCallAccumulator();

    accumulator.add({
      index: 0,
      id: 'call_0',
      function: {
        name: 'create_subtask',
        arguments: '{"title":"First"}',
      },
    });

    const result = accumulator.add({
      index: 1,
      id: 'call_1',
      function: {
        name: 'create_subtask',
        arguments: '{"title":"Second"}',
      },
    });

    expect(result).toEqual({
      type: 'completed',
      toolCall: {
        index: 0,
        id: 'call_0',
        name: 'create_subtask',
        arguments: '{"title":"First"}',
      },
    });
  });

  it('starts accumulating the next call after the index changes', () => {
    const accumulator = new ToolCallAccumulator();

    accumulator.add({
      index: 0,
      id: 'call_0',
      function: {
        name: 'create_subtask',
        arguments: '{"title":"First"}',
      },
    });

    accumulator.add({
      index: 1,
      id: 'call_1',
      function: {
        name: 'create_subtask',
        arguments: '{"title":"Second',
      },
    });

    accumulator.add({
      index: 1,
      function: {
        arguments: '"}',
      },
    });

    const result = accumulator.finish();

    expect(result).toEqual({
      type: 'completed',
      toolCall: {
        index: 1,
        id: 'call_1',
        name: 'create_subtask',
        arguments: '{"title":"Second"}',
      },
    });
  });

  it('finishes the current tool call', () => {
    const accumulator = new ToolCallAccumulator();

    accumulator.add({
      index: 0,
      id: 'call_0',
      function: {
        name: 'create_subtask',
        arguments: '{"title":"Buy phone"}',
      },
    });

    expect(accumulator.finish()).toEqual({
      type: 'completed',
      toolCall: {
        index: 0,
        id: 'call_0',
        name: 'create_subtask',
        arguments: '{"title":"Buy phone"}',
      },
    });
  });

  it('clears the current tool call after finishing', () => {
    const accumulator = new ToolCallAccumulator();

    accumulator.add({
      index: 0,
      id: 'call_0',
      function: {
        name: 'create_subtask',
        arguments: '{}',
      },
    });

    accumulator.finish();

    expect(accumulator.finish()).toEqual({
      type: 'accumulating',
    });
  });

  it('returns accumulating when finishing without an active call', () => {
    const accumulator = new ToolCallAccumulator();

    expect(accumulator.finish()).toEqual({
      type: 'accumulating',
    });
  });

  it('ignores missing optional fields in subsequent fragments', () => {
    const accumulator = new ToolCallAccumulator();

    accumulator.add({
      index: 0,
      id: 'call_0',
      function: {
        name: 'create_subtask',
        arguments: '{"title":"Buy',
      },
    });

    accumulator.add({
      index: 0,
      function: {
        arguments: ' phone"}',
      },
    });

    expect(accumulator.finish()).toEqual({
      type: 'completed',
      toolCall: {
        index: 0,
        id: 'call_0',
        name: 'create_subtask',
        arguments: '{"title":"Buy phone"}',
      },
    });
  });
});
