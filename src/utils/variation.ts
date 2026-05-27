/**
 * Cálculo de variación porcentual y chequeo de umbrales (port de precio_service.py).
 */

export interface VariationResult {
  variacion: number | null;
  esAumento: boolean | null;
  hayAlerta: boolean;
  mensaje: string;
}

const DEFAULT_UMBRAL_INF = -32;
const DEFAULT_UMBRAL_SUP = 34;

export function computeVariation(
  precioNuevo: number,
  precioAnterior: number | null,
): { variacion: number | null; esAumento: boolean | null } {
  if (precioAnterior == null || precioAnterior <= 0) {
    return { variacion: null, esAumento: null };
  }
  const variacion = ((precioNuevo - precioAnterior) / precioAnterior) * 100;
  return {
    variacion: Math.round(variacion * 100) / 100,
    esAumento: variacion > 0,
  };
}

export function checkUmbrales(
  variacion: number | null,
  umbralInferior: number | null,
  umbralSuperior: number | null,
): { hayAlerta: boolean; mensaje: string } {
  if (variacion == null) return { hayAlerta: false, mensaje: "" };
  const inf = umbralInferior ?? DEFAULT_UMBRAL_INF;
  const sup = umbralSuperior ?? DEFAULT_UMBRAL_SUP;
  const hayAlerta = variacion < inf || variacion > sup;
  let mensaje = "";
  if (hayAlerta) {
    mensaje = variacion > 0 ? "Variación atípica — alza" : "Variación atípica — baja";
  }
  return { hayAlerta, mensaje };
}

export function evaluateVariation(
  precioNuevo: number,
  precioAnterior: number | null,
  umbralInferior: number | null,
  umbralSuperior: number | null,
): VariationResult {
  const { variacion, esAumento } = computeVariation(precioNuevo, precioAnterior);
  const { hayAlerta, mensaje } = checkUmbrales(variacion, umbralInferior, umbralSuperior);
  return { variacion, esAumento, hayAlerta, mensaje };
}
