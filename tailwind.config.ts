import type { Config } from "tailwindcss";
import { APP_GRAYS } from "./lib/typography";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arc: {
          bg: "#FFFFFF",
          ink: APP_GRAYS.ink,
          heading: APP_GRAYS.heading,
          muted: APP_GRAYS.muted,
          line: APP_GRAYS.line,
          soft: APP_GRAYS.surface,
          accent: "#09b5ff",
          accentDeep: "#0890d4",
          accentSoft: "#E5F7FF",
          correct: "#15803D",
          correctBg: "#F0FDF4",
          incorrect: "#B91C1C",
          incorrectBg: "#FEF2F2",
          sidebar: "#18779f",
          sidebarBorder: "#18779f",
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
