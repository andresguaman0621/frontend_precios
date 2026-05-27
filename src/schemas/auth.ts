import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres").max(150, "Máximo 150 caracteres"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Ingresa tu contraseña actual"),
    new_password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm_password: z.string().min(1, "Confirma la nueva contraseña"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Las contraseñas no coinciden",
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Muy débil" | "Débil" | "Media" | "Fuerte" | "Muy fuerte";
  color: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;

  const map: Record<0 | 1 | 2 | 3 | 4, { label: PasswordStrength["label"]; color: string }> = {
    0: { label: "Muy débil", color: "#EF4444" },
    1: { label: "Débil", color: "#F97316" },
    2: { label: "Media", color: "#F59E0B" },
    3: { label: "Fuerte", color: "#10B981" },
    4: { label: "Muy fuerte", color: "#059669" },
  };
  return { score: clamped, ...map[clamped] };
}
