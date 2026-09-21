import { useEffect, useRef, useState } from "react";
import { GraduationCap, SearchX } from "lucide-react";
import clsx from "clsx";
import { suggestStudents } from "../lib/students";
import type { StudentSuggestion } from "../lib/students";

const DEBOUNCE_MS = 200;
const MIN_CHARS = 2;

function normalizeKey(value: string) {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

/** Bold the part of `text` that matches the typed prefix. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = normalizeKey(query);
  if (!q || !text.toUpperCase().startsWith(q)) return <>{text}</>;
  return (
    <>
      <span className="font-semibold text-pine-950">{text.slice(0, q.length)}</span>
      {text.slice(q.length)}
    </>
  );
}

export function useStudentSuggestions(query: string, enabled: boolean) {
  const [items, setItems] = useState<StudentSuggestion[]>([]);
  // The query the current `items` were fetched for; lets callers tell
  // "resolved with nothing" apart from "still waiting on the debounce".
  const [resolvedFor, setResolvedFor] = useState<string | null>(null);
  const requestId = useRef(0);

  const q = query.trim();
  const active = enabled && q.length >= MIN_CHARS;

  useEffect(() => {
    if (!active) return;
    const id = ++requestId.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await suggestStudents(q, controller.signal);
        if (id === requestId.current) {
          setItems(data);
          setResolvedFor(q);
        }
      } catch {
        if (id === requestId.current) {
          setItems([]);
          setResolvedFor(null);
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, active]);

  return {
    items: active ? items : [],
    empty: active && resolvedFor === q && items.length === 0,
  };
}

// One grid template shared by the header row and every result row so the
// columns line up: icon · certificate · roll · name · institution · course · batch.
const ROW_GRID =
  "grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 md:grid-cols-[2rem_minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_3.25rem] md:items-center md:gap-x-3 lg:gap-x-5";

export function StudentSuggestionList({
  items,
  query,
  activeIndex,
  listId,
  onHover,
  onPick,
  noResults = false,
  className,
}: {
  items: StudentSuggestion[];
  query: string;
  activeIndex: number;
  listId: string;
  onHover: (index: number) => void;
  onPick: (item: StudentSuggestion) => void;
  /** Render the "nothing matched" state when `items` is empty. */
  noResults?: boolean;
  className?: string;
}) {
  if (items.length === 0 && !noResults) return null;

  return (
    <ul
      id={listId}
      role="listbox"
      aria-label="Matching student records"
      className={clsx(
        "animate-suggest-in overflow-hidden rounded-2xl border border-line bg-white text-left shadow-[0_18px_40px_-16px_rgba(4,51,46,0.35)]",
        className
      )}
    >
      {items.length === 0 ? (
        <li
          role="presentation"
          className="flex items-center gap-3 px-4 py-4 text-sm text-ink-400"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-ink-400">
            <SearchX size={15} />
          </span>
          No matching records found
        </li>
      ) : (
        <>
          <li
            role="presentation"
            aria-hidden
            className={clsx(
              ROW_GRID,
              "hidden border-b border-line bg-paper px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400 md:grid"
            )}
          >
            <span />
            <span>Certificate no.</span>
            <span>Roll no.</span>
            <span>Student</span>
            <span>Institution</span>
            <span>Course</span>
            <span className="text-right">Batch</span>
          </li>

          {items.map((item, index) => {
            const fullName =
              [item.student_name, item.surname_lastName].filter(Boolean).join(" ") || "—";
            const meta = [item.institution_name, item.course_or_Acadamic, item.batch_year]
              .filter(Boolean)
              .join(" • ");
            const active = index === activeIndex;
            return (
              <li
                key={item.student_id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={active}
                onMouseEnter={() => onHover(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(item);
                }}
                className={clsx(
                  ROW_GRID,
                  "cursor-pointer border-b border-line px-4 py-2.5 transition-colors duration-100 last:border-0 md:py-2",
                  active ? "bg-mint-50" : "hover:bg-mint-50/60"
                )}
              >
                <span
                  className={clsx(
                    "row-span-3 mt-0.5 flex h-8 w-8 items-center justify-center self-start rounded-full bg-mint-100 text-pine-800 md:row-span-1 md:mt-0 md:self-center",
                    active && "bg-sage-200"
                  )}
                  aria-hidden
                >
                  <GraduationCap size={15} />
                </span>

                {/* Certificate number — the primary identifier */}
                <span className="truncate font-mono text-sm font-medium text-ink-900">
                  <Highlight text={item.certificate_no || "—"} query={query} />
                </span>

                <span className="hidden truncate font-mono text-[13px] text-ink-700 md:block">
                  <Highlight text={item.roll_no} query={query} />
                </span>

                <span className="truncate text-sm text-ink-900 md:text-[13px] md:font-medium">
                  {fullName}
                </span>

                <span className="hidden truncate text-xs text-ink-400 md:block">
                  {item.institution_name || "—"}
                </span>
                <span className="hidden truncate text-xs text-ink-400 md:block">
                  {item.course_or_Acadamic || "—"}
                </span>
                <span className="hidden truncate text-right text-xs tabular-nums text-ink-400 md:block">
                  {item.batch_year || "—"}
                </span>

                {/* Compact third line on mobile only */}
                <span className="truncate text-xs text-ink-400 md:hidden">
                  <span className="font-mono">
                    <Highlight text={item.roll_no} query={query} />
                  </span>
                  {meta && ` • ${meta}`}
                </span>
              </li>
            );
          })}
        </>
      )}
    </ul>
  );
}
