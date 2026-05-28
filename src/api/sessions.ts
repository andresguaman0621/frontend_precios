import { api } from "./client";

import type {
  CanStartResponse,
  CatalogForSession,
  PaginatedResponse,
  SesionActiveResponse,
  SesionCompletarRequest,
  SesionCreateRequest,
  SesionListItem,
  SesionOut,
} from "@/schemas/api";

export interface SessionsListParams {
  market_id?: number;
  supervisor_id?: number;
  date_from?: string;
  date_to?: string;
  estado?: "INICIADA" | "COMPLETADA";
  page?: number;
  page_size?: number;
}

export async function list(
  params: SessionsListParams = {},
): Promise<PaginatedResponse<SesionListItem>> {
  const res = await api.get<PaginatedResponse<SesionListItem>>("/sessions", { params });
  return res.data;
}

export async function active(): Promise<SesionActiveResponse | null> {
  try {
    const res = await api.get<SesionActiveResponse | null>("/sessions/active");
    return res.data;
  } catch (e) {
    // Si backend devuelve 404, no hay sesión activa.
    const status = (e as { response?: { status?: number } }).response?.status;
    if (status === 404) return null;
    throw e;
  }
}

export async function canStart(marketId: number): Promise<CanStartResponse> {
  const res = await api.get<CanStartResponse>("/sessions/can-start", {
    params: { market_id: marketId },
  });
  return res.data;
}

export async function create(payload: SesionCreateRequest): Promise<SesionOut> {
  const res = await api.post<SesionOut>("/sessions", payload);
  return res.data;
}

export async function getById(id: number): Promise<SesionOut> {
  const res = await api.get<SesionOut>(`/sessions/${id}`);
  return res.data;
}

export async function catalog(id: number): Promise<CatalogForSession> {
  const res = await api.get<CatalogForSession>(`/sessions/${id}/catalog`);
  return res.data;
}

export async function complete(id: number, payload: SesionCompletarRequest): Promise<SesionOut> {
  const res = await api.post<SesionOut>(`/sessions/${id}/complete`, payload);
  return res.data;
}

export async function cancel(id: number): Promise<void> {
  await api.delete(`/sessions/${id}`);
}
