import { create } from 'zustand';

const initialState = {
  editingTaskId: null,
};

type TaskState = {
  editingTaskId: string | null;

  setEditingTaskId: (id: string) => void;
  reset: () => void;
};

export const useTaskStore = create<TaskState>((set) => ({
  editingTaskId: null,

  setEditingTaskId: (id) =>
    set({
      editingTaskId: id,
    }),
  reset: () => set(initialState),
}));
