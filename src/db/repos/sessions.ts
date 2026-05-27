import { getDatabase } from "../client";

import type { SessionEstado, SessionSyncState } from "@/schemas/common";

interface SessionRow {
  id: number;
  client_uuid: string;
  mercado_id: number;
  mercado_nombre: string;
  numero_semana: number;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  lat_inicio: number | null;
  lng_inicio: number | null;
  accuracy_inicio: number | null;
  lat_fin: number | null;
  lng_fin: number | null;
  accuracy_fin: number | null;
  estado: string;
  total_productos: number;
  comentario_sesion: string;
  sync_state: string;
  cached_at: string;
}

export interface LocalSession {
  id: number;
  clientUuid: string;
  mercadoId: number;
  mercadoNombre: string;
  numeroSemana: number;
  anio: number;
  fechaInicio: string;
  fechaFin: string | null;
  latInicio: number | null;
  lngInicio: number | null;
  accuracyInicio: number | null;
  latFin: number | null;
  lngFin: number | null;
  accuracyFin: number | null;
  estado: SessionEstado;
  totalProductos: number;
  comentarioSesion: string;
  syncState: SessionSyncState;
  cachedAt: string;
}

export type SessionUpsert = Omit<LocalSession, "cachedAt">;

function mapRow(row: SessionRow): LocalSession {
  return {
    id: row.id,
    clientUuid: row.client_uuid,
    mercadoId: row.mercado_id,
    mercadoNombre: row.mercado_nombre,
    numeroSemana: row.numero_semana,
    anio: row.anio,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    latInicio: row.lat_inicio,
    lngInicio: row.lng_inicio,
    accuracyInicio: row.accuracy_inicio,
    latFin: row.lat_fin,
    lngFin: row.lng_fin,
    accuracyFin: row.accuracy_fin,
    estado: row.estado as SessionEstado,
    totalProductos: row.total_productos,
    comentarioSesion: row.comentario_sesion,
    syncState: row.sync_state as SessionSyncState,
    cachedAt: row.cached_at,
  };
}

export async function getActive(): Promise<LocalSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT * FROM sessions WHERE estado = 'INICIADA' LIMIT 1;`,
  );
  return row ? mapRow(row) : null;
}

export async function getById(id: number): Promise<LocalSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT * FROM sessions WHERE id = ? LIMIT 1;`,
    id,
  );
  return row ? mapRow(row) : null;
}

export async function getByClientUuid(uuid: string): Promise<LocalSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT * FROM sessions WHERE client_uuid = ? LIMIT 1;`,
    uuid,
  );
  return row ? mapRow(row) : null;
}

export async function upsert(session: SessionUpsert): Promise<void> {
  const db = await getDatabase();
  const cachedAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO sessions (
       id, client_uuid, mercado_id, mercado_nombre, numero_semana, anio,
       fecha_inicio, fecha_fin, lat_inicio, lng_inicio, accuracy_inicio,
       lat_fin, lng_fin, accuracy_fin, estado, total_productos,
       comentario_sesion, sync_state, cached_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       mercado_id=excluded.mercado_id,
       mercado_nombre=excluded.mercado_nombre,
       numero_semana=excluded.numero_semana,
       anio=excluded.anio,
       fecha_inicio=excluded.fecha_inicio,
       fecha_fin=excluded.fecha_fin,
       lat_inicio=excluded.lat_inicio,
       lng_inicio=excluded.lng_inicio,
       accuracy_inicio=excluded.accuracy_inicio,
       lat_fin=excluded.lat_fin,
       lng_fin=excluded.lng_fin,
       accuracy_fin=excluded.accuracy_fin,
       estado=excluded.estado,
       total_productos=excluded.total_productos,
       comentario_sesion=excluded.comentario_sesion,
       sync_state=excluded.sync_state,
       cached_at=excluded.cached_at;`,
    session.id,
    session.clientUuid,
    session.mercadoId,
    session.mercadoNombre,
    session.numeroSemana,
    session.anio,
    session.fechaInicio,
    session.fechaFin,
    session.latInicio,
    session.lngInicio,
    session.accuracyInicio,
    session.latFin,
    session.lngFin,
    session.accuracyFin,
    session.estado,
    session.totalProductos,
    session.comentarioSesion,
    session.syncState,
    cachedAt,
  );
}

export async function setSyncState(id: number, state: SessionSyncState): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE sessions SET sync_state = ? WHERE id = ?;`, state, id);
}

export async function setEstado(id: number, estado: SessionEstado): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE sessions SET estado = ? WHERE id = ?;`, estado, id);
}

export async function updateCompletion(
  id: number,
  data: {
    latFin: number | null;
    lngFin: number | null;
    accuracyFin: number | null;
    comentarioSesion: string;
    fechaFin?: string | null;
    syncState: SessionSyncState;
  },
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE sessions SET
       lat_fin = ?, lng_fin = ?, accuracy_fin = ?,
       comentario_sesion = ?, fecha_fin = COALESCE(?, fecha_fin),
       sync_state = ?
     WHERE id = ?;`,
    data.latFin,
    data.lngFin,
    data.accuracyFin,
    data.comentarioSesion,
    data.fechaFin ?? null,
    data.syncState,
    id,
  );
}

export async function remove(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sessions WHERE id = ?;`, id);
}

export async function listByMarketInWeek(
  marketId: number,
  numeroSemana: number,
  anio: number,
): Promise<LocalSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM sessions
     WHERE mercado_id = ? AND numero_semana = ? AND anio = ?
     ORDER BY fecha_inicio DESC;`,
    marketId,
    numeroSemana,
    anio,
  );
  return rows.map(mapRow);
}

export async function listPendingSync(): Promise<LocalSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM sessions WHERE sync_state != 'synced' ORDER BY fecha_inicio ASC;`,
  );
  return rows.map(mapRow);
}

export async function setTotalProductos(id: number, total: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE sessions SET total_productos = ? WHERE id = ?;`, total, id);
}

export async function clear(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sessions;`);
}
