"use client";

export type GeometryFigureSpec = {
  type: "geometry_figure";
  shape: "triangle" | "right_triangle" | "circle";
  vertices?: Record<string, [number, number]>;
  center?: [number, number];
  radius?: number;
  labels?: Record<string, string | null>;
  note?: string;
};

const PADDING = 2.5; // in the same units as the vertex/radius coordinates
const LABEL_OFFSET = 0.9;
const RIGHT_ANGLE_SIZE = 0.7;
const STROKE = "#161616"; // arc-ink

function normalize([x, y]: [number, number]): [number, number] {
  const m = Math.hypot(x, y);
  return m > 0 ? [x / m, y / m] : [0, 0];
}

function midpoint(p1: [number, number], p2: [number, number]): [number, number] {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
}

function dist(a: [number, number], b: [number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Vertex-space coordinates are "math style" (y increases upward, natural
 * for anyone hand-writing a graph_spec). SVG's y-axis increases downward,
 * so every coordinate gets flipped on the way in - this keeps graph_spec
 * authoring intuitive without leaking SVG's inverted-y quirk into the data. */
function toSvg([x, y]: [number, number]): [number, number] {
  return [x, -y];
}

function TriangleFigure({ spec }: { spec: GeometryFigureSpec }) {
  const vertices = spec.vertices!;
  const labels = spec.labels ?? {};
  const names = Object.keys(vertices);
  const points = names.map((n) => vertices[n]);
  const centroidMath: [number, number] = [
    points.reduce((s, p) => s + p[0], 0) / points.length,
    points.reduce((s, p) => s + p[1], 0) / points.length,
  ];

  const svgPoints = names.map((n) => toSvg(vertices[n]));
  const xs = svgPoints.map((p) => p[0]);
  const ys = svgPoints.map((p) => p[1]);
  const minX = Math.min(...xs) - PADDING;
  const maxX = Math.max(...xs) + PADDING;
  const minY = Math.min(...ys) - PADDING;
  const maxY = Math.max(...ys) + PADDING;

  const polygonPoints = svgPoints.map((p) => p.join(",")).join(" ");

  // edge labels: midpoint, offset outward (away from centroid) perpendicular to the edge
  const edgeLabels: { pos: [number, number]; text: string }[] = [];
  // vertex-name labels for angles / right-angle marker
  const angleMarkers: { vertex: string; pos: [number, number] }[] = [];
  const angleLabels: { pos: [number, number]; text: string }[] = [];

  for (const [key, text] of Object.entries(labels)) {
    if (!text) continue;
    if (key.startsWith("angle_")) {
      const vName = key.replace("angle_", "");
      if (!vertices[vName]) continue;
      const others = names.filter((n) => n !== vName);
      if (others.length < 2) continue;
      const toA = normalize([
        vertices[others[0]][0] - vertices[vName][0],
        vertices[others[0]][1] - vertices[vName][1],
      ]);
      const toB = normalize([
        vertices[others[1]][0] - vertices[vName][0],
        vertices[others[1]][1] - vertices[vName][1],
      ]);
      const bisector = normalize([toA[0] + toB[0], toA[1] + toB[1]]);
      const mathPos: [number, number] = [
        vertices[vName][0] + bisector[0] * LABEL_OFFSET,
        vertices[vName][1] + bisector[1] * LABEL_OFFSET,
      ];
      if (text === "90\u00b0") {
        angleMarkers.push({ vertex: vName, pos: vertices[vName] });
      }
      angleLabels.push({ pos: toSvg(mathPos), text });
    } else if (key.length === 2 && vertices[key[0]] && vertices[key[1]]) {
      const p1 = vertices[key[0]];
      const p2 = vertices[key[1]];
      const mid = midpoint(p1, p2);
      const edgeDir = [p2[0] - p1[0], p2[1] - p1[1]] as [number, number];
      const perp = normalize([-edgeDir[1], edgeDir[0]]);
      const plus: [number, number] = [mid[0] + perp[0], mid[1] + perp[1]];
      const minus: [number, number] = [mid[0] - perp[0], mid[1] - perp[1]];
      const outward = dist(plus, centroidMath) > dist(minus, centroidMath) ? perp : [-perp[0], -perp[1]];
      const mathPos: [number, number] = [
        mid[0] + outward[0] * LABEL_OFFSET,
        mid[1] + outward[1] * LABEL_OFFSET,
      ];
      edgeLabels.push({ pos: toSvg(mathPos), text });
    }
  }

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      className="mx-auto h-auto w-full max-w-xs"
    >
      <polygon points={polygonPoints} fill="none" stroke={STROKE} strokeWidth={0.08} />

      {spec.shape === "right_triangle" &&
        angleMarkers.map(({ vertex, pos }) => {
          const others = names.filter((n) => n !== vertex);
          const d1 = normalize([
            vertices[others[0]][0] - pos[0],
            vertices[others[0]][1] - pos[1],
          ]);
          const d2 = normalize([
            vertices[others[1]][0] - pos[0],
            vertices[others[1]][1] - pos[1],
          ]);
          const svgPos = toSvg(pos);
          const c1 = toSvg([pos[0] + d1[0] * RIGHT_ANGLE_SIZE, pos[1] + d1[1] * RIGHT_ANGLE_SIZE]);
          const c2 = toSvg([pos[0] + d2[0] * RIGHT_ANGLE_SIZE, pos[1] + d2[1] * RIGHT_ANGLE_SIZE]);
          const corner = toSvg([
            pos[0] + (d1[0] + d2[0]) * RIGHT_ANGLE_SIZE,
            pos[1] + (d1[1] + d2[1]) * RIGHT_ANGLE_SIZE,
          ]);
          return (
            <polyline
              key={vertex}
              points={`${c1.join(",")} ${corner.join(",")} ${c2.join(",")}`}
              fill="none"
              stroke={STROKE}
              strokeWidth={0.06}
            />
          );
        })}

      {names.map((n) => {
        const p = toSvg(vertices[n]);
        const dirFromCentroid = normalize([vertices[n][0] - centroidMath[0], vertices[n][1] - centroidMath[1]]);
        const labelPos = toSvg([
          vertices[n][0] + dirFromCentroid[0] * 0.7,
          vertices[n][1] + dirFromCentroid[1] * 0.7,
        ]);
        return (
          <g key={n}>
            <circle cx={p[0]} cy={p[1]} r={0.06} fill={STROKE} />
            <text x={labelPos[0]} y={labelPos[1]} fontSize={0.85} fill={STROKE} textAnchor="middle" fontStyle="italic">
              {n}
            </text>
          </g>
        );
      })}

      {edgeLabels.map((l, i) => (
        <text key={`e${i}`} x={l.pos[0]} y={l.pos[1]} fontSize={0.75} fill={STROKE} textAnchor="middle">
          {l.text}
        </text>
      ))}
      {angleLabels.map((l, i) => (
        <text key={`a${i}`} x={l.pos[0]} y={l.pos[1]} fontSize={0.65} fill={STROKE} textAnchor="middle">
          {l.text}
        </text>
      ))}
    </svg>
  );
}

function CircleFigure({ spec }: { spec: GeometryFigureSpec }) {
  const center = spec.center ?? [0, 0];
  const radius = spec.radius ?? 1;
  const labels = spec.labels ?? {};
  const svgCenter = toSvg(center);
  const size = radius + PADDING;

  const radiusLabel = labels.radius;
  const pointLabel = labels.point_on_circle;

  return (
    <svg
      viewBox={`${svgCenter[0] - size} ${svgCenter[1] - size} ${size * 2} ${size * 2}`}
      className="mx-auto h-auto w-full max-w-xs"
    >
      <circle cx={svgCenter[0]} cy={svgCenter[1]} r={radius} fill="none" stroke={STROKE} strokeWidth={0.08} />
      <circle cx={svgCenter[0]} cy={svgCenter[1]} r={0.06} fill={STROKE} />

      {radiusLabel && (
        <>
          <line
            x1={svgCenter[0]}
            y1={svgCenter[1]}
            x2={svgCenter[0] + radius}
            y2={svgCenter[1]}
            stroke={STROKE}
            strokeWidth={0.06}
          />
          <text
            x={svgCenter[0] + radius / 2}
            y={svgCenter[1] - 0.3}
            fontSize={0.75}
            fill={STROKE}
            textAnchor="middle"
          >
            {radiusLabel}
          </text>
        </>
      )}
      {pointLabel && (
        <text
          x={svgCenter[0] + radius + 0.6}
          y={svgCenter[1]}
          fontSize={0.85}
          fill={STROKE}
          textAnchor="middle"
          fontStyle="italic"
        >
          {pointLabel}
        </text>
      )}
    </svg>
  );
}

export default function GeometryFigure({ spec }: { spec: GeometryFigureSpec }) {
  return (
    <div className="my-4 flex flex-col items-center">
      {spec.shape === "circle" ? <CircleFigure spec={spec} /> : <TriangleFigure spec={spec} />}
      {spec.note && <p className="mt-2 text-xs italic text-arc-muted">{spec.note}</p>}
    </div>
  );
}