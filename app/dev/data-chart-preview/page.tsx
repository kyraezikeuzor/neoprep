"use client";

import DataChart, { type DataChartSpec } from "@/components/graphs/DataChart";

/** Temporary hand-test page for DataChart — safe to delete once verified. */
const AERIAL_ROBOTS: DataChartSpec = {
  type: "data_chart",
  chart_type: "bar",
  title: "Weight of Three Aerial Robots",
  x_label: "Robot",
  y_label: "Weight (grams)",
  categories: [
    "Ultra-Fast Robot Hand",
    "Permanent Magnet Hand",
    "Yale Model T",
  ],
  series: [{ name: "Weight", values: [520, 480, 410] }],
};

export default function DataChartPreviewPage() {
  return (
    <div className="min-h-screen bg-arc-bg px-8 py-10">
      <div className="mx-auto max-w-2xl rounded-arc border border-arc-line bg-white p-6">
        <h1 className="mb-4 font-display text-lg font-semibold text-arc-ink">
          DataChart preview
        </h1>
        <DataChart spec={AERIAL_ROBOTS} />
      </div>
    </div>
  );
}
