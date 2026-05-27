import { create } from "zustand";

import type { MeAssignment } from "@/schemas/api";

export interface AuthUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdminGlobal: boolean;
  isActive: boolean;
  asignaciones: MeAssignment[];
}

export type AuthStatus = "idle" | "hydrating" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  scope: "mobile" | "admin" | null;
  softLocked: boolean;
  hasTokens: boolean;
  setStatus: (status: AuthStatus) => void;
  setUser: (user: AuthUser | null) => void;
  setScope: (scope: "mobile" | "admin" | null) => void;
  setSoftLocked: (locked: boolean) => void;
  setHasTokens: (hasTokens: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  user: null,
  scope: null,
  softLocked: false,
  hasTokens: false,
  setStatus: (status) => set({ status }),
  setUser: (user) => set({ user }),
  setScope: (scope) => set({ scope }),
  setSoftLocked: (softLocked) => set({ softLocked }),
  setHasTokens: (hasTokens) => set({ hasTokens }),
  reset: () =>
    set({
      status: "unauthenticated",
      user: null,
      scope: null,
      softLocked: false,
      hasTokens: false,
    }),
}));

export function getSupervisorMarkets(user: AuthUser | null): MeAssignment[] {
  if (!user) return [];
  return user.asignaciones.filter((a) => a.rol_codigo === "SUPERVISOR");
}

export function hasSupervisorRole(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.isAdminGlobal) return true;
  return user.asignaciones.some((a) => a.rol_codigo === "SUPERVISOR");
}
