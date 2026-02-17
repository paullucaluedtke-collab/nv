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
        brand: {
          DEFAULT: "#2979FF",
          hover: "#1F63E0",
          soft: "#D9E6FF",
          subtle: "#ECF3FF",
          dark: "#174EB6",
        },
        // Anti-Gravity Palette
        void: {
          DEFAULT: "#020204", // Deepest void
          light: "#08080A",
          lighter: "#121214",
          card: "rgba(20, 20, 25, 0.4)",
        },
        electric: {
          DEFAULT: "#2979FF",
          vivid: "#3B82F6",
          glow: "#60A5FA",
        },
        neon: {
          purple: "#8B5CF6",
          pink: "#EC4899",
          cyan: "#06B6D4",
        },
        surface: {
          DEFAULT: "#050505",
          soft: "#111111",
          softer: "#181818",
          card: "#0D0D0D",
        },
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
          "Outfit", // Prioritize Outfit if available
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
        brandSoft: "0 18px 45px rgba(0,0,0,0.45)",
        pill: "0 8px 30px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        pill: "9999px",
        card: "24px",
      },
      transitionTimingFunction: {
        "soft-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;

