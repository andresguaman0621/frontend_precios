import { api } from "./client";

import type {
  AccessTokenResponse,
  ChangePasswordRequest,
  LoginRequest,
  MeResponse,
  TokenResponse,
} from "@/schemas/api";

export async function login(payload: { username: string; password: string }): Promise<TokenResponse> {
  const body: LoginRequest = { ...payload, scope: "mobile" };
  const res = await api.post<TokenResponse>("/auth/login", body);
  return res.data;
}

export async function refresh(refreshToken: string): Promise<AccessTokenResponse> {
  const res = await api.post<AccessTokenResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout").catch(() => undefined);
}

export async function me(): Promise<MeResponse> {
  const res = await api.get<MeResponse>("/auth/me");
  return res.data;
}

export async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await api.post("/auth/change-password", payload);
}
