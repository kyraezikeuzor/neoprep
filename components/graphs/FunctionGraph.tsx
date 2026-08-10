"use client";

export type FunctionGraphSpec = {
  type: "function_graph";
  viewport: {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
  };
  expressions: string[];
  highlight_points?: Array<{
    x: number;
    y: number;
    label?: string | null;
  }>;
};

const STROKE = "#161616";
const MUTED = "#6B7280";
/** Thin black grid — matches College Board / SAT coordinate planes */
const GRID = "#161616";
const GRID_OPACITY = 0.45;
const WIDTH = 360;
const HEIGHT = 260;
const PAD = 28;
const SAMPLES = 240;

const CURVE_STYLES = [
  { stroke: STROKE, dash: undefined as string | undefined },
  { stroke: MUTED, dash: "4 3" },
  { stroke: "#9CA3AF", dash: "2 3" },
];

/** Compile a SAT-style `y = ...` expression into an evaluator.
 * Supports polynomials with ^, implicit multiplication (4x, 4x^2), +, -, *, /. */
function compileExpression(raw: string): ((x: number) => number) | null {
  let rhs = raw.trim();
  const eq = rhs.match(/^y\s*=\s*(.+)$/i);
  if (eq) rhs = eq[1].trim();
  if (!rhs) return null;

  rhs = rhs.replace(/\s+/g, "");
  rhs = rhs.replace(/\^/g, "**");
  // implicit multiplication: 4x, 4(x), x(, )(, )x
  rhs = rhs.replace(/(\d)(x)/gi, "$1*$2");
  rhs = rhs.replace(/(\d)\(/g, "$1*(");
  rhs = rhs.replace(/x\(/gi, "x*(");
  rhs = rhs.replace(/\)\(/g, ")*(");
  rhs = rhs.replace(/\)(x)/gi, ")*$1");
  rhs = rhs.replace(/x(x)/gi, "x*$1");

  // only allow safe math tokens after rewriting
  if (!/^[0-9xX+\-*/().]+$/.test(rhs)) return null;

  try {
    // eslint-disable-next-line no-new-func -- expression sandbox; chars validated above
    const fn = new Function("x", `"use strict"; return (${rhs});`) as (x: number) => unknown;
    return (x: number) => {
      try {
        const y = fn(x);
        return typeof y === "number" && Number.isFinite(y) ? y : Number.NaN;
      } catch {
        return Number.NaN;
      }
    };
  } catch {
    return null;
  }
}

function mapX(x: number, xmin: number, xmax: number) {
  return PAD + ((x - xmin) / (xmax - xmin)) * (WIDTH - 2 * PAD);
}

function mapY(y: number, ymin: number, ymax: number) {
  return PAD + ((ymax - y) / (ymax - ymin)) * (HEIGHT - 2 * PAD);
}

function niceTicks(min: number, max: number, target = 6): number[] {
  const span = max - min;
  if (!(span > 0)) return [min];
  const raw = span / target;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const err = raw / pow;
  const step = (err >= 5 ? 5 : err >= 2 ? 2 : 1) * pow;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-9; v += step) {
    const rounded = Math.abs(v) < step * 1e-9 ? 0 : Number(v.toPrecision(8));
    if (rounded >= min - 1e-9 && rounded <= max + 1e-9) ticks.push(rounded);
  }
  return ticks;
}

function buildPath(
  fn: (x: number) => number,
  viewport: FunctionGraphSpec["viewport"]
): string {
  const { xmin, xmax, ymin, ymax } = viewport;
  const parts: string[] = [];
  let drawing = false;

  for (let i = 0; i <= SAMPLES; i++) {
    const x = xmin + ((xmax - xmin) * i) / SAMPLES;
    const y = fn(x);
    if (!Number.isFinite(y) || y < ymin - (ymax - ymin) || y > ymax + (ymax - ymin)) {
      drawing = false;
      continue;
    }
    // clip slightly outside so steep slopes still connect near edges
    const cy = Math.min(ymax + (ymax - ymin) * 0.05, Math.max(ymin - (ymax - ymin) * 0.05, y));
    const sx = mapX(x, xmin, xmax);
    const sy = mapY(cy, ymin, ymax);
    if (!drawing) {
      parts.push(`M ${sx} ${sy}`);
      drawing = true;
    } else {
      parts.push(`L ${sx} ${sy}`);
    }
  }
  return parts.join(" ");
}

function formatTick(n: number) {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(4)));
}

