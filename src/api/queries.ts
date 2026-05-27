/**
 * Query keys factory para TanStack Query. Mantener centralizado para invalidar consistente.
 */

export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  users: {
    markets: () => ["users", "markets"] as const,
  },
  sessions: {
    list: (params?: Record<string, unknown>) => ["sessions", "list", params] as const,
    active: () => ["sessions", "active"] as const,
    canStart: (marketId: number) => ["sessions", "canStart", marketId] as const,
    detail: (id: number) => ["sessions", "detail", id] as const,
    catalog: (id: number) => ["sessions", "catalog", id] as const,
  },
  devices: {
    list: () => ["devices", "list"] as const,
  },
} as const;
