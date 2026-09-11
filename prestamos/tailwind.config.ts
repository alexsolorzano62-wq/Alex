import type { Config } from "tailwindcss";

const config: Config = {
  // El tema oscuro se activa con una clase en <html>, que la pone el servidor
  // según lo que el usuario eligió. Así no hay parpadeo al cargar.
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Los azules de Facebook: el 500 es su azul de marca.
        brand: {
          50: "#e7f3ff",
          100: "#d4e7fd",
          200: "#a8cfff",
          300: "#7ab3ff",
          400: "#4a9bff",
          500: "#1877f2",
          600: "#0866ff",
          700: "#0653c7",
          800: "#063f96",
          900: "#0a2e6b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
