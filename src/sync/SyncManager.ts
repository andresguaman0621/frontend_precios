/**
 * Orquestador de sincronización. Funcionalidad completa se desarrolla en Fase 5.
 * En Fase 4 sólo necesitamos: enqueue() con debounce que dispara flush() cuando
 * hay red. Por ahora flush() llama al endpoint bulk.
 */

import * as pricesApi from "@/api/prices";
import * as catalogRepo from "@/db/repos/catalog";
import * as pricesRepo from "@/db/repos/prices";
import * as sessionsRepo from "@/db/repos/sessions";
import * as syncLogRepo from "@/db/repos/syncLog";
import * as sessionsApi from "@/api/sessions";
import { useNetworkStore } from "@/stores/network";
import { conflictResolver } from "./conflictResolver";

import type { PrecioBulkItem } from "@/schemas/api";

const FLUSH_DEBOUNCE_MS = 2000;
const BULK_CHUNK_SIZE = 200;
const MAX_ATTEMPTS = 5;

class _SyncManager {
  private isRunning = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: (() => void)[] = [];

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  enqueue(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.flush();
    }, FLUSH_DEBOUNCE_MS);
  }

  async maybeFlush(): Promise<void> {
    return this.flush();
  }

  async flush(force = false): Promise<void> {
    if (this.isRunning) return;
    const { isConnected, isReachable } = useNetworkStore.getState();
    if (!force && !(isConnected && isReachable)) return;
    this.isRunning = true;
    try {
      await this.syncPendingSessions();
      await this.syncPendingPrices();
    } finally {
      this.isRunning = false;
      this.notify();
    }
  }

  private async syncPendingSessions(): Promise<void> {
    const sessions = await sessionsRepo.listPendingSync();
    for (const s of sessions) {
      try {
        if (s.syncState === "pending_complete") {
          await sessionsApi.complete(s.id, {
            lat_fin: s.latFin?.toString() ?? null,
            lng_fin: s.lngFin?.toString() ?? null,
            accuracy_fin: s.accuracyFin,
            comentario_sesion: s.comentarioSesion,
          });
          await sessionsRepo.setSyncState(s.id, "synced");
          await sessionsRepo.setEstado(s.id, "COMPLETADA");
          await syncLogRepo.log("session_complete", "success", { sessionId: s.id });
        } else if (s.syncState === "pending_cancel") {
          await sessionsApi.cancel(s.id);
          await catalogRepo.deleteBySession(s.id);
          await pricesRepo.deleteBySession(s.id);
          await sessionsRepo.remove(s.id);
          await syncLogRepo.log("session_cancel", "success", { sessionId: s.id });
        }
      } catch (e) {
        await syncLogRepo.log("session_sync", "error", {
          sessionId: s.id,
          syncState: s.syncState,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  private async syncPendingPrices(): Promise<void> {
    const pending = await pricesRepo.listBySyncState("pending");
    if (pending.length === 0) return;

    const bySession = new Map<number, typeof pending>();
    for (const p of pending) {
      if (!bySession.has(p.sessionId)) bySession.set(p.sessionId, []);
      bySession.get(p.sessionId)!.push(p);
    }

    for (const [sessionId, items] of bySession.entries()) {
      // Saltar sesiones que aún no se sincronizan al servidor
      const sessionRow = await sessionsRepo.getById(sessionId);
      if (!sessionRow || sessionRow.syncState === "pending_create") continue;

      for (let i = 0; i < items.length; i += BULK_CHUNK_SIZE) {
        const chunk = items.slice(i, i + BULK_CHUNK_SIZE);
        await this.syncChunk(sessionId, chunk);
      }
    }
  }

  private async syncChunk(
    sessionId: number,
    items: Awaited<ReturnType<typeof pricesRepo.listBySyncState>>,
  ): Promise<void> {
    const clientUuids = items.map((i) => i.clientUuid);
    await pricesRepo.setSyncState(clientUuids, "syncing");

    const payload: PrecioBulkItem[] = items.map((i) => ({
      client_uuid: i.clientUuid,
      producto_id: i.productoId,
      presentacion_id: i.presentacionId,
      precio_1: i.precio1?.toString() ?? null,
      precio_2: i.precio2?.toString() ?? null,
      precio_3: i.precio3?.toString() ?? null,
      confirmado: i.confirmado,
      observacion: i.observacion,
      client_timestamp: i.clientTimestamp,
    }));

    try {
      const results = await pricesApi.bulk(sessionId, payload);
      for (const r of results) {
        switch (r.status) {
          case "created":
          case "updated":
            if (r.server_id != null) {
              await pricesRepo.markSynced(r.client_uuid, r.server_id);
            }
            break;
          case "conflict": {
            await pricesRepo.setSyncState([r.client_uuid], "conflict");
            await pricesRepo.setLastError(r.client_uuid, JSON.stringify(r.variacion_info ?? {}));
            const local = await pricesRepo.getByClientUuid(r.client_uuid);
            const entries = await catalogRepo.getBySession(sessionId);
            const match = entries.find(
              (e) =>
                local &&
                e.productoId === local.productoId &&
                e.presentacionId === local.presentacionId,
            );
            if (local && match && r.variacion_info) {
              conflictResolver.emit({
                clientUuid: r.client_uuid,
                productoId: local.productoId,
                presentacionId: local.presentacionId,
                productoNombre: match.productoNombre,
                presentacionNombre: match.presentacionNombre,
                variacion: r.variacion_info,
              });
            }
            break;
          }
          case "error": {
            await pricesRepo.incrementAttempts([r.client_uuid]);
            await pricesRepo.setLastError(r.client_uuid, r.error_message);
            const localItem = items.find((i) => i.clientUuid === r.client_uuid);
            const nextState =
              (localItem?.syncAttempts ?? 0) + 1 >= MAX_ATTEMPTS ? "error" : "pending";
            await pricesRepo.setSyncState([r.client_uuid], nextState);
            break;
          }
        }
      }
      await syncLogRepo.log("sync_batch", "success", { count: items.length });
    } catch (e) {
      await pricesRepo.setSyncState(clientUuids, "pending");
      await pricesRepo.incrementAttempts(clientUuids);
      await syncLogRepo.log("sync_batch", "error", {
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

export const SyncManager = new _SyncManager();
