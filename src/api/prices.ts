import { api } from "./client";

import type {
  PrecioBulkItem,
  PrecioBulkResult,
  PrecioGuardadoResponse,
  PrecioOut,
  PrecioValidateRequest,
  VariacionInfo,
} from "@/schemas/api";

export interface SavePriceInput {
  producto_id: number;
  presentacion_id: number;
  precio_1?: string | null;
  precio_2?: string | null;
  precio_3?: string | null;
  confirmado?: boolean;
  observacion?: string;
}

export async function savePrice(
  sessionId: number,
  payload: SavePriceInput,
): Promise<PrecioGuardadoResponse> {
  const res = await api.post<PrecioGuardadoResponse>(`/sessions/${sessionId}/prices`, payload);
  return res.data;
}

export async function updateObservation(
  sessionId: number,
  tomaId: number,
  observacion: string,
): Promise<PrecioOut> {
  const res = await api.patch<PrecioOut>(
    `/sessions/${sessionId}/prices/${tomaId}/observation`,
    { observacion },
  );
  return res.data;
}

export async function bulk(
  sessionId: number,
  items: PrecioBulkItem[],
): Promise<PrecioBulkResult[]> {
  const res = await api.post<PrecioBulkResult[]>(
    `/sessions/${sessionId}/prices/bulk`,
    items,
  );
  return res.data;
}

export async function validate(payload: PrecioValidateRequest): Promise<VariacionInfo> {
  const res = await api.post<VariacionInfo>("/prices/validate", payload);
  return res.data;
}
