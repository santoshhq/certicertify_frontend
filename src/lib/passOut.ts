/** Today's date in Indian Standard Time as YYYY-MM-DD, for the pickers' upper bound. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export type PassOutPrecision = "month" | "date";

/** Latest pick allowed for the given precision (no future pass-outs). */
export function maxPassOut(precision: PassOutPrecision) {
  const today = todayISO();
  return precision === "month" ? today.slice(0, 7) : today;
}

/**
 * Picker value -> stored text. Month picker gives YYYY-MM -> "MM-YYYY";
 * date picker gives YYYY-MM-DD -> "DD-MM-YYYY". Both keep the 4-digit year
 * the backend extracts for pass-out year filters.
 */
export function toStoredPassOut(value: string, precision: PassOutPrecision) {
  const [y, m, d] = value.split("-");
  if (!y || !m) return value;
  return precision === "date" && d ? `${d}-${m}-${y}` : `${m}-${y}`;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Error message if the batch year isn't a 4-digit year up to the current IST year, else null. */
export function batchYearError(value: string) {
  const year = value.trim();
  if (!/^\d{4}$/.test(year)) return "Batch year must be a 4-digit year, e.g. 2025.";
  if (year > todayISO().slice(0, 4)) return "Batch year can't be later than the current year.";
  return null;
}

/**
 * Error message if a pass-out value is after the current IST month, else null.
 * Accepts picker values (YYYY-MM, YYYY-MM-DD), stored text (MM-YYYY,
 * DD-MM-YYYY) and legacy free text like "May 2025".
 */
export function passOutError(value: string) {
  const text = value.trim();
  const year = text.match(/\d{4}/)?.[0];
  if (!year) return "Pass-out must include a 4-digit year.";

  let month: number | null = null;
  const iso = text.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  const stored = text.match(/^(?:(\d{2})-)?(\d{2})-(\d{4})$/);
  const named = MONTHS.findIndex((m) => text.toLowerCase().includes(m));
  if (iso) month = Number(iso[2]);
  else if (stored) month = Number(stored[2]);
  else if (named >= 0) month = named + 1;

  const today = todayISO();
  const current = today.slice(0, 7);
  const day = iso?.[3] ?? stored?.[1];
  if (month !== null && (month < 1 || month > 12)) return "Pass-out month isn't valid.";
  const ym = month !== null ? `${year}-${String(month).padStart(2, "0")}` : null;
  if (ym ? ym > current : year > current.slice(0, 4)) {
    return "Pass-out can't be later than the current month.";
  }
  if (day && ym === current && `${ym}-${day}` > today) {
    return "Pass-out date can't be in the future.";
  }
  return null;
}
