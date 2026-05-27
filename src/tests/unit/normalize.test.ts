import { matches, normalize } from "@/utils/normalize";

describe("normalize", () => {
  it("quita acentos", () => {
    expect(normalize("Açaí")).toBe("acai");
    expect(normalize("Cebolla colorada")).toBe("cebolla colorada");
    expect(normalize("Ñame")).toBe("name");
  });

  it("baja a minúsculas y trim", () => {
    expect(normalize("  HOLA  ")).toBe("hola");
  });
});

describe("matches", () => {
  it("encuentra ignorando acentos y case", () => {
    expect(matches("Plátano maduro", "PLATANO")).toBe(true);
    expect(matches("Plátano maduro", "ÁTanO ")).toBe(true);
  });

  it("aguja vacía devuelve true", () => {
    expect(matches("cualquiera", "")).toBe(true);
  });

  it("no coincide", () => {
    expect(matches("Plátano", "manzana")).toBe(false);
  });
});
