import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `$${value.toFixed(2)}`;
}

export function formatDateTime(
  iso: string | null | undefined,
  pattern = "dd/MM/yyyy HH:mm",
): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), pattern, { locale: es });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string | null | undefined, pattern = "dd/MM/yyyy"): string {
  return formatDateTime(iso, pattern);
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const date = parseISO(iso);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "Hace instantes";
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return formatDate(iso);
  } catch {
    return iso;
  }
}

export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}
