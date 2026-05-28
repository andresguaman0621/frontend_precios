/**
 * Parsing y formato de decimales con soporte para coma y punto como separador.
 * Replicar comportamiento del web: 1,5 → 1.5, "$ 25.50" → 25.50.
 */

export function parseDecimal(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  const trimmed = input.toString().trim();
  if (trimmed === "") return null;
  // Quita símbolo de moneda, espacios, separador de miles
  const normalized = trimmed
    .replace(/[$\s]/g, "")
    .replace(/,/g, ".") // coma a punto
    .replace(/\.(?=.*\.)/g, ""); // si hay más de un punto, mantiene sólo el último
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

export function isValidPrice(value: number | null): boolean {
  if (value == null) return false;
  return value > 0 && value <= 9999.99;
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function average(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, v) => acc + v, 0);
  return roundTo(sum / valid.length, 2);
}
