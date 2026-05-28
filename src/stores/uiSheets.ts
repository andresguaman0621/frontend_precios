import { create } from "zustand";

interface UiSheetsState {
  profileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  toggleProfile: () => void;
}

export const useUiSheets = create<UiSheetsState>((set) => ({
  profileOpen: false,
  openProfile: () => set({ profileOpen: true }),
  closeProfile: () => set({ profileOpen: false }),
  toggleProfile: () => set((s) => ({ profileOpen: !s.profileOpen })),
}));
