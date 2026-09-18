import { forwardRef, useState } from "react";
import type { ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "./Field";

type PasswordFieldProps = Omit<ComponentProps<typeof Field>, "type" | "suffix">;

/** A `Field` that masks its value by default, with a button to reveal it. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <Field
        ref={ref}
        type={visible ? "text" : "password"}
        suffix={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="rounded p-0.5 text-ink-400 transition-colors hover:text-ink-700 focus:outline-none focus:ring-2 focus:ring-pine-600/30"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        {...props}
      />
    );
  }
);
PasswordField.displayName = "PasswordField";
