import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  suffix?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, suffix, className, id, ...props }, ref) => {
    const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, "-");
    return (
      <label htmlFor={inputId} className="block text-left">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </span>
        <span className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-ink-900",
              "placeholder:text-ink-400 outline-none transition-colors",
              "focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15",
              error ? "border-rose-600" : "border-line",
              suffix && "pr-10",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 flex items-center text-ink-400">
              {suffix}
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
