import { getDatabase } from "../client";

export interface UserProfileRow {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_admin_global: number;
  cached_at: string;
}

export interface UserProfile {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdminGlobal: boolean;
  cachedAt: string;
}

function mapRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email ?? "",
    isAdminGlobal: row.is_admin_global === 1,
    cachedAt: row.cached_at,
  };
}

export async function get(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserProfileRow>(`SELECT * FROM user_profile LIMIT 1;`);
  return row ? mapRow(row) : null;
}

export async function upsert(profile: Omit<UserProfile, "cachedAt">): Promise<void> {
  const db = await getDatabase();
  const cachedAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO user_profile (id, username, first_name, last_name, email, is_admin_global, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       username=excluded.username,
       first_name=excluded.first_name,
       last_name=excluded.last_name,
       email=excluded.email,
       is_admin_global=excluded.is_admin_global,
       cached_at=excluded.cached_at;`,
    profile.id,
    profile.username,
    profile.firstName,
    profile.lastName,
    profile.email,
    profile.isAdminGlobal ? 1 : 0,
    cachedAt,
  );
}

export async function clear(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM user_profile;`);
}
