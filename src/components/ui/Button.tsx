import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-pine-800 text-white hover:bg-pine-900 disabled:bg-sage-300 border border-pine-800 disabled:border-sage-300",
  secondary:
    "bg-white text-pine-800 hover:bg-mint-50 border border-pine-700",
  ghost: "bg-transparent text-pine-800 hover:bg-mint-100 border border-transparent",
  danger:
    "bg-white text-rose-600 hover:bg-rose-100 border border-rose-600",
  destructive:
    "bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 hover:border-rose-700 active:bg-rose-700 disabled:bg-rose-600/60 disabled:border-transparent shadow-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium",
          "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          variant === "danger" || variant === "destructive"
            ? "focus-visible:ring-rose-600"
            : "focus-visible:ring-pine-600",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {loading && (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
