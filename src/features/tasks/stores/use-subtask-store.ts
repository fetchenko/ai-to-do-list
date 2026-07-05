import { create } from 'zustand';

const initialState = {
  activeSubtaskId: null,
  draftSubtask: '',
};

type SubtaskState = {
  activeSubtaskId: string | null;
  draftSubtask: string;

  setActiveSubtaskId: (id: string) => void;
  resetActiveSubtaskId: () => void;
  setDraftSubtask: (title: string) => void;

  resetActiveSubtask: () => void;
  reset: () => void;
};

export const useSubtaskStore = create<SubtaskState>((set) => ({
  activeSubtaskId: null,
  draftSubtask: '',

  setActiveSubtaskId: (id) =>
    set({
      activeSubtaskId: id,
    }),
  resetActiveSubtaskId: () =>
    set({
      activeSubtaskId: null,
    }),
  setDraftSubtask: (draftSubtask) =>
    set({
      draftSubtask,
    }),

  reset: () => set(initialState),
  resetActiveSubtask: () =>
    set((state) => ({ ...state, activeSubtaskId: null, draftSubtask: '' })),
}));
