import { getDatabase } from "../client";

interface CatalogEntryRow {
  session_id: number;
  producto_id: number;
  producto_nombre: string;
  producto_categoria: string;
  producto_orden: number;
  presentacion_id: number;
  presentacion_nombre: string;
  presentacion_orden: number;
  last_price: number | null;
  umbral_inferior: number | null;
  umbral_superior: number | null;
}

export interface CatalogEntry {
  sessionId: number;
  productoId: number;
  productoNombre: string;
  productoCategoria: string;
  productoOrden: number;
  presentacionId: number;
  presentacionNombre: string;
  presentacionOrden: number;
  lastPrice: number | null;
  umbralInferior: number | null;
  umbralSuperior: number | null;
}

export interface CatalogEntryInput extends Omit<CatalogEntry, "sessionId"> {
  sessionId: number;
}

function mapRow(row: CatalogEntryRow): CatalogEntry {
  return {
    sessionId: row.session_id,
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    productoCategoria: row.producto_categoria,
    productoOrden: row.producto_orden,
    presentacionId: row.presentacion_id,
    presentacionNombre: row.presentacion_nombre,
    presentacionOrden: row.presentacion_orden,
    lastPrice: row.last_price,
    umbralInferior: row.umbral_inferior,
    umbralSuperior: row.umbral_superior,
  };
}

export async function getBySession(sessionId: number): Promise<CatalogEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CatalogEntryRow>(
    `SELECT * FROM catalog_entries WHERE session_id = ?
     ORDER BY producto_categoria ASC, producto_orden ASC, producto_nombre ASC, presentacion_orden ASC;`,
    sessionId,
  );
  return rows.map(mapRow);
}

export async function bulkInsert(
  sessionId: number,
  entries: CatalogEntryInput[],
): Promise<void> {
  if (entries.length === 0) return;
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM catalog_entries WHERE session_id = ?;`, sessionId);
    for (const e of entries) {
      await db.runAsync(
        `INSERT INTO catalog_entries (
           session_id, producto_id, producto_nombre, producto_categoria, producto_orden,
           presentacion_id, presentacion_nombre, presentacion_orden, last_price,
           umbral_inferior, umbral_superior
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        e.sessionId,
        e.productoId,
        e.productoNombre,
        e.productoCategoria,
        e.productoOrden,
        e.presentacionId,
        e.presentacionNombre,
        e.presentacionOrden,
        e.lastPrice,
        e.umbralInferior,
        e.umbralSuperior,
      );
    }
  });
}

export async function deleteBySession(sessionId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM catalog_entries WHERE session_id = ?;`, sessionId);
}

export async function clear(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM catalog_entries;`);
}
