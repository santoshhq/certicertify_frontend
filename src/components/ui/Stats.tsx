import type { LucideIcon } from "lucide-react";

const numberFormat = new Intl.NumberFormat("en-IN");

/** Buckets the backend reports when a record has no value for that field. */
const UNSPECIFIED = new Set(["Unspecified", "Unknown", ""]);

export function countKeys(counts: Record<string, number>) {
  return Object.keys(counts).filter((k) => !UNSPECIFIED.has(k)).length;
}

export function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
        <Icon size={16} className="text-pine-700" strokeWidth={1.75} />
      </div>
      <p className="mt-2 text-3xl font-semibold text-pine-950">
        {value === null ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded bg-mint-100" />
        ) : (
          numberFormat.format(value)
        )}
      </p>
    </div>
  );
}

const MAX_BREAKDOWN_ROWS = 7;

/**
 * Single-series horizontal bars: one hue, length = magnitude, count labelled in
 * ink. Long tails fold into "Other" so the card never grows past a few rows.
 */
export function BreakdownCard({
  title,
  counts,
  total,
  sort,
}: {
  title: string;
  counts: Record<string, number>;
  total: number;
  sort: "label" | "count";
}) {
  let rows = Object.entries(counts).map(([label, count]) => ({
    label: UNSPECIFIED.has(label) ? "Unspecified" : label,
    count,
  }));

  rows.sort((a, b) =>
    sort === "count"
      ? b.count - a.count
      : b.label.localeCompare(a.label, undefined, { numeric: true })
  );

  if (rows.length > MAX_BREAKDOWN_ROWS) {
    const head = rows.slice(0, MAX_BREAKDOWN_ROWS - 1);
    const tail = rows.slice(MAX_BREAKDOWN_ROWS - 1);
    rows = [...head, { label: `Other (${tail.length})`, count: tail.reduce((n, r) => n + r.count, 0) }];
  }

  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-sm font-medium text-ink-900">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">No data yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {rows.map((row) => {
            const share = Math.round((row.count / total) * 100);
            return (
              <li
                key={row.label}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
                title={`${row.label}: ${numberFormat.format(row.count)} students (${share}%)`}
              >
                <span className="truncate text-sm text-ink-700">{row.label}</span>
                <span className="text-right text-sm tabular-nums text-ink-900">
                  {numberFormat.format(row.count)}
                  <span className="ml-1.5 text-xs text-ink-400">{share}%</span>
                </span>
                <span className="col-span-2 block h-1.5 overflow-hidden rounded-full bg-mint-100">
                  <span
                    className="block h-full rounded-full bg-pine-700"
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
