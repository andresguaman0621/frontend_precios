import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

import { useNetworkStore } from "@/stores/network";

export function useNetwork() {
  const { isConnected, isReachable } = useNetworkStore();
  return { isConnected, isReachable, isOnline: isConnected && isReachable };
}

let unsub: (() => void) | null = null;

export function startNetworkWatcher(onOnline?: () => void): () => void {
  if (unsub) return unsub;
  const setStatus = useNetworkStore.getState().setStatus;

  // Estado inicial
  NetInfo.fetch().then((state) => {
    setStatus({
      isConnected: state.isConnected ?? false,
      isReachable: state.isInternetReachable ?? false,
    });
  });

  let prevOnline = false;
  unsub = NetInfo.addEventListener((state) => {
    const isConnected = state.isConnected ?? false;
    const isReachable = state.isInternetReachable ?? false;
    const nowOnline = isConnected && isReachable;
    setStatus({ isConnected, isReachable });
    if (nowOnline && !prevOnline) {
      onOnline?.();
    }
    prevOnline = nowOnline;
  });

  return unsub;
}

export function useNetworkWatcher(onOnline?: () => void): void {
  useEffect(() => {
    const stop = startNetworkWatcher(onOnline);
    return () => {
      stop();
      unsub = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
