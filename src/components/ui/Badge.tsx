import clsx from "clsx";

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
