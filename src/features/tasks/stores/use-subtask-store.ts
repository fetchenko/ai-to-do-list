import { AiTask, TaskUpdate } from "@/features/tasks/types/tasks.types";
import { create } from "zustand";

const initialState = {
  generateSubtaskForTask: null,
  activeSubtaskId: null,
  draftSubtask: null,
  generatedSubtasks: [],
};

type SubtaskState = {
  generateSubtaskForTask: string | null;
  activeSubtaskId: string | null;
  draftSubtask: string | null;
  generatedSubtasks: AiTask[];

  setActiveSubtaskId: (id: string) => void;
  resetActiveSubtaskId: () => void;

  setGeneratedSubtasksForTask: (parentTaskId: string | null) => void;
  setGeneratedSubtasks: (parentTaskId: string, tasks: AiTask[]) => void;
  updateSubtask: (id: string, data: TaskUpdate) => void;
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

  setGeneratedSubtasksForTask: (parentTaskId: string | null) =>
    set({
      generateSubtaskForTask: parentTaskId,
    }),
  setGeneratedSubtasks: (parentTaskId: string, subtasks: AiTask[]) =>
    set({
      generateSubtaskForTask: parentTaskId,
      generatedSubtasks: [...subtasks],
    }),
  updateSubtask: (id: string, data: TaskUpdate) =>
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
