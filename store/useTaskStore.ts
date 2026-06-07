import { create } from "zustand";

type TaskState = {
  editingTaskId: string | null;

  startEditing: (id: string) => void;
  stopEditing: () => void;
};

export const useTaskStore = create<TaskState>((set, get) => ({
  editingTaskId: null,

  startEditing: (id) =>
    set({
      editingTaskId: id,
    }),
  stopEditing: () =>
    set({
      editingTaskId: null,
    }),
}));
