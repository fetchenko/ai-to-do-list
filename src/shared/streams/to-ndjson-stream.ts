export function toNdjsonStream<T, R = T>(
  events: AsyncIterable<T>,
  mapEvent: (event: T) => R = (event) => event as unknown as R
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(
            encoder.encode(`${JSON.stringify(mapEvent(event))}\n`)
          );
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
