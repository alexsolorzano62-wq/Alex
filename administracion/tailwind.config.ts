import type { Config } from "tailwindcss";

// La identidad sale del logo de la inmobiliaria: el verde del isotipo y la
// serif del logotipo. Nada de azul genérico de plantilla.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        marca: {
          50: "#eef8f1",
          100: "#d5eddd",
          200: "#a9dcbb",
          300: "#72c691",
          400: "#41ad6a",
          500: "#1a9b3e",
          600: "#158034",
          700: "#12662b",
          800: "#0f5124",
          900: "#0a3a19",
        },
      },
      fontFamily: {
        titulo: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
