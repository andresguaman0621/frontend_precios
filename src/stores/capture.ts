import { create } from "zustand";

interface CaptureState {
  scrollOffset: number;
  search: string;
  category: string | null;
  setScrollOffset: (offset: number) => void;
  setSearch: (value: string) => void;
  setCategory: (value: string | null) => void;
  reset: () => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  scrollOffset: 0,
  search: "",
  category: null,
  setScrollOffset: (scrollOffset) => set({ scrollOffset }),
  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
  reset: () => set({ scrollOffset: 0, search: "", category: null }),
}));
