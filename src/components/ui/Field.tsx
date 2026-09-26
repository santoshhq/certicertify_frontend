import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { Lock } from "lucide-react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  suffix?: ReactNode;
  /** Frozen field: read-only, striped grey, with a lock icon and "Locked" tag. */
  locked?: boolean;
}

const LOCKED_TITLE = "This field is locked and can't be edited here.";

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, suffix, locked, className, id, ...props }, ref) => {
    const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, "-");
    return (
      <label htmlFor={inputId} className="block text-left">
        <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-700">
          {label}
          {locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-700">
              <Lock size={10} />
              Locked
            </span>
          )}
        </span>
        <span className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            title={locked ? LOCKED_TITLE : props.title}
            className={clsx(
              "w-full rounded-md border px-3.5 py-2.5 text-sm",
              "placeholder:text-ink-400 outline-none transition-colors",
              locked
                ? "cursor-not-allowed select-none border-dashed border-ink-400/50 bg-ink-400/10 text-ink-400 [background-image:repeating-linear-gradient(135deg,rgba(113,130,125,0.12)_0_6px,transparent_6px_12px)]"
                : "bg-white text-ink-900 focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15",
              !locked && (error ? "border-rose-600" : "border-line"),
              (suffix || locked) && "pr-10",
              className
            )}
            {...props}
            {...(locked && { readOnly: true, disabled: true, "aria-readonly": true })}
          />
          {(suffix || locked) && (
            <span className="absolute right-3 flex items-center text-ink-400">
              {locked ? <Lock size={15} /> : suffix}
            </span>
          )}
        </span>
        {hint && !error && (
          <span className="mt-1.5 block text-xs text-ink-400">{hint}</span>
        )}
        {error && (
          <span className="mt-1.5 block text-xs text-rose-600">{error}</span>
        )}
      </label>
    );
  }
);
Field.displayName = "Field";
