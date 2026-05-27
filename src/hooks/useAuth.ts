import { useCallback } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

import * as authApi from "@/api/auth";
import {
  clearTokens,
  hasStoredTokens,
  persistTokens,
  setAuthFailureHandler,
} from "@/api/client";
import * as devicesApi from "@/api/devices";
import * as usersApi from "@/api/users";
import * as marketsRepo from "@/db/repos/markets";
import * as userProfileRepo from "@/db/repos/userProfile";
import { hasSupervisorRole, useAuthStore, type AuthUser } from "@/stores/auth";
import { toast } from "@/stores/toast";

import type { MeResponse } from "@/schemas/api";

function mapMeToAuthUser(me: MeResponse): AuthUser {
  return {
    id: me.id,
    username: me.username,
    firstName: me.first_name ?? "",
    lastName: me.last_name ?? "",
    email: me.email ?? "",
    isAdminGlobal: me.is_admin_global,
    isActive: me.is_active,
    asignaciones: me.asignaciones,
  };
}

async function tryRegisterDevice(): Promise<string | null> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) return null;
    const projectId =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((require("expo-constants").default as any)?.expoConfig?.extra?.eas?.projectId as
        | string
        | undefined) ?? undefined;
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenRes.data;
    await devicesApi.register({
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
      device_name: Device.modelName ?? Platform.OS,
    });
    return token;
  } catch {
    // No bloquea el flujo de auth
    return null;
  }
}

async function fetchAndCacheMarkets(): Promise<void> {
  try {
    const markets = await usersApi.myMarkets();
    await marketsRepo.bulkUpsert(
      markets.map((m) => ({
        id: m.mercado_id,
        codigo: m.mercado_codigo,
        nombre: m.mercado_nombre,
        clasificacion: m.mercado_clasificacion,
        direccion: m.direccion ?? "",
        userRole: m.roles.includes("SUPERVISOR")
          ? "SUPERVISOR"
          : m.roles[0] ?? "OTRO",
      })),
    );
  } catch {
    // Sin red: dejamos lo que esté en cache
  }
}

export function useAuth() {
  const router = useRouter();
  const setStatus = useAuthStore((s) => s.setStatus);
  const setUser = useAuthStore((s) => s.setUser);
  const setScope = useAuthStore((s) => s.setScope);
  const setHasTokens = useAuthStore((s) => s.setHasTokens);
  const setSoftLocked = useAuthStore((s) => s.setSoftLocked);
  const reset = useAuthStore((s) => s.reset);

  // Bootstrap al arrancar la app: si hay tokens, llama /me y carga mercados.
  const hydrate = useCallback(async () => {
    setStatus("hydrating");
    setAuthFailureHandler((mode) => {
      if (mode === "hard") {
        toast.warning("Tu sesión expiró. Vuelve a iniciar sesión.");
        clearTokens().catch(() => {});
        userProfileRepo.clear().catch(() => {});
        reset();
        router.replace("/(auth)/login");
      } else {
        setSoftLocked(true);
        toast.warning("Sin conexión — algunas funciones limitadas.");
      }
    });

    const hasTokens = await hasStoredTokens();
    setHasTokens(hasTokens);
    if (!hasTokens) {
      setStatus("unauthenticated");
      return;
    }

    try {
      const me = await authApi.me();
      const authUser = mapMeToAuthUser(me);
      setUser(authUser);
      setScope("mobile");
      setStatus("authenticated");
      await userProfileRepo.upsert({
        id: authUser.id,
        username: authUser.username,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        isAdminGlobal: authUser.isAdminGlobal,
      });
      await fetchAndCacheMarkets();
      if (!hasSupervisorRole(authUser)) {
        toast.error("Esta app es exclusiva para supervisores.");
      }
    } catch {
      // Offline: intentar hidratar desde cache local
      const cached = await userProfileRepo.get();
      if (cached) {
        setUser({
          id: cached.id,
          username: cached.username,
          firstName: cached.firstName,
          lastName: cached.lastName,
          email: cached.email,
          isAdminGlobal: cached.isAdminGlobal,
          isActive: true,
          asignaciones: [],
        });
        setScope("mobile");
        setStatus("authenticated");
        setSoftLocked(true);
      } else {
        setStatus("unauthenticated");
      }
    }
  }, [reset, router, setHasTokens, setScope, setSoftLocked, setStatus, setUser]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      const tokens = await authApi.login({ username, password });
      await persistTokens(tokens.access_token, tokens.refresh_token);
      setHasTokens(true);
      setScope(tokens.scope);
      const me = await authApi.me();
      const authUser = mapMeToAuthUser(me);
      setUser(authUser);
      setStatus("authenticated");
      await userProfileRepo.upsert({
        id: authUser.id,
        username: authUser.username,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        isAdminGlobal: authUser.isAdminGlobal,
      });
      // Bootstrap secundario (no bloqueante)
      Promise.all([tryRegisterDevice(), fetchAndCacheMarkets()]).catch(() => {});
      return authUser;
    },
    [setHasTokens, setScope, setStatus, setUser],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    await clearTokens();
    await userProfileRepo.clear();
    reset();
    router.replace("/(auth)/login");
  }, [reset, router]);

  return { hydrate, signIn, signOut };
}
