import { useEffect, useRef, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import clsx from "clsx";

/** Current calendar year in Indian Standard Time, regardless of the browser's timezone. */
export function currentIndianYear() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).format(new Date());
}

/**
 * Batch year input that starts locked on the current IST year. The pencil
 * unlocks it so a custom year can be typed; the arrow puts it back.
 */
export function BatchYearField({
  value,
  onChange,
  disabled,
  editable = true,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** False keeps the year fixed with no pencil (bulk roster upload). */
  editable?: boolean;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const thisYear = currentIndianYear();
  const open = unlocked && editable;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Leaving the editable section re-locks the field.
  useEffect(() => {
    if (!editable) setUnlocked(false);
  }, [editable]);

  function reset() {
    onChange(thisYear);
    setUnlocked(false);
  }

  return (
    <div className="block text-left">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">
        Batch year
      </span>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id="batch_year"
          name="batch_year"
          value={value}
          readOnly={!open}
          tabIndex={open ? undefined : -1}
          inputMode="numeric"
          maxLength={4}
          required
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className={clsx(
            "w-full rounded-md border border-line px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors",
            editable && "pr-11",
            open
              ? "bg-white focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15"
              : "cursor-not-allowed bg-mint-50 text-ink-700"
          )}
        />
        {editable && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => (open ? reset() : setUnlocked(true))}
            title={open ? "Reset to the current year" : "Edit batch year"}
            aria-label={open ? "Reset to the current year" : "Edit batch year"}
            className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-mint-100 hover:text-pine-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {open ? <RotateCcw size={14} /> : <Pencil size={14} />}
          </button>
        )}
      </div>
      <span className="mt-1.5 block text-xs text-ink-400">
        {!editable
          ? "Fixed to the current year (IST) for roster uploads."
          : open
            ? `Type any batch year, or use the arrow to go back to ${thisYear}.`
            : "Set to the current year (IST). Tap the pencil to enter a different one."}
      </span>
    </div>
  );
}
