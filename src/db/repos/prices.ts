import uuid from "react-native-uuid";

import { getDatabase } from "../client";

import type { SyncState } from "@/schemas/common";

interface PriceRow {
  client_uuid: string;
  session_id: number;
  server_id: number | null;
  producto_id: number;
  presentacion_id: number;
  precio_1: number | null;
  precio_2: number | null;
  precio_3: number | null;
  precio: number;
  observacion: string;
  confirmado: number;
  requirio_confirmacion_manual: number;
  variacion_porcentaje: number | null;
  client_timestamp: string;
  sync_state: string;
  sync_attempts: number;
  last_error: string | null;
}

export interface LocalPrice {
  clientUuid: string;
  sessionId: number;
  serverId: number | null;
  productoId: number;
  presentacionId: number;
  precio1: number | null;
  precio2: number | null;
  precio3: number | null;
  precio: number;
  observacion: string;
  confirmado: boolean;
  requirioConfirmacionManual: boolean;
  variacionPorcentaje: number | null;
  clientTimestamp: string;
  syncState: SyncState;
  syncAttempts: number;
  lastError: string | null;
}

export interface PriceUpsertInput {
  sessionId: number;
  productoId: number;
  presentacionId: number;
  precio1: number | null;
  precio2: number | null;
  precio3: number | null;
  precio: number;
  observacion: string;
  confirmado: boolean;
  requirioConfirmacionManual?: boolean;
  variacionPorcentaje?: number | null;
}

function mapRow(row: PriceRow): LocalPrice {
  return {
    clientUuid: row.client_uuid,
    sessionId: row.session_id,
    serverId: row.server_id,
    productoId: row.producto_id,
    presentacionId: row.presentacion_id,
    precio1: row.precio_1,
    precio2: row.precio_2,
    precio3: row.precio_3,
    precio: row.precio,
    observacion: row.observacion,
    confirmado: row.confirmado === 1,
    requirioConfirmacionManual: row.requirio_confirmacion_manual === 1,
    variacionPorcentaje: row.variacion_porcentaje,
    clientTimestamp: row.client_timestamp,
    syncState: row.sync_state as SyncState,
    syncAttempts: row.sync_attempts,
    lastError: row.last_error,
  };
}

export async function getByKey(
  sessionId: number,
  productoId: number,
  presentacionId: number,
): Promise<LocalPrice | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PriceRow>(
    `SELECT * FROM prices WHERE session_id = ? AND producto_id = ? AND presentacion_id = ? LIMIT 1;`,
    sessionId,
    productoId,
    presentacionId,
  );
  return row ? mapRow(row) : null;
}

export async function getByClientUuid(clientUuid: string): Promise<LocalPrice | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PriceRow>(
    `SELECT * FROM prices WHERE client_uuid = ? LIMIT 1;`,
    clientUuid,
  );
  return row ? mapRow(row) : null;
}

/**
 * UPSERT por (session_id, producto_id, presentacion_id).
 * El client_uuid se conserva si la fila ya existe; sólo se genera nuevo en el primer INSERT.
 * Esto es crítico para idempotencia en sync.
 */
export async function upsert(input: PriceUpsertInput): Promise<LocalPrice> {
  const db = await getDatabase();
  const existing = await getByKey(input.sessionId, input.productoId, input.presentacionId);
  const clientUuid = existing?.clientUuid ?? (uuid.v4() as string);
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO prices (
       client_uuid, session_id, server_id, producto_id, presentacion_id,
       precio_1, precio_2, precio_3, precio, observacion,
       confirmado, requirio_confirmacion_manual, variacion_porcentaje,
       client_timestamp, sync_state, sync_attempts, last_error
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(client_uuid) DO UPDATE SET
       precio_1 = excluded.precio_1,
       precio_2 = excluded.precio_2,
       precio_3 = excluded.precio_3,
       precio = excluded.precio,
       observacion = excluded.observacion,
       confirmado = excluded.confirmado,
       requirio_confirmacion_manual = excluded.requirio_confirmacion_manual,
       variacion_porcentaje = excluded.variacion_porcentaje,
       client_timestamp = excluded.client_timestamp,
       sync_state = excluded.sync_state,
       sync_attempts = 0,
       last_error = NULL;`,
    clientUuid,
    input.sessionId,
    existing?.serverId ?? null,
    input.productoId,
    input.presentacionId,
    input.precio1,
    input.precio2,
    input.precio3,
    input.precio,
    input.observacion,
    input.confirmado ? 1 : 0,
    input.requirioConfirmacionManual ? 1 : 0,
    input.variacionPorcentaje ?? null,
    now,
    "pending",
    0,
    null,
  );

  const updated = await getByClientUuid(clientUuid);
  if (!updated) {
    throw new Error("Failed to upsert price (post-insert lookup returned null)");
  }
  return updated;
}

export async function updateObservation(clientUuid: string, observacion: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE prices SET observacion = ?, sync_state = 'pending', sync_attempts = 0, last_error = NULL WHERE client_uuid = ?;`,
    observacion,
    clientUuid,
  );
}

export async function listBySession(sessionId: number): Promise<LocalPrice[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PriceRow>(
    `SELECT * FROM prices WHERE session_id = ? ORDER BY client_timestamp ASC;`,
    sessionId,
  );
  return rows.map(mapRow);
}

export async function listBySyncState(state: SyncState): Promise<LocalPrice[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PriceRow>(
    `SELECT * FROM prices WHERE sync_state = ? ORDER BY client_timestamp ASC;`,
    state,
  );
  return rows.map(mapRow);
}

export async function countBySession(sessionId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT producto_id) as count FROM prices WHERE session_id = ?;`,
    sessionId,
  );
  return row?.count ?? 0;
}

export async function countPendingBySession(sessionId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM prices WHERE session_id = ? AND sync_state IN ('pending', 'error', 'conflict');`,
    sessionId,
  );
  return row?.count ?? 0;
}

export async function countPendingTotal(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM prices WHERE sync_state IN ('pending', 'error', 'conflict');`,
  );
  return row?.count ?? 0;
}

export async function markSynced(clientUuid: string, serverId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE prices SET sync_state = 'synced', server_id = ?, sync_attempts = 0, last_error = NULL WHERE client_uuid = ?;`,
    serverId,
    clientUuid,
  );
}

export async function setSyncState(clientUuids: string[], state: SyncState): Promise<void> {
  if (clientUuids.length === 0) return;
  const db = await getDatabase();
  const placeholders = clientUuids.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE prices SET sync_state = ? WHERE client_uuid IN (${placeholders});`,
    state,
    ...clientUuids,
  );
}

export async function incrementAttempts(clientUuids: string[]): Promise<void> {
  if (clientUuids.length === 0) return;
  const db = await getDatabase();
  const placeholders = clientUuids.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE prices SET sync_attempts = sync_attempts + 1 WHERE client_uuid IN (${placeholders});`,
    ...clientUuids,
  );
}

export async function setLastError(clientUuid: string, message: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE prices SET last_error = ? WHERE client_uuid = ?;`, message, clientUuid);
}

export async function deleteBySession(sessionId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM prices WHERE session_id = ?;`, sessionId);
}

export async function clear(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM prices;`);
}
