import {
  changePasswordSchema,
  evaluatePasswordStrength,
  loginSchema,
} from "@/schemas/auth";

describe("loginSchema", () => {
  it("requiere username de al menos 3 chars", () => {
    const res = loginSchema.safeParse({ username: "ab", password: "x" });
    expect(res.success).toBe(false);
  });

  it("acepta credenciales válidas", () => {
    const res = loginSchema.safeParse({ username: "supervisor1", password: "secret" });
    expect(res.success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("rechaza si new y confirm no coinciden", () => {
    const res = changePasswordSchema.safeParse({
      old_password: "old",
      new_password: "newpassword1",
      confirm_password: "different1",
    });
    expect(res.success).toBe(false);
  });

  it("acepta si todo coincide y new >= 8 chars", () => {
    const res = changePasswordSchema.safeParse({
      old_password: "old",
      new_password: "newpassword1",
      confirm_password: "newpassword1",
    });
    expect(res.success).toBe(true);
  });

  it("rechaza si new < 8 chars", () => {
    const res = changePasswordSchema.safeParse({
      old_password: "old",
      new_password: "short",
      confirm_password: "short",
    });
    expect(res.success).toBe(false);
  });
});

describe("evaluatePasswordStrength", () => {
  it("muy débil para corta", () => {
    const r = evaluatePasswordStrength("abc");
    expect(r.score).toBe(0);
  });

  it("aumenta con variedad", () => {
    const r = evaluatePasswordStrength("Password1!");
    expect(r.score).toBeGreaterThanOrEqual(3);
  });

  it("muy fuerte con todo", () => {
    const r = evaluatePasswordStrength("MyP@ssw0rd!12345");
    expect(r.score).toBe(4);
  });
});
