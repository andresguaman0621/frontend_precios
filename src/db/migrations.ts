import type * as SQLite from "expo-sqlite";

import { SCHEMA_V1 } from "./schema";

const CURRENT_VERSION = 1;

interface VersionRow {
  version: number;
}

async function ensureVersionTable(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS _schema_version (version INTEGER PRIMARY KEY);`,
  );
}

async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<VersionRow>(
    `SELECT version FROM _schema_version ORDER BY version DESC LIMIT 1;`,
  );
  return row?.version ?? 0;
}

async function setVersion(db: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO _schema_version (version) VALUES (?);`,
    version,
  );
}

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await ensureVersionTable(db);
  const current = await getCurrentVersion(db);

  if (current < 1) {
    await db.execAsync(SCHEMA_V1);
    await setVersion(db, 1);
  }
  // Migraciones futuras: agregar bloques `if (current < N) { ... await setVersion(db, N); }`
  void CURRENT_VERSION;
}
