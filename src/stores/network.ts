import { create } from "zustand";

interface NetworkState {
  isConnected: boolean;
  isReachable: boolean;
  setStatus: (status: { isConnected: boolean; isReachable: boolean }) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  isReachable: true,
  setStatus: ({ isConnected, isReachable }) => set({ isConnected, isReachable }),
}));

export function isOnline(): boolean {
  const { isConnected, isReachable } = useNetworkStore.getState();
  return isConnected && isReachable;
}
