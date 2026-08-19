import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chart Preview · NeoPrep",
};

export default function DataChartPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
