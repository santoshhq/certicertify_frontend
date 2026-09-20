import { ApprovalBadge } from "./ui/Badge";
import type { InstitutionApprovalStatus } from "../types";

// Allowed transitions from each current status.
const APPROVAL_TRANSITIONS: Record<InstitutionApprovalStatus, InstitutionApprovalStatus[]> = {
  Pending: ["Approved", "Suspended"],
  Approved: ["Suspended"],
  Suspended: ["Approved"],
};

const APPROVAL_ACTION_LABEL: Record<InstitutionApprovalStatus, string> = {
  Approved: "Approve",
  Suspended: "Suspend",
  Pending: "Mark pending",
};

/** Badge for the current status plus (when `canChange`) a dropdown of the valid next states. */
export function ApprovalStatusControl({
  status,
  institutionName,
  canChange,
  changing,
  onChange,
}: {
  status: InstitutionApprovalStatus;
  institutionName: string;
  canChange: boolean;
  changing?: boolean;
  onChange?: (next: InstitutionApprovalStatus) => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <ApprovalBadge status={status} />
      {canChange && (
        <select
          value=""
          disabled={changing}
          onChange={(e) => {
            if (!e.target.value) return;
            onChange?.(e.target.value as InstitutionApprovalStatus);
          }}
          aria-label={`Change account status for ${institutionName}`}
          className="rounded-md border border-line bg-white px-2 py-1 text-xs outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15 disabled:opacity-50"
        >
          <option value="">{changing ? "Updating…" : "Change status…"}</option>
          {(APPROVAL_TRANSITIONS[status] ?? []).map((next) => (
            <option key={next} value={next}>
              {APPROVAL_ACTION_LABEL[next]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
