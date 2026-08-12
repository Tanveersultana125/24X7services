"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Asks before something destructive happens.
 *
 * The panel used to swap the Delete button for a "Delete it / Cancel" pair in
 * place. That is easy to hit twice — the confirmation lands under the cursor
 * that just pressed Delete — and easy to miss, since nothing else on the page
 * changes. A dialog takes over the screen, names what is about to go, and puts
 * its buttons somewhere the second click has to be deliberate.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Escape closes it, and focus starts on Cancel — the safe one, so a stray
  // Enter doesn't delete anything.
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-premium-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="grid size-11 place-items-center rounded-xl bg-danger/12 text-danger">
          <AlertTriangle className="size-5" />
        </span>
        <h3 className="mt-4 font-medium">{title}</h3>
        {body && <div className="mt-1.5 text-sm text-muted">{body}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
