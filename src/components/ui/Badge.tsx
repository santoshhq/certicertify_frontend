import clsx from "clsx";
import type { InstitutionApprovalStatus } from "../../types";

const APPROVAL_STYLES: Record<InstitutionApprovalStatus, { pill: string; dot: string }> = {
  Approved: { pill: "border-pine-600 bg-mint-100 text-pine-800", dot: "bg-pine-600" },
  Pending: { pill: "border-amber-600/40 bg-amber-100 text-amber-600", dot: "bg-amber-600" },
  Suspended: { pill: "border-rose-600/40 bg-rose-100 text-rose-600", dot: "bg-rose-600" },
};

export function ApprovalBadge({ status }: { status: InstitutionApprovalStatus }) {
  const style = APPROVAL_STYLES[status] ?? APPROVAL_STYLES.Pending;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        style.pill
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", style.dot)} />
      {status}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        verified
          ? "border-pine-600 bg-mint-100 text-pine-800"
          : "border-amber-600/40 bg-amber-100 text-amber-600"
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          verified ? "bg-pine-600" : "bg-amber-600"
        )}
      />
      {verified ? "Verified" : "Pending verification"}
    </span>
  );
}
