import { average, isValidPrice, parseDecimal, roundTo } from "@/utils/decimal";

describe("decimal utilities", () => {
  describe("parseDecimal", () => {
    it("parsea string con punto", () => {
      expect(parseDecimal("25.50")).toBe(25.5);
    });

    it("parsea string con coma", () => {
      expect(parseDecimal("1,5")).toBe(1.5);
    });

    it("ignora símbolo $ y espacios", () => {
      expect(parseDecimal("$ 25.50")).toBe(25.5);
      expect(parseDecimal(" 100 ")).toBe(100);
    });

    it("devuelve null para vacío o inválido", () => {
      expect(parseDecimal("")).toBeNull();
      expect(parseDecimal("abc")).toBeNull();
      expect(parseDecimal(null)).toBeNull();
      expect(parseDecimal(undefined)).toBeNull();
    });

    it("acepta números directamente", () => {
      expect(parseDecimal(42)).toBe(42);
      expect(parseDecimal(NaN)).toBeNull();
      expect(parseDecimal(Infinity)).toBeNull();
    });
  });

  describe("isValidPrice", () => {
    it("acepta precios en rango", () => {
      expect(isValidPrice(0.01)).toBe(true);
      expect(isValidPrice(25.5)).toBe(true);
      expect(isValidPrice(9999.99)).toBe(true);
    });

    it("rechaza fuera de rango", () => {
      expect(isValidPrice(0)).toBe(false);
      expect(isValidPrice(-1)).toBe(false);
      expect(isValidPrice(10000)).toBe(false);
      expect(isValidPrice(null)).toBe(false);
    });
  });

  describe("roundTo", () => {
    it("redondea a N decimales", () => {
      expect(roundTo(1.235, 2)).toBe(1.24);
      expect(roundTo(1.234, 2)).toBe(1.23);
      expect(roundTo(0, 2)).toBe(0);
    });
  });

  describe("average", () => {
    it("promedia ignorando nulls", () => {
      expect(average([10, 20, 30])).toBe(20);
      expect(average([10, null, 30])).toBe(20);
      expect(average([10, 20, null])).toBe(15);
    });

    it("devuelve null si todos son null", () => {
      expect(average([null, null, null])).toBeNull();
      expect(average([])).toBeNull();
    });

    it("redondea a 2 decimales", () => {
      expect(average([1, 2, 2])).toBe(1.67);
    });
  });
});
