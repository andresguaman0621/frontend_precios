import { api } from "./client";

import type { UserMarket } from "@/schemas/api";

export async function myMarkets(): Promise<UserMarket[]> {
  const res = await api.get<UserMarket[]>("/users/me/markets");
  return res.data;
}
