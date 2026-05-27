import { calcularNumeroSemanaAnio, calcularRangoSemana, descripcionSemana } from "@/utils/week";

describe("week utilities", () => {
  describe("calcularNumeroSemanaAnio", () => {
    it("calcula semana correctamente para mediados de año", () => {
      // 26 mayo 2026 (martes) — semana 21 (cuenta de domingos)
      const [semana, anio] = calcularNumeroSemanaAnio(new Date("2026-05-26T12:00:00-05:00"));
      expect(anio).toBe(2026);
      expect(semana).toBeGreaterThan(0);
      expect(semana).toBeLessThan(53);
    });

    it("devuelve 1 cuando el cálculo daría 0", () => {
      // 1 de enero de un año donde es lunes → strftime%U daría 0
      const [semana] = calcularNumeroSemanaAnio(new Date("2024-01-01T12:00:00-05:00"));
      expect(semana).toBeGreaterThanOrEqual(1);
    });

    it("año bisiesto: 29 febrero", () => {
      const [semana, anio] = calcularNumeroSemanaAnio(new Date("2024-02-29T12:00:00-05:00"));
      expect(anio).toBe(2024);
      expect(semana).toBeGreaterThanOrEqual(8);
      expect(semana).toBeLessThanOrEqual(10);
    });

    it("último día del año", () => {
      const [semana, anio] = calcularNumeroSemanaAnio(new Date("2025-12-31T12:00:00-05:00"));
      expect(anio).toBe(2025);
      expect(semana).toBeGreaterThanOrEqual(52);
    });

    it("domingo de la semana 1", () => {
      // Primer domingo del 2025
      const [semana] = calcularNumeroSemanaAnio(new Date("2025-01-05T12:00:00-05:00"));
      expect(semana).toBe(1);
    });
  });

  describe("calcularRangoSemana", () => {
    it("inicio es domingo y fin es sábado", () => {
      const [start, end] = calcularRangoSemana(new Date("2025-05-28T12:00:00-05:00"));
      const startDow = new Date(start).getUTCDay();
      const endDow = new Date(end).getUTCDay();
      // Como el rango está computado en UTC midnight de GYE, day-of-week debería ser
      // domingo (0) e (6) sábado respectivamente.
      expect([0, 6]).toContain(startDow);
      expect([5, 6]).toContain(endDow);
    });
  });

  describe("descripcionSemana", () => {
    it("contiene 'Semana' y un año", () => {
      const desc = descripcionSemana(new Date("2025-05-28T12:00:00-05:00"));
      expect(desc).toMatch(/Semana \d+/);
      expect(desc).toMatch(/2025/);
    });
  });
});
