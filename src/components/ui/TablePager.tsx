import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface TablePagerProps {
  page: number; // 1-based
  pageSize: PageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

/** Page-size picker plus prev/next controls for a paginated table. */
export function TablePager({ page, pageSize, total, onPageChange, onPageSizeChange }: TablePagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const navButton =
    "flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-ink-700 transition-colors hover:bg-mint-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-ink-400">
      <label className="flex items-center gap-2">
        Show
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
          className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink-900 outline-none focus:border-pine-600"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        per page
      </label>

      <div className="flex items-center gap-3">
        <span>
          {start}–{end} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={navButton}
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <span className={clsx("min-w-[4.5rem] text-center font-mono text-ink-700")}>
            {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            className={navButton}
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
