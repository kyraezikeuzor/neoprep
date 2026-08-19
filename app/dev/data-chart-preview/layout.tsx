import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chart Preview · Tutormigo",
};

export default function DataChartPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
