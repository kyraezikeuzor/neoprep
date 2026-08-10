"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

export type DataChartSpec = {
  type: "data_chart";
  chart_type: "bar" | "line" | "scatter";
  title?: string;
  x_label?: string;
  y_label?: string;
  categories?: string[];
  series: Array<{
    name: string;
    values: number[] | [number, number][];
  }>;
};

/** Grayscale only — SAT-style black/white charts, no brand color. */
const SERIES_FILLS = ["#161616", "#6B7280", "#A3A3A3", "#D4D4D4", "#FFFFFF"];
const SERIES_STROKES = ["#161616", "#161616", "#161616", "#161616", "#161616"];

const CHART_FONT = "'Noto Serif', Georgia, serif";
const AXIS_TICK = { fill: "#161616", fontSize: 12, fontFamily: CHART_FONT };
const AXIS_LABEL = { fill: "#161616", fontSize: 12, fontFamily: CHART_FONT };

function categoricalData(spec: DataChartSpec) {
  const categories = spec.categories ?? [];
  return categories.map((category, i) => {
    const row: Record<string, string | number> = { category };
    for (const s of spec.series) {
      const v = s.values[i];
      row[s.name] = typeof v === "number" ? v : Number.NaN;
    }
    return row;
  });
}

function scatterSeriesData(values: number[] | [number, number][]) {
  return values
    .filter((v): v is [number, number] => Array.isArray(v) && v.length >= 2)
    .map(([x, y]) => ({ x, y }));
}

function ChartTitle({ title }: { title?: string }) {
  if (!title) return null;
  return (
    <p className="mb-2 text-center font-display text-sm font-medium text-arc-ink">
      {title}
    </p>
  );
}

function BarOrLineChart({
  spec,
  kind,
}: {
  spec: DataChartSpec;
  kind: "bar" | "line";
}) {
  const data = categoricalData(spec);
  const Chart = kind === "bar" ? BarChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Chart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid stroke="#161616" strokeOpacity={0.35} />
        <XAxis
          dataKey="category"
          tick={AXIS_TICK}
          stroke="#161616"
          interval={0}
          angle={data.length > 3 ? -20 : 0}
          textAnchor={data.length > 3 ? "end" : "middle"}
          height={data.length > 3 ? 60 : 30}
          label={
            spec.x_label
              ? { value: spec.x_label, position: "insideBottom", offset: -2, ...AXIS_LABEL }
              : undefined
          }
        />
        <YAxis
          tick={AXIS_TICK}
          stroke="#161616"
          label={
            spec.y_label
              ? {
                  value: spec.y_label,
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", ...AXIS_LABEL },
                }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{
            borderColor: "#161616",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: CHART_FONT,
            background: "#FFFFFF",
            color: "#161616",
          }}
        />
        {spec.series.length > 1 ? (
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#161616", fontFamily: CHART_FONT }}
          />
        ) : null}
        {spec.series.map((s, i) => {
          const fill = SERIES_FILLS[i % SERIES_FILLS.length];
          const stroke = SERIES_STROKES[i % SERIES_STROKES.length];
          if (kind === "bar") {
            return (
              <Bar
                key={s.name}
                dataKey={s.name}
                fill={fill}
                stroke={stroke}
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
                maxBarSize={56}
              />
            );
          }
          return (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={stroke}
              strokeWidth={2}
              strokeDasharray={i === 0 ? undefined : i === 1 ? "6 3" : "2 2"}
              dot={{ r: 4, fill, stroke }}
              activeDot={{ r: 5, fill: stroke }}
            />
          );
        })}
      </Chart>
    </ResponsiveContainer>
  );
}

function ScatterPlot({ spec }: { spec: DataChartSpec }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid stroke="#161616" strokeOpacity={0.35} />
        <XAxis
          type="number"
          dataKey="x"
          name={spec.x_label ?? "x"}
          tick={AXIS_TICK}
          stroke="#161616"
          label={
            spec.x_label
              ? { value: spec.x_label, position: "insideBottom", offset: -2, ...AXIS_LABEL }
              : undefined
          }
        />
        <YAxis
          type="number"
          dataKey="y"
          name={spec.y_label ?? "y"}
          tick={AXIS_TICK}
          stroke="#161616"
          label={
            spec.y_label
              ? {
                  value: spec.y_label,
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", ...AXIS_LABEL },
                }
              : undefined
          }
        />
        <ZAxis range={[60, 60]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3", stroke: "#161616" }}
          contentStyle={{
            borderColor: "#161616",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: CHART_FONT,
            background: "#FFFFFF",
            color: "#161616",
          }}
        />
        {spec.series.length > 1 ? (
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#161616", fontFamily: CHART_FONT }}
          />
        ) : null}
        {spec.series.map((s, i) => {
          const fill = SERIES_FILLS[i % SERIES_FILLS.length];
          const stroke = SERIES_STROKES[i % SERIES_STROKES.length];
          return (
            <Scatter
              key={s.name}
              name={s.name}
              data={scatterSeriesData(s.values)}
              fill={fill}
              stroke={stroke}
            />
          );
        })}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default function DataChart({ spec }: { spec: DataChartSpec }) {
  return (
    <div className="my-4 w-full">
      <ChartTitle title={spec.title} />
      <div className="h-72 w-full">
        {spec.chart_type === "scatter" ? (
          <ScatterPlot spec={spec} />
        ) : (
          <BarOrLineChart spec={spec} kind={spec.chart_type} />
        )}
      </div>
    </div>
  );
}
