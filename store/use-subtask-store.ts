import { Task } from "@/features/tasks/tasks.types";
import { create } from "zustand";

const initialState = {
  activeParentTaskId: null,
  activeSubtaskId: null,
  draftSubtask: null,
  subtasks: [],
};

type SubtaskState = {
  activeParentTaskId: string | null;
  activeSubtaskId: string | null;
  draftSubtask: string | null;
  subtasks: Task[];

  setActiveParentTaskId: (id: string) => void;
  resetActiveParentTaskId: () => void;

  setActiveSubtaskId: (id: string) => void;
  resetActiveSubtaskId: () => void;

  setSubtasks: (tasks: Task[]) => void;
  updateSubtask: (id: string, data: Partial<Task>) => void;
  deleteSubtask: (id: string) => void;

  setDraftSubtask: (title: string | null) => void;

  resetActiveSubtask: () => void;
  reset: () => void;
};

export const useSubtaskStore = create<SubtaskState>((set, get) => ({
  activeParentTaskId: null,
  activeSubtaskId: null,
  subtasks: [],
  draftSubtask: null,

  setActiveParentTaskId: (id) =>
    set({
      activeParentTaskId: id,
    }),
  resetActiveParentTaskId: () =>
    set({
      activeParentTaskId: null,
    }),
  setActiveSubtaskId: (id) =>
    set({
      activeSubtaskId: id,
    }),
  resetActiveSubtaskId: () =>
    set({
      activeSubtaskId: null,
    }),

  setSubtasks: (subtasks: Task[]) =>
    set({
      subtasks: [...subtasks],
    }),
  updateSubtask: (id: string, data: Partial<Task>) =>
    set((state) => ({
      subtasks: state.subtasks.map((subtask) =>
        subtask.id === id ? { ...subtask, ...data } : subtask,
      ),
    })),
  deleteSubtask: (id: string) =>
    set((state) => ({
      subtasks: state.subtasks.filter((subtask) => subtask.id !== id),
    })),

  setDraftSubtask: (draftSubtask: string | null) =>
    set({
      draftSubtask,
    }),

  reset: () => set(initialState),
  resetActiveSubtask: () =>
    set((state) => ({ ...state, activeSubtaskId: null, draftSubtask: null })),
}));
