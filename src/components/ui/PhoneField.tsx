import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import clsx from "clsx";
import { dialCodeFor } from "../../lib/locations";

interface PhoneFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  country: string;
  value: string;
  onChange: (value: string) => void;
}

export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(
  ({ label, country, value, onChange, className, id, ...props }, ref) => {
    const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, "-");
    const dialCode = dialCodeFor(country);

    return (
      <label htmlFor={inputId} className="block text-left">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
        <span className="flex overflow-hidden rounded-md border border-line bg-white transition-colors focus-within:border-pine-600 focus-within:ring-2 focus-within:ring-pine-600/15">
          <span className="flex min-w-[4.25rem] items-center justify-center border-r border-line bg-mint-50 px-3 text-sm font-medium text-pine-900">
            {dialCode}
          </span>
          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            pattern="[0-9]{10}"
            className={clsx(
              "min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-ink-900 outline-none",
              "placeholder:text-ink-400 disabled:cursor-not-allowed disabled:bg-mint-50 disabled:text-ink-400",
              className
            )}
            value={value}
            onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 10))}
            {...props}
          />
        </span>
        <span className="mt-1.5 block text-xs text-ink-400">
          Enter a 10-digit mobile number.
        </span>
      </label>
    );
  }
);
PhoneField.displayName = "PhoneField";
