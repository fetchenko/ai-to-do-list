export function neighborsAtIndex<T extends { position: string }>(
  items: T[],
  insertIndex: number
) {
  return {
    prev: items[insertIndex - 1]?.position ?? null,
    next: items[insertIndex]?.position ?? null,
  };
}
