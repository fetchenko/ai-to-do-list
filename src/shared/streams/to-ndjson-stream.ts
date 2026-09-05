export function toNdjsonStream<T>(
  events: AsyncIterable<T>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
