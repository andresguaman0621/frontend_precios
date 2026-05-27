import { api } from "./client";

import type { DeviceOut, DeviceRegisterRequest } from "@/schemas/api";

export async function register(payload: DeviceRegisterRequest): Promise<DeviceOut> {
  const res = await api.post<DeviceOut>("/devices/register", payload);
  return res.data;
}

export async function unregister(token: string): Promise<void> {
  await api.delete(`/devices/${encodeURIComponent(token)}`).catch(() => undefined);
}

export async function list(): Promise<DeviceOut[]> {
  const res = await api.get<DeviceOut[]>("/devices");
  return res.data;
}
