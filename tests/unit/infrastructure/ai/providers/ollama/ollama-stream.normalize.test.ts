import { collect as collectStream } from '@tests/utils/collect';
import { describe, expect, it } from 'vitest';

import { normalizeOllamaStream } from '@/infrastructure/ai/providers/ollama/ollama-stream.normalize';
import {
  AiGenerationError,
  AiInvalidResponseFormat,
} from '@/shared/errors/app-error';

function createStream(chunks: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`${JSON.stringify(chunk)}\n`));
      }
      controller.close();
    },
  });
}

describe('normalizeOllamaStream', () => {
  it('normalizes a tool call and completion', async () => {
    const body = createStream([
      {
        model: 'qwen3:8b',
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              id: 'call_0',
              function: {
                index: 0,
                name: 'create_subtask',
                arguments: {
                  title: 'Buy groceries',
                  description: 'Buy groceries from the store',
                },
              },
            },
          ],
        },
        done: false,
      },
      {
        model: 'qwen3:8b',
        message: { role: 'assistant', content: '' },
        done: true,
        done_reason: 'stop',
        prompt_eval_count: 143,
        eval_count: 22,
      },
    ]);

    await expect(collectStream(normalizeOllamaStream(body))).resolves.toEqual([
      {
        type: 'tool_call',
        toolCall: {
          index: 0,
          id: 'call_0',
          name: 'create_subtask',
          arguments:
            '{"title":"Buy groceries","description":"Buy groceries from the store"}',
        },
      },
      {
        type: 'done',
        metadata: expect.objectContaining({
          model: 'qwen3:8b',
          response:
            '[{"title":"Buy groceries","description":"Buy groceries from the store"}]',
          finishReason: 'stop',
          usage: expect.objectContaining({
            inputTokens: 143,
            outputTokens: 22,
            totalTokens: 165,
          }),
        }),
      },
    ]);
  });

  it('normalizes streamed content and completion metadata', async () => {
    const body = createStream([
      {
        model: 'qwen3:8b',
        message: { role: 'assistant', content: 'Hello' },
        done: false,
      },
      {
        model: 'qwen3:8b',
        message: { role: 'assistant', content: ' world' },
        done: false,
      },
      {
        model: 'qwen3:8b',
        message: { role: 'assistant', content: '' },
        done: true,
        done_reason: 'stop',
        prompt_eval_count: 514,
        eval_count: 451,
      },
    ]);

    await expect(collectStream(normalizeOllamaStream(body))).resolves.toEqual([
      {
        type: 'done',
        metadata: expect.objectContaining({
          model: 'qwen3:8b',
          response: '[]',
          finishReason: 'stop',
          usage: expect.objectContaining({
            inputTokens: 514,
            outputTokens: 451,
            totalTokens: 965,
          }),
        }),
      },
    ]);
  });

  it('throws an AI generation error when Ollama reports a stream error', async () => {
    const body = createStream([
      { error: 'model is unavailable', model: 'qwen3', done: false },
    ]);

    await expect(collectStream(normalizeOllamaStream(body))).rejects.toEqual(
      new AiGenerationError('Ollama stream error: model is unavailable')
    );
  });

  it('throws when the stream ends without a completion chunk', async () => {
    const body = createStream([
      {
        model: 'qwen3:8b',
        message: { role: 'assistant', content: 'partial' },
        done: false,
      },
    ]);

    await expect(collectStream(normalizeOllamaStream(body))).rejects.toEqual(
      new AiInvalidResponseFormat('Ollama stream ended unexpectedly')
    );
  });
});
