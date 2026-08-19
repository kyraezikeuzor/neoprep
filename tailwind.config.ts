import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        arc: {
          bg: "#FFFFFF",
          ink: "#18181B",
          heading: "#3F3F46",
          muted: "#8B8B93",
          line: "#E4E4E7",
          soft: "#F4F4F5",
          accent: "#2563EB",
          accentDeep: "#1D4ED8",
          accentSoft: "#EFF6FF",
          correct: "#15803D",
          correctBg: "#F0FDF4",
          incorrect: "#B91C1C",
          incorrectBg: "#FEF2F2",
          sidebar: "#1BB1F6",
          sidebarBorder: "#1BB1F6",
          sidebarText: "#FFFFFF",
          sidebarMuted: "rgba(255,255,255,0.65)",
          sidebarActive: "rgba(255,255,255,0.18)",
          sidebarActiveText: "#FFFFFF",
          sidebarHover: "rgba(255,255,255,0.12)",
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
