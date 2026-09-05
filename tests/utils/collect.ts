export async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];

  for await (const value of iterable) {
    result.push(value);
  }

  return result;
}
