import { create } from "zustand";

export type ToastTone = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  duration: number;
}

interface ToastState {
  items: ToastItem[];
  show: (msg: string, tone?: ToastTone, durationMs?: number) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  show: (message, tone = "info", durationMs = 3000) => {
    const id = `toast-${++counter}`;
    set((state) => ({ items: [...state.items, { id, message, tone, duration: durationMs }] }));
    setTimeout(() => {
      get().dismiss(id);
    }, durationMs);
  },
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  clear: () => set({ items: [] }),
}));

export const toast = {
  info: (msg: string, duration?: number) => useToastStore.getState().show(msg, "info", duration),
  success: (msg: string, duration?: number) =>
    useToastStore.getState().show(msg, "success", duration),
  warning: (msg: string, duration?: number) =>
    useToastStore.getState().show(msg, "warning", duration),
  error: (msg: string, duration?: number) => useToastStore.getState().show(msg, "error", duration),
};
