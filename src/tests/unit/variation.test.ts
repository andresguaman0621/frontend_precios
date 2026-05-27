import { checkUmbrales, computeVariation, evaluateVariation } from "@/utils/variation";

describe("variation utilities", () => {
  describe("computeVariation", () => {
    it("calcula alza correcta", () => {
      const { variacion, esAumento } = computeVariation(25, 20);
      expect(variacion).toBe(25);
      expect(esAumento).toBe(true);
    });

    it("calcula baja correcta", () => {
      const { variacion, esAumento } = computeVariation(15, 20);
      expect(variacion).toBe(-25);
      expect(esAumento).toBe(false);
    });

    it("devuelve null si precio anterior es null o 0", () => {
      expect(computeVariation(25, null).variacion).toBeNull();
      expect(computeVariation(25, 0).variacion).toBeNull();
    });
  });

  describe("checkUmbrales", () => {
    it("dispara alerta arriba del umbral superior", () => {
      const { hayAlerta } = checkUmbrales(50, -32, 34);
      expect(hayAlerta).toBe(true);
    });

    it("dispara alerta debajo del umbral inferior", () => {
      const { hayAlerta } = checkUmbrales(-40, -32, 34);
      expect(hayAlerta).toBe(true);
    });

    it("no dispara dentro del rango", () => {
      const { hayAlerta } = checkUmbrales(10, -32, 34);
      expect(hayAlerta).toBe(false);
    });

    it("usa default cuando umbrales son null", () => {
      const { hayAlerta } = checkUmbrales(50, null, null);
      expect(hayAlerta).toBe(true);
    });
  });

  describe("evaluateVariation", () => {
    it("combina cálculo + alerta + mensaje", () => {
      const result = evaluateVariation(30, 20, -32, 34);
      expect(result.variacion).toBe(50);
      expect(result.hayAlerta).toBe(true);
      expect(result.esAumento).toBe(true);
      expect(result.mensaje).toContain("alza");
    });

    it("mensaje 'baja' al disminuir bruscamente", () => {
      const result = evaluateVariation(10, 20, -32, 34);
      expect(result.hayAlerta).toBe(true);
      expect(result.mensaje).toContain("baja");
    });
  });
});
