"use client";

import DataChart, { type DataChartSpec } from "./DataChart";
import DataTable, { type DataTableSpec } from "./DataTable";
import FunctionGraph, { type FunctionGraphSpec } from "./FunctionGraph";
import GeometryFigure, { type GeometryFigureSpec } from "./GeometryFigure";

export type GraphSpec =
  | GeometryFigureSpec
  | FunctionGraphSpec
  | DataChartSpec
  | DataTableSpec;

export default function GraphRenderer({
  spec,
}: {
  spec: GraphSpec | null | undefined;
}) {
  if (!spec) return null;

  switch (spec.type) {
    case "geometry_figure":
      return <GeometryFigure spec={spec} />;
    case "function_graph":
      return <FunctionGraph spec={spec} />;
    case "data_chart":
      return <DataChart spec={spec} />;
    case "data_table":
      return <DataTable spec={spec} />;
    default:
      return null;
  }
}
