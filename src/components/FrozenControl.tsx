import type { ReactNode } from "react";
import { Lock } from "lucide-react";

export const NO_PERMISSION_TITLE = "You don't have permission for this. Contact your Super Admin.";

/** Renders `children` when allowed, otherwise a greyed lock icon in its place. */
export function FrozenControl({
  allowed,
  children,
  label,
}: {
  allowed: boolean;
  children: ReactNode;
  label: string;
}) {
  if (allowed) return <>{children}</>;
  return (
    <span
      title={NO_PERMISSION_TITLE}
      aria-label={`${label} (no permission)`}
      className="inline-flex cursor-not-allowed text-ink-400/50"
    >
      <Lock size={15} />
    </span>
  );
}

export function NoPermissionNote({ action }: { action: string }) {
  return (
    <p className="flex items-center gap-2 rounded-md border border-line bg-mint-50/60 px-3 py-2 text-xs text-ink-700">
      <Lock size={13} className="shrink-0 text-pine-700" />
      Your admin account can't {action}. Contact your Super Admin to request access.
    </p>
  );
}
