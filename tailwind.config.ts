import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080b0e",
        panel: {
          DEFAULT: "#0e1318",
          subtle: "#121921",
          hover: "#17202a",
        },
        border: {
          DEFAULT: "#1a2530",
          glow: "#1e3a47",
          active: "#00f0ff",
        },
        text: {
          primary: "#e6edf3",
          secondary: "#8b949e",
          muted: "#525c68",
        },
        accent: {
          green: "#00ff66",
          cyan: "#00f0ff",
          emerald: "#10b981",
        },
        severity: {
          critical: "#ef4444",
          high: "#f97316",
          moderate: "#eab308",
          low: "#38bdf8",
          muted: "#64748b",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "IBM Plex Mono",
          "Space Mono",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-ping": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
