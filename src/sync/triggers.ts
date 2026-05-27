/**
 * Triggers automáticos del SyncManager:
 * - AppState change a 'active'
 * - NetInfo connected → reachable
 * - Timer cada 60s mientras la app esté abierta y haya pendientes
 */

import { AppState, type AppStateStatus } from "react-native";

import * as pricesRepo from "@/db/repos/prices";

import { SyncManager } from "./SyncManager";

const PERIODIC_INTERVAL_MS = 60_000;

let appStateSub: ReturnType<typeof AppState.addEventListener> | null = null;
let periodicTimer: ReturnType<typeof setInterval> | null = null;

export function startSyncTriggers(): () => void {
  if (appStateSub) return () => {};

  const onAppStateChange = (state: AppStateStatus) => {
    if (state === "active") {
      void SyncManager.maybeFlush();
    }
  };
  appStateSub = AppState.addEventListener("change", onAppStateChange);

  periodicTimer = setInterval(async () => {
    try {
      const pending = await pricesRepo.countPendingTotal();
      if (pending > 0) {
        void SyncManager.maybeFlush();
      }
    } catch {
      // BD aún no inicializada
    }
  }, PERIODIC_INTERVAL_MS);

  return () => {
    appStateSub?.remove();
    appStateSub = null;
    if (periodicTimer) {
      clearInterval(periodicTimer);
      periodicTimer = null;
    }
  };
}
