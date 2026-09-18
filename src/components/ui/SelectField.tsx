import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

export type SelectOption = string | { value: string; label: string };

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: readonly SelectOption[];
}

function normalize(option: SelectOption) {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, hint, error, placeholder, options, className, id, ...props }, ref) => {
    const selectId = id || props.name || label.toLowerCase().replace(/\s+/g, "-");
    return (
      <label htmlFor={selectId} className="block text-left">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </span>
        <span className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              "w-full appearance-none rounded-md border bg-white px-3.5 py-2.5 pr-10 text-sm text-ink-900",
              "outline-none transition-colors",
              "focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15",
              "disabled:cursor-not-allowed disabled:bg-mint-50 disabled:text-ink-400",
              error ? "border-rose-600" : "border-line",
              className
            )}
            {...props}
          >
            {placeholder !== undefined && (
              <option value="">{placeholder}</option>
            )}
            {options.map(normalize).map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 flex items-center text-ink-400">
            <ChevronDown size={16} />
          </span>
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
SelectField.displayName = "SelectField";
