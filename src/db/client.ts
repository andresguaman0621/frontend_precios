import * as SQLite from "expo-sqlite";

import { runMigrations } from "./migrations";

const DB_NAME = "mmqep.db";

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);
  await runMigrations(db);
  _db = db;
  return db;
}

export async function ensureDatabase(): Promise<void> {
  await getDatabase();
}

/** Para tests: permite inyectar una BD en memoria. */
export function _setDatabaseForTests(db: SQLite.SQLiteDatabase | null): void {
  _db = db;
}

export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}
