import { AiStreamChunk } from '@/infrastructure/ai/types/ai-stream.types';

export async function* readJsonStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<AiStreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        yield JSON.parse(line);
      }
    }

    // Handle the final line when the response doesn't end with "\n".
    if (buffer.trim()) {
      yield JSON.parse(buffer);
    }
  } finally {
    reader.releaseLock();
  }
}
