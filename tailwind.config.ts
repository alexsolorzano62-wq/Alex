import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eafaf1",
          100: "#cdf0dc",
          200: "#9de0bc",
          500: "#159a48",
          600: "#0e7c39",
          700: "#0a5c2b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
