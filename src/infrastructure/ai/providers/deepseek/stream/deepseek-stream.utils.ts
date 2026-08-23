import { DeepSeekStreamChunk } from '@/infrastructure/ai/providers/deepseek/stream/deepseek-stream.types';

export async function* readDeepSeekStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<DeepSeekStreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');

      buffer = events.pop() ?? '';

      for (const event of events) {
        const line = event.split('\n').find((line) => line.startsWith('data:'));

        if (!line) {
          continue;
        }

        const data = line.slice('data:'.length).trim();

        if (data === '[DONE]') {
          return;
        }

        yield JSON.parse(data) as DeepSeekStreamChunk;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
