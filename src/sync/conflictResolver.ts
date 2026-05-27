/**
 * Pub/sub simple para que pantallas (capture, sync-status) escuchen conflictos
 * de variación tras un sync bulk y muestren VariationAlertModal.
 */

import type { VariacionInfo } from "@/schemas/api";

export interface ConflictPayload {
  clientUuid: string;
  productoId: number;
  presentacionId: number;
  productoNombre: string;
  presentacionNombre: string;
  variacion: VariacionInfo;
}

type Listener = (payload: ConflictPayload) => void;

const listeners: Set<Listener> = new Set();

export const conflictResolver = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emit(payload: ConflictPayload): void {
    for (const l of listeners) l(payload);
  },
};
