"use client";

export type DataTableSpec = {
  type: "data_table";
  title?: string;
  columns: string[];
  rows: string[][];
};

/** True when a cell looks numeric (for tabular-nums alignment). */
function looksNumeric(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  // Allow currency, commas, percents, signs, decimals — still display as given
  return /^[$€£]?-?[\d,]+(\.\d+)?%?$/.test(t);
}

export default function DataTable({ spec }: { spec: DataTableSpec }) {
  const { title, columns, rows } = spec;

  return (
    <div className="my-4 w-full overflow-x-auto">
      {title ? (
        <p className="mb-2 text-center font-display text-sm font-medium text-arc-ink">
          {title}
        </p>
      ) : null}
      <table className="w-full border-collapse border border-arc-line font-display text-sm text-arc-ink">
        <thead>
          <tr className="bg-arc-bg">
            {columns.map((col, i) => (
              <th
                key={`col-${i}`}
                scope="col"
                className="border border-arc-line px-3 py-2 text-left font-medium"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={`row-${ri}`}>
              {row.map((cell, ci) => (
                <td
                  key={`cell-${ri}-${ci}`}
                  className={`border border-arc-line px-3 py-2 ${
                    looksNumeric(cell) ? "tabular-nums" : ""
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
