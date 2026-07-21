import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep warm charcoal base with a single amber accent — "terminal editorial".
        ink: {
          DEFAULT: "#0d0c0b",
          soft: "#151311",
          raised: "#1c1a17",
          line: "#2a2723",
        },
        paper: {
          DEFAULT: "#f4efe6", // warm off-white text
          dim: "#a8a196",
          faint: "#6f685e",
        },
        amber: {
          DEFAULT: "#e8a13a",
          soft: "#f0c17a",
          deep: "#b97a1e",
        },
        moss: "#7c9a6d", // secondary accent for success/tags
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "blink": "blink 1.1s step-end infinite",
      },
    },
  },
  plugins: [],
};

export default config;
