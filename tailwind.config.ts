import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        arc: {
          bg: "#FAFAF9",
          ink: "#161616",
          muted: "#374151",
          line: "#E5E5E3",
          accent: "#007AFF",
          accentDeep: "#0066DD",
          correct: "#2E7D32",
          correctBg: "#F1FAF3",
          incorrect: "#C4372D",
          incorrectBg: "#FCEDEC",
          sidebar: "#007AFF",
          sidebarMuted: "#FFFFFFBF",
        },
      },
      fontFamily: {
        display: ["'Noto Serif'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        dm: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        arc: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
