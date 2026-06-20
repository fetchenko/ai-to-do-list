export function mockFetchOnce(data: unknown, ok = true) {
  (fetch as any).mockResolvedValueOnce({
    ok,
    json: async () => data,
  });
}
