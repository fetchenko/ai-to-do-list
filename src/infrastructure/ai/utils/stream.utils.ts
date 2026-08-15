export async function* readStreamLines(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
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

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          yield trimmed;
        }
      }
    }

    buffer += decoder.decode();
    const trimmed = buffer.trim();

    if (trimmed) {
      yield trimmed;
    }
  } finally {
    reader.releaseLock();
  }
}
