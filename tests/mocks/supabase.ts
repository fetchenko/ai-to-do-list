export const mockSupabase = {
  from: () => ({
    select: () => ({
      data: [{ id: 1, name: "Test" }],
      error: null,
    }),
  }),
};
