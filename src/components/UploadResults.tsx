import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { TablePager } from "./ui/TablePager";
import type { PageSize } from "./ui/TablePager";
import type { StudentUploadResponse, UploadRowError } from "../types";

const UNMATCHED_PREVIEW = 24;

function csvCell(value: string | number) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const body = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Group identical reasons so 2,000 "already exists" rows read as one line, not 2,000. */
function summarizeReasons(errors: UploadRowError[]) {
  const counts = new Map<string, number>();
  for (const e of errors) {
    // Collapse row-specific identifiers ('4837…') so the same kind of error groups together.
    const key = e.reason.replace(/'[^']*'/g, "'…'");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

function usePaged<T>(items: T[], initial: PageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(initial);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize]
  );
  return {
    visible,
    pager: {
      page: currentPage,
      pageSize,
      total: items.length,
      onPageChange: setPage,
      onPageSizeChange: (size: PageSize) => {
        setPageSize(size);
        setPage(1);
      },
    },
    reset: () => setPage(1),
  };
}

/**
 * Result of a roster upload. Everything is paginated / collapsed so a 3,000-row
 * upload with 3,000 skipped rows still renders instantly.
 */
export function UploadResults({
  result,
  compact,
}: {
  result: StudentUploadResponse;
  /** Slimmer variant for inline panels (no stat cards). */
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-4 flex flex-col gap-5" : "mt-10 flex flex-col gap-6"}>
      {!compact && (
        <div className="flex flex-wrap gap-4">
          <StatCard label="Inserted" value={result.inserted_count} tone="success" />
          <StatCard
            label="Skipped rows"
            value={result.errors.length}
            tone={result.errors.length ? "warning" : "success"}
          />
          <StatCard
            label="Unmatched certificates"
            value={result.unmatched_certificates.length}
            tone={result.unmatched_certificates.length ? "warning" : "success"}
          />
        </div>
      )}

      {result.students.length > 0 && <InsertedStudents result={result} />}
      {result.errors.length > 0 && <SkippedRows errors={result.errors} />}
      {result.unmatched_certificates.length > 0 && (
        <UnmatchedCertificates names={result.unmatched_certificates} />
      )}
    </div>
  );
}

function InsertedStudents({ result }: { result: StudentUploadResponse }) {
  const { visible, pager } = usePaged(result.students, 10);
  return (
    <div>
      <h2 className="text-base font-medium text-ink-900">
        Inserted students{" "}
        <span className="font-normal text-ink-400">({result.students.length.toLocaleString()})</span>
      </h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="ledger-row bg-mint-50 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Certificate no.</th>
                <th className="px-4 py-3 font-medium">Roll no.</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Pass month/year</th>
                <th className="px-4 py-3 font-medium">Batch year</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.student_id} className="ledger-row last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">{s.certificate_no || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">{s.roll_no}</td>
                  <td className="px-4 py-3 text-ink-900">
                    {s.student_name} {s.surname_lastName}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{s.course_or_Acadamic}</td>
                  <td className="px-4 py-3 text-ink-700">{s.month_year_pass}</td>
                  <td className="px-4 py-3 text-ink-700">{s.batch_year || "—"}</td>
                  <td className="px-4 py-3 text-ink-700">{s.grade || "—"}</td>
                  <td className="px-4 py-3">
                    {s.certificate_url ? (
                      <a
                        href={s.certificate_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-pine-800 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line">
          <TablePager {...pager} />
        </div>
      </div>
    </div>
  );
}

function SkippedRows({ errors }: { errors: UploadRowError[] }) {
  const [query, setQuery] = useState("");
  const summary = useMemo(() => summarizeReasons(errors), [errors]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return errors;
    return errors.filter((e) => String(e.row).includes(q) || e.reason.toLowerCase().includes(q));
  }, [errors, query]);
  const { visible, pager, reset } = usePaged(filtered, 20);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-ink-900">
            Skipped rows{" "}
            <span className="font-normal text-ink-400">({errors.length.toLocaleString()})</span>
          </h2>
          <p className="mt-1 text-sm text-ink-400">
            These rows weren't added. Fix them in the sheet and upload again — inserted rows won't be duplicated.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              "skipped-rows.csv",
              ["Row", "Reason"],
              errors.map((e) => [e.row, e.reason])
            )
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-pine-600 hover:text-pine-900"
        >
          <Download size={13} /> Download CSV
        </button>
      </div>

      {summary.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {summary.map(([reason, count]) => (
            <li
              key={reason}
              className="rounded-md border border-amber-600/30 bg-amber-100 px-2.5 py-1 text-xs text-amber-600"
            >
              <span className="font-semibold">{count.toLocaleString()}</span> × {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
        <label className="relative block border-b border-line">
          <Search size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              reset();
            }}
            placeholder="Filter by row number or reason"
            className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-ink-400"
          />
        </label>
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-400">No skipped rows match that filter.</p>
        ) : (
          <ul>
            {visible.map((err) => (
              <li key={`${err.row}-${err.reason}`} className="ledger-row flex gap-3 px-4 py-2.5 text-sm last:border-0">
                <span className="w-16 shrink-0 font-mono text-xs text-ink-400">Row {err.row}</span>
                <span className="min-w-0 break-words text-ink-700">{err.reason}</span>
              </li>
            ))}
          </ul>
        )}
        {filtered.length > 0 && (
          <div className="border-t border-line">
            <TablePager {...pager} />
          </div>
        )}
      </div>
    </div>
  );
}

function UnmatchedCertificates({ names }: { names: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? names : names.slice(0, UNMATCHED_PREVIEW);
  const hidden = names.length - shown.length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-ink-900">
            Unmatched certificate files{" "}
            <span className="font-normal text-ink-400">({names.length.toLocaleString()})</span>
          </h2>
          <p className="mt-1 text-sm text-ink-400">
            No roster row matched these filenames — nothing was uploaded for them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv("unmatched-certificates.csv", ["Filename"], names.map((n) => [n]))}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-pine-600 hover:text-pine-900"
        >
          <Download size={13} /> Download CSV
        </button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {shown.map((name) => (
          <li
            key={name}
            className="max-w-full truncate rounded-md border border-amber-600/30 bg-amber-100 px-3 py-1.5 text-xs text-amber-600"
            title={name}
          >
            {name}
          </li>
        ))}
      </ul>
      {(hidden > 0 || showAll) && names.length > UNMATCHED_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-xs font-medium text-pine-800 hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${names.length.toLocaleString()}`}
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" }) {
  return (
    <div className="min-w-[140px] flex-1 rounded-lg border border-line bg-white px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p className={`mt-1 font-display text-3xl ${tone === "success" ? "text-pine-800" : "text-amber-600"}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
