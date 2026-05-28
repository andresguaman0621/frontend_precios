import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ||
  "http://localhost:8005/api/v1";

const TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? "30000", 10);

export const SECURE_STORE_KEYS = {
  access: "auth.access",
  refresh: "auth.refresh",
} as const;

type AuthFailureHandler = (mode: "hard" | "soft") => void;

let onAuthFailure: AuthFailureHandler = () => {};

export function setAuthFailureHandler(handler: AuthFailureHandler): void {
  onAuthFailure = handler;
}

// Cache en memoria del access token (lectura SecureStore es costosa).
let memoryAccess: string | null = null;
let memoryRefresh: string | null = null;

export async function persistTokens(access: string, refresh: string): Promise<void> {
  memoryAccess = access;
  memoryRefresh = refresh;
  await Promise.all([
    SecureStore.setItemAsync(SECURE_STORE_KEYS.access, access),
    SecureStore.setItemAsync(SECURE_STORE_KEYS.refresh, refresh),
  ]);
}

export async function persistAccessToken(access: string): Promise<void> {
  memoryAccess = access;
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.access, access);
}

export async function clearTokens(): Promise<void> {
  memoryAccess = null;
  memoryRefresh = null;
  await Promise.all([
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.access),
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.refresh),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  if (memoryAccess) return memoryAccess;
  const value = await SecureStore.getItemAsync(SECURE_STORE_KEYS.access);
  memoryAccess = value;
  return value;
}

export async function getRefreshToken(): Promise<string | null> {
  if (memoryRefresh) return memoryRefresh;
  const value = await SecureStore.getItemAsync(SECURE_STORE_KEYS.refresh);
  memoryRefresh = value;
  return value;
}

export async function hasStoredTokens(): Promise<boolean> {
  const access = await getAccessToken();
  return access !== null;
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  if (!config.headers.Authorization) {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Refresh mutex: si llegan N respuestas 401 simultáneas, sólo se hace un refresh.
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await axios.post<{
      access_token: string;
      token_type: "bearer";
      scope: "mobile" | "admin";
      expires_in: number;
    }>(
      `${BASE_URL}/auth/refresh`,
      { refresh_token: refresh },
      {
        timeout: TIMEOUT,
        headers: { "Content-Type": "application/json" },
      },
    );
    await persistAccessToken(res.data.access_token);
    return res.data.access_token;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/refresh") &&
      !original.url?.includes("/auth/login")
    ) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccess = await refreshPromise;
      if (newAccess) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
        return api.request(original);
      }
      // Refresh falló: si offline → softLock, si online → hardLogout
      const hasNetwork = error.code !== "ERR_NETWORK" && error.code !== "ECONNABORTED";
      onAuthFailure(hasNetwork ? "hard" : "soft");
    }
    return Promise.reject(error);
  },
);
