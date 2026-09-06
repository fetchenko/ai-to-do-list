export const API_ROUTES = {
  generateSubtasks: (taskId: string) =>
    `/api/tasks/${taskId}/subtasks/generate`,
  streamSubtasks: (taskId: string) => `/api/tasks/${taskId}/subtasks/stream`,
};
