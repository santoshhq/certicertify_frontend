import clsx from "clsx";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function SegmentedTabs({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-white p-1" role="tablist">
      {children}
    </div>
  );
}

export function SegmentedTab({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-pine-800 text-white" : "text-ink-700 hover:bg-mint-50"
      )}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}
