export async function* readJsonStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
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

    buffer += decoder.decode();

    if (buffer.trim()) {
      yield JSON.parse(buffer);
    }
  } finally {
    reader.releaseLock();
  }
}
