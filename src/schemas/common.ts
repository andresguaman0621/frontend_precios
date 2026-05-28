import { z } from "zod";

export type SyncState = "synced" | "pending" | "syncing" | "conflict" | "error";

export type SessionSyncState = "synced" | "pending_create" | "pending_complete" | "pending_cancel";

export type SessionEstado = "INICIADA" | "COMPLETADA";

export const decimalString = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, "Debe ser un número decimal válido");

export const isoDateTime = z.string().datetime({ offset: true });
