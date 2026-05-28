import { getDatabase } from "../client";

export type MarketUserRole = "SUPERVISOR" | "ADMIN_LOCAL" | "ADMIN_GLOBAL" | "OTRO";

interface MarketRow {
  id: number;
  codigo: string;
  nombre: string;
  clasificacion: string;
  direccion: string | null;
  user_role: string;
  cached_at: string;
}

export interface Market {
  id: number;
  codigo: string;
  nombre: string;
  clasificacion: string;
  direccion: string;
  userRole: MarketUserRole;
}

export interface MarketInput extends Omit<Market, "userRole"> {
  userRole: string;
}

function mapRow(row: MarketRow): Market {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    clasificacion: row.clasificacion,
    direccion: row.direccion ?? "",
    userRole: (row.user_role as MarketUserRole) ?? "OTRO",
  };
}

export async function list(): Promise<Market[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MarketRow>(`SELECT * FROM markets_cache ORDER BY nombre ASC;`);
  return rows.map(mapRow);
}

export async function getById(id: number): Promise<Market | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MarketRow>(`SELECT * FROM markets_cache WHERE id = ?;`, id);
  return row ? mapRow(row) : null;
}

export async function bulkUpsert(items: MarketInput[]): Promise<void> {
  if (items.length === 0) return;
  const db = await getDatabase();
  const cachedAt = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const m of items) {
      await db.runAsync(
        `INSERT INTO markets_cache (id, codigo, nombre, clasificacion, direccion, user_role, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           codigo=excluded.codigo,
           nombre=excluded.nombre,
           clasificacion=excluded.clasificacion,
           direccion=excluded.direccion,
           user_role=excluded.user_role,
           cached_at=excluded.cached_at;`,
        m.id,
        m.codigo,
        m.nombre,
        m.clasificacion,
        m.direccion ?? "",
        m.userRole,
        cachedAt,
      );
    }
  });
}

export async function clear(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM markets_cache;`);
}
