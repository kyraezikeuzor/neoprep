/** Shared interactive-control styles used across student practice surfaces. */
export const SELECTED_FILTER_STYLE = {
  borderColor: "#09b5ff",
  backgroundColor: "transparent",
  color: "#09b5ff",
} as const;

export function filterPillClass(selected: boolean) {
  return selected
    ? "min-h-11 rounded-xl border-2 px-4 py-2.5 font-sans text-sm font-medium transition"
    : "min-h-11 rounded-xl border border-arc-line bg-transparent px-4 py-2.5 font-sans text-sm font-medium text-arc-heading transition hover:bg-arc-soft";
}

