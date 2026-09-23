import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "./Button";

export interface ConfirmDetail {
  label: string;
  value: ReactNode;
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** "danger" for destructive actions, "brand" for neutral confirmations. */
  tone?: "danger" | "brand";
  /** Icon shown in the circle at the top. Defaults to a trash icon. */
  icon?: ReactNode;
  /** Icon shown inside the confirm button. Defaults to a trash icon on "danger". */
  confirmIcon?: ReactNode;
  /** "top" stacks the icon above the title; "inline" sits it to the left of the title. */
  iconPlacement?: "top" | "inline";
  /** Short line explaining what the action does. */
  description: ReactNode;
  /** Optional label/value rows identifying the exact record being removed. */
  details?: ConfirmDetail[];
  /** Optional emphasised warning panel shown below the details. */
  warning?: { title: string; description: string };
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  tone = "danger",
  icon,
  confirmIcon,
  iconPlacement = "top",
  description,
  details,
  warning,
  confirmLabel = "Yes, delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  // Keep the dashboard behind the modal from scrolling while it is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-pine-950/45 px-4 py-8 backdrop-blur-[3px]"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onClick={(e) => e.stopPropagation()}
        className="modal-panel relative w-full max-w-[560px] rounded-2xl border border-line bg-white p-6 shadow-[0_20px_50px_-12px_rgba(4,51,46,0.28)] sm:p-8"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1.5 text-ink-400 transition-colors hover:bg-mint-50 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={18} />
        </button>

        {(() => {
          const badge = (
            <span
              className={
                "flex shrink-0 items-center justify-center rounded-full " +
                (iconPlacement === "inline" ? "h-11 w-11 " : "h-12 w-12 ") +
                (tone === "danger" ? "bg-rose-100 text-rose-600" : "bg-mint-100 text-pine-800")
              }
            >
              {icon ?? <Trash2 size={22} />}
            </span>
          );
          const heading = (
            <h2
              id="confirm-dialog-title"
              className="font-display text-xl font-bold leading-snug text-pine-950 sm:text-2xl"
            >
              {title}
            </h2>
          );
          const body = (
            <p
              id="confirm-dialog-description"
              className="mt-2 text-sm leading-relaxed text-ink-400"
            >
              {description}
            </p>
          );

          if (iconPlacement === "inline") {
            return (
              <div className="flex items-start gap-4 pr-8">
                {badge}
                <div className="min-w-0 pt-1">
                  {heading}
                  {body}
                </div>
              </div>
            );
          }

          return (
            <>
              {badge}
              <div className="mt-5">
                {heading}
                {body}
              </div>
            </>
          );
        })()}

        {details && details.length > 0 && (
          <dl className="mt-6 overflow-hidden rounded-xl border border-line bg-mint-50/70">
            {details.map((detail, index) => (
              <div
                key={detail.label}
                className={
                  "flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6" +
                  (index > 0 ? " border-t border-line" : "")
                }
              >
                <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-400">
                  {detail.label}
                </dt>
                <dd className="break-words text-sm font-medium text-ink-900 sm:text-right">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {warning && (
          <div
            className={
              "mt-4 flex items-start gap-3 rounded-xl border px-4 py-3.5 " +
              (tone === "danger"
                ? "border-rose-200 bg-rose-50"
                : "border-line bg-mint-50")
            }
          >
            <AlertTriangle
              size={17}
              className={
                "mt-0.5 shrink-0 " +
                (tone === "danger" ? "text-rose-600" : "text-pine-700")
              }
            />
            <div>
              <p
                className={
                  "text-sm font-semibold " +
                  (tone === "danger" ? "text-rose-700" : "text-pine-950")
                }
              >
                {warning.title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
                {warning.description}
              </p>
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="border-line text-ink-700 hover:bg-mint-50"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {!loading &&
              (confirmIcon ?? (tone === "danger" ? <Trash2 size={15} /> : null))}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
