import { useEffect, useRef, useState } from "react";
import { GraduationCap } from "lucide-react";
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
        if (id === requestId.current) setItems(data);
      } catch {
        if (id === requestId.current) setItems([]);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, active]);

  return { items: active ? items : [] };
}

export function StudentSuggestionList({
  items,
  query,
  activeIndex,
  listId,
  onHover,
  onPick,
}: {
  items: StudentSuggestion[];
  query: string;
  activeIndex: number;
  listId: string;
  onHover: (index: number) => void;
  onPick: (item: StudentSuggestion) => void;
}) {
  if (items.length === 0) return null;
  const q = normalizeKey(query);

  return (
    <ul
      id={listId}
      role="listbox"
      className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line bg-white text-left shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)]"
    >
      {items.map((item, index) => {
        // Show whichever identifier the person is actually typing.
        const matchedByCertificate =
          !item.roll_no.toUpperCase().startsWith(q) && item.certificate_no?.toUpperCase().startsWith(q);
        const primary = matchedByCertificate ? item.certificate_no : item.roll_no;
        const secondary = matchedByCertificate ? item.roll_no : item.certificate_no;
        const fullName = [item.student_name, item.surname_lastName].filter(Boolean).join(" ");
        return (
          <li
            key={item.student_id}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            onMouseEnter={() => onHover(index)}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(item);
            }}
            className={clsx(
              "flex cursor-pointer items-start gap-3 border-b border-line px-4 py-3 last:border-0",
              index === activeIndex ? "bg-mint-50" : "hover:bg-mint-50/60"
            )}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-100 text-pine-800">
              <GraduationCap size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-sm text-ink-900">
                  <Highlight text={primary} query={query} />
                </span>
                {secondary && (
                  <span className="font-mono text-xs text-ink-400">{secondary}</span>
                )}
              </span>
              <span className="block truncate text-sm text-ink-900">{fullName || "—"}</span>
              <span className="block truncate text-xs text-ink-400">
                {[item.institution_name, item.course_or_Acadamic, item.batch_year && `Batch ${item.batch_year}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
