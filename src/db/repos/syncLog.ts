import { getDatabase } from "../client";

interface SyncLogRow {
  id: number;
  timestamp: string;
  action: string;
  status: string;
  details: string | null;
}

export interface SyncLogEntry {
  id: number;
  timestamp: string;
  action: string;
  status: "success" | "error";
  details: Record<string, unknown> | null;
}

function mapRow(row: SyncLogRow): SyncLogEntry {
  let details: Record<string, unknown> | null = null;
  if (row.details) {
    try {
      details = JSON.parse(row.details);
    } catch {
      details = { raw: row.details };
    }
  }
  return {
    id: row.id,
    timestamp: row.timestamp,
    action: row.action,
    status: row.status as "success" | "error",
    details,
  };
}

export async function log(
  action: string,
  status: "success" | "error",
  details?: Record<string, unknown>,
): Promise<void> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO sync_log (timestamp, action, status, details) VALUES (?, ?, ?, ?);`,
    timestamp,
    action,
    status,
    details ? JSON.stringify(details) : null,
  );
}

export async function recent(limit = 20): Promise<SyncLogEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SyncLogRow>(
    `SELECT * FROM sync_log ORDER BY id DESC LIMIT ?;`,
    limit,
  );
  return rows.map(mapRow);
}

export async function clear(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sync_log;`);
}
