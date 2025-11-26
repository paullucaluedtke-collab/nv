import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          black: "#000000",
          white: "#ffffff",
          soft: "#f5f5f7",
        },
        ink: {
          default: "#0a0a0a",
          muted: "#6f6f6f",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      letterSpacing: {
        apple: "0.015em",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0, 0, 0, 0.06)",
        "subtle-hover": "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
      transitionTimingFunction: {
        "soft-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;

