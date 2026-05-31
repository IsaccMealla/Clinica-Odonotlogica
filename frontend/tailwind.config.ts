import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "clinica-primary": "#0F766E",
        "clinica-secondary": "#10B981",
        "clinica-accent": "#F59E0B",
        "clinica-bg": "#F8FAFC",
      },
    },
  },
  plugins: [],
};

export default config;
