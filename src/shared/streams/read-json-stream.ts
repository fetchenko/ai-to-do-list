export async function* readJsonStream<T>(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<T> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  let completed = false;

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

        yield JSON.parse(line) as T;
      }
    }

    if (buffer.trim()) {
      yield JSON.parse(buffer) as T;
    }

    completed = true;
  } finally {
    if (!completed) {
      await reader.cancel();
    }

    reader.releaseLock();
  }
}
