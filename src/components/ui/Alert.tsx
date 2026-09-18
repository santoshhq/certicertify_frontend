import clsx from "clsx";
import type { ReactNode } from "react";

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-md border px-3.5 py-2.5 text-sm",
        tone === "error" && "border-rose-600/30 bg-rose-100 text-rose-600",
        tone === "success" && "border-pine-600/30 bg-mint-100 text-pine-800",
        tone === "info" && "border-sage-300 bg-mint-50 text-ink-700"
      )}
    >
      {children}
    </div>
  );
}
