export const colors = {
  primary: "#27357d",
  primaryDark: "#1E2A66",
  azulOscuro: "#0B2C5D",
  rojoAlza: "#C00000",
  verdeBaja: "#0B6623",
  grisFondo: "#F5F5F5",
  textoPrincipal: "#111827",
  textoSecundario: "#6B7280",
  white: "#FFFFFF",
  black: "#000000",
  border: "#E5E7EB",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
} as const;

export type ColorKey = keyof typeof colors;
