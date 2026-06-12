import { Task } from "@/features/tasks/tasks.types";
import { create } from "zustand";

const initialState = {
  generateSubtaskForTask: null,
  activeSubtaskId: null,
  draftSubtask: null,
  subtasks: [],
};

type SubtaskState = {
  generateSubtaskForTask: string | null;
  activeSubtaskId: string | null;
  draftSubtask: string | null;
  generatedSubtasks: Task[];

  setActiveSubtaskId: (id: string) => void;
  resetActiveSubtaskId: () => void;

  setGeneratedSubtasks: (parentTaskId: string, tasks: Task[]) => void;
  updateSubtask: (id: string, data: Partial<Task>) => void;
  deleteSubtask: (id: string) => void;

  setDraftSubtask: (title: string | null) => void;

  resetActiveSubtask: () => void;
  reset: () => void;
};

export const useSubtaskStore = create<SubtaskState>((set) => ({
  generateSubtaskForTask: null,
  activeSubtaskId: null,
  generatedSubtasks: [],
  draftSubtask: null,

  setActiveSubtaskId: (id) =>
    set({
      activeSubtaskId: id,
    }),
  resetActiveSubtaskId: () =>
    set({
      activeSubtaskId: null,
    }),

  setGeneratedSubtasks: (parentTaskId: string, subtasks: Task[]) =>
    set({
      generateSubtaskForTask: parentTaskId,
      generatedSubtasks: [...subtasks],
    }),
  updateSubtask: (id: string, data: Partial<Task>) =>
    set((state) => ({
      generatedSubtasks: state.generatedSubtasks.map((subtask) =>
        subtask.id === id ? { ...subtask, ...data } : subtask,
      ),
    })),
  deleteSubtask: (id: string) =>
    set((state) => ({
      generatedSubtasks: state.generatedSubtasks.filter(
        (subtask) => subtask.id !== id,
      ),
    })),

  setDraftSubtask: (draftSubtask: string | null) =>
    set({
      draftSubtask,
    }),

  reset: () => set(initialState),
  resetActiveSubtask: () =>
    set((state) => ({ ...state, activeSubtaskId: null, draftSubtask: null })),
}));
