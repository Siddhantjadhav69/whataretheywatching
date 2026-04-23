import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#05060a",
        panel: "#101116",
        line: "rgba(255,255,255,0.10)",
        flame: "#ff4d2e",
        gold: "#f3c969",
        mint: "#5eead4"
      },
      boxShadow: {
        glow: "0 18px 80px rgba(255, 77, 46, 0.22)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
