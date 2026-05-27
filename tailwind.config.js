/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#27357d",
          dark: "#1E2A66",
          50: "#EEF0F8",
          100: "#D5DAEC",
          200: "#A9B2D6",
          300: "#7C8AC0",
          400: "#5063AB",
          500: "#27357d",
          600: "#1E2A66",
          700: "#161F4B",
          800: "#0F1532",
          900: "#070A19",
        },
        mmqep: {
          azul: "#0B2C5D",
          rojo: "#C00000",
          verde: "#0B6623",
        },
        gris: {
          fondo: "#F5F5F5",
        },
        texto: {
          principal: "#111827",
          secundario: "#6B7280",
        },
        success: {
          50: "#ECFDF5",
          300: "#6EE7B7",
          500: "#10B981",
          700: "#047857",
        },
        warning: {
          50: "#FFFBEB",
          300: "#FCD34D",
          500: "#F59E0B",
          700: "#B45309",
        },
        danger: {
          50: "#FEF2F2",
          300: "#FCA5A5",
          500: "#EF4444",
          700: "#B91C1C",
        },
      },
    },
  },
  plugins: [],
};