export default function FunctionGraph({ spec }: { spec: FunctionGraphSpec }) {
  const viewport = spec.viewport ?? { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };
  const { xmin, xmax, ymin, ymax } = viewport;
  const expressions = Array.isArray(spec.expressions) ? spec.expressions : [];
  const highlights = Array.isArray(spec.highlight_points) ? spec.highlight_points : [];

  const x0 = xmin < 0 && xmax > 0 ? mapX(0, xmin, xmax) : null;
  const y0 = ymin < 0 && ymax > 0 ? mapY(0, ymin, ymax) : null;
  const xticks = niceTicks(xmin, xmax);
  const yticks = niceTicks(ymin, ymax);

  const curves = expressions.map((expr, i) => {
    const fn = compileExpression(expr);
    return {
      expr,
      path: fn ? buildPath(fn, viewport) : "",
      style: CURVE_STYLES[i % CURVE_STYLES.length],
    };
  });

  return (
    <div className="my-4 flex flex-col items-center">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mx-auto h-auto w-full max-w-md rounded-md border border-arc-line bg-white"
        role="img"
        aria-label="Function graph"
      >
        {/* grid */}
        {xticks.map((t) => {
          const x = mapX(t, xmin, xmax);
          return (
            <line
              key={`vg${t}`}
              x1={x}
              y1={PAD}
              x2={x}
              y2={HEIGHT - PAD}
              stroke={GRID}
              strokeOpacity={GRID_OPACITY}
              strokeWidth={0.75}
            />
          );
        })}
        {yticks.map((t) => {
          const y = mapY(t, ymin, ymax);
          return (
            <line
              key={`hg${t}`}
              x1={PAD}
              y1={y}
              x2={WIDTH - PAD}
              y2={y}
              stroke={GRID}
              strokeOpacity={GRID_OPACITY}
              strokeWidth={0.75}
            />
          );
        })}

        {/* axes */}
        {y0 != null && (
          <line x1={PAD} y1={y0} x2={WIDTH - PAD} y2={y0} stroke={STROKE} strokeWidth={1.25} />
        )}
        {x0 != null && (
          <line x1={x0} y1={PAD} x2={x0} y2={HEIGHT - PAD} stroke={STROKE} strokeWidth={1.25} />
        )}

        {/* tick labels */}
        {xticks.map((t) => {
          if (t === 0) return null;
          const x = mapX(t, xmin, xmax);
          const y = y0 ?? HEIGHT - PAD;
          return (
            <text
              key={`xl${t}`}
              x={x}
              y={y + 14}
              fontSize={10}
              fill={MUTED}
              textAnchor="middle"
              fontFamily="'Noto Serif', Georgia, serif"
            >
              {formatTick(t)}
            </text>
          );
        })}
        {yticks.map((t) => {
          if (t === 0) return null;
          const y = mapY(t, ymin, ymax);
          const x = x0 ?? PAD;
          return (
            <text
              key={`yl${t}`}
              x={x - 8}
              y={y + 3}
              fontSize={10}
              fill={MUTED}
              textAnchor="end"
              fontFamily="'Noto Serif', Georgia, serif"
            >
              {formatTick(t)}
            </text>
          );
        })}

        {/* curves */}
        {curves.map((c, i) =>
          c.path ? (
            <path
              key={`${c.expr}-${i}`}
              d={c.path}
              fill="none"
              stroke={c.style.stroke}
              strokeWidth={2}
              strokeDasharray={c.style.dash}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null
        )}

        {/* highlight points */}
        {highlights.map((p, i) => {
          const cx = mapX(p.x, xmin, xmax);
          const cy = mapY(p.y, ymin, ymax);
          const label = p.label?.trim();
          return (
            <g key={`pt-${i}`}>
              <circle cx={cx} cy={cy} r={4} fill={STROKE} />
              <circle cx={cx} cy={cy} r={4} fill="none" stroke="#fff" strokeWidth={1.5} />
              {label ? (
                <text
                  x={cx + 8}
                  y={cy - 8}
                  fontSize={11}
                  fill={STROKE}
                  fontFamily="'Noto Serif', Georgia, serif"
                >
                  {label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {expressions.length > 1 && (
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-arc-muted">
          {expressions.map((expr, i) => (
            <span key={expr} className="inline-flex items-center gap-1.5 font-display">
              <span
                className="inline-block h-0.5 w-4"
                style={{
                  background: CURVE_STYLES[i % CURVE_STYLES.length].stroke,
                  borderTop: CURVE_STYLES[i % CURVE_STYLES.length].dash
                    ? `1.5px dashed ${CURVE_STYLES[i % CURVE_STYLES.length].stroke}`
                    : undefined,
                  backgroundColor: CURVE_STYLES[i % CURVE_STYLES.length].dash
                    ? "transparent"
                    : CURVE_STYLES[i % CURVE_STYLES.length].stroke,
                }}
              />
              {expr}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
