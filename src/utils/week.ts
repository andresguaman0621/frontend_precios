/**
 * Cálculo de semana domingo-domingo, equivalente a `strftime('%U')` de Python en TZ
 * America/Guayaquil. Port literal de `backend/app/services/week_service.py`.
 *
 * Reglas:
 *  - %U: número de semana del año, contando domingos. Semana 0 = días antes del primer domingo.
 *  - Si la semana calculada es 0 → se devuelve 1 (replica de la lógica del backend).
 *  - Siempre se opera sobre la fecha LOCAL Guayaquil, nunca UTC.
 */

const GYE_TZ = "America/Guayaquil";

function toLocalDate(date: Date): { year: number; month: number; day: number; dayOfWeek: number } {
  // Usa Intl para obtener componentes en TZ GYE
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: GYE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = weekdayMap[get("weekday")] ?? 0;
  return { year, month, day, dayOfWeek };
}

/** Returns [numero_semana, anio] for the given date (default: now), computed in GYE local time. */
export function calcularNumeroSemanaAnio(date: Date = new Date()): [number, number] {
  const { year, month, day, dayOfWeek } = toLocalDate(date);

  // Día del año (1-indexed) en TZ local
  const localDate = new Date(Date.UTC(year, month - 1, day));
  const firstDayLocal = new Date(Date.UTC(year, 0, 1));
  const dayOfYear =
    Math.floor((localDate.getTime() - firstDayLocal.getTime()) / 86_400_000) + 1;

  // Día de la semana del 1 de enero (0 = domingo)
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1Local = toLocalDate(jan1);
  const jan1Dow = jan1Local.dayOfWeek;

  // Cálculo equivalente a strftime("%U"):
  // weeks = (day_of_year - 1 - day_of_week + jan1_dow) / 7
  let numero = Math.floor((dayOfYear - 1 - dayOfWeek + jan1Dow) / 7) + (dayOfWeek === 0 ? 1 : 0);
  // Reproducimos el comportamiento exacto de %U: número de domingos transcurridos.
  // Una forma más directa: cuenta cuántos domingos ha habido desde el 1 de enero hasta la fecha.
  const ms = 86_400_000;
  let count = 0;
  const target = Date.UTC(year, month - 1, day);
  for (let t = Date.UTC(year, 0, 1); t <= target; t += ms) {
    const d = new Date(t);
    const dLocal = toLocalDate(d);
    if (dLocal.dayOfWeek === 0 && Date.UTC(dLocal.year, dLocal.month - 1, dLocal.day) <= target) {
      count++;
    }
  }
  numero = count;

  if (numero === 0) numero = 1;
  return [numero, year];
}

/** Returns [start, end] of the week (sunday-saturday) as Date in UTC representing local GYE midnight. */
export function calcularRangoSemana(date: Date = new Date()): [Date, Date] {
  const { year, month, day, dayOfWeek } = toLocalDate(date);
  // dayOfWeek: 0=Sun..6=Sat
  // Inicio = domingo de la semana en curso
  const startMs = Date.UTC(year, month - 1, day) - dayOfWeek * 86_400_000;
  const endMs = startMs + 6 * 86_400_000;
  return [new Date(startMs), new Date(endMs)];
}

const MESES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function descripcionSemana(date: Date = new Date()): string {
  const [start, end] = calcularRangoSemana(date);
  const [numero, year] = calcularNumeroSemanaAnio(date);
  const sLocal = toLocalDate(start);
  const eLocal = toLocalDate(end);
  return `Semana ${numero} (${sLocal.day} ${MESES_ES[sLocal.month - 1]} - ${eLocal.day} ${MESES_ES[eLocal.month - 1]} ${year})`;
}
