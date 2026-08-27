const SSE_EVENT_SEPARATOR = /\r?\n\r?\n/;

function getSseData(event: string): string | null {
  const line = event.split(/\r?\n/).find((line) => line.startsWith('data:'));

  if (!line) {
    return null;
  }

  return line.slice('data:'.length).trim();
}

export async function* readSseStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<string> {
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

      const events = buffer.split(SSE_EVENT_SEPARATOR);

      buffer = events.pop() ?? '';

      for (const event of events) {
        const data = getSseData(event);

        if (data !== null) {
          yield data;
        }
      }
    }

    // Flush TextDecoder
    buffer += decoder.decode();

    const data = getSseData(buffer);

    if (data !== null) {
      yield data;
    }
  } finally {
    reader.releaseLock();
  }
}
