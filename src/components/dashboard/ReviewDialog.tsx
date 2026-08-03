"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/** Kept in step with REVIEW_MIN_LENGTH / REVIEW_MAX_LENGTH in src/lib/reviews.ts. */
const MIN_LENGTH = 10;
const MAX_LENGTH = 600;

const RATING_LABEL: Record<number, string> = {
  1: "Poor",
  2: "Below par",
  3: "Okay",
  4: "Good",
  5: "Excellent",
};

const ERROR_COPY: Record<string, string> = {
  already_reviewed: "You've already reviewed this service.",
  not_completed: "You can review a service once it's marked completed.",
  forbidden: "This booking isn't on your account.",
  not_found: "We couldn't find that booking.",
  unauthenticated: "Please log in again to leave a review.",
  server_not_configured: "Reviews aren't available right now. Please try later.",
};

export type ReviewTarget = {
  bookingId: string;
  code: string;
  appliance: string;
};

export function ReviewDialog({
  target,
  onClose,
  onSubmitted,
}: {
  target: ReviewTarget | null;
  onClose: () => void;
  /** Fired once the review is stored, so the dashboard can flip the row to "Rated". */
  onSubmitted: (bookingId: string) => void;
}) {
  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center px-4 py-6 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Review your ${target.appliance} service`}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease }}
            className="relative w-full max-w-[32rem] overflow-hidden rounded-[1.75rem] border border-border bg-surface p-6 shadow-premium-xl ring-1 ring-black/5 sm:p-8"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-4" />
            </button>

            {/* Keyed on the booking so opening a different job starts from a clean form. */}
            <ReviewForm
              key={target.bookingId}
              target={target}
              onClose={onClose}
              onSubmitted={onSubmitted}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReviewForm({
  target,
  onClose,
  onSubmitted,
}: {
  target: ReviewTarget;
  onClose: () => void;
  onSubmitted: (bookingId: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const trimmed = text.trim();
  const canSubmit = trimmed.length >= MIN_LENGTH && state === "idle";

  const submit = async () => {
    if (!canSubmit) return;
    setState("saving");
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: target.bookingId, rating, text: trimmed }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(ERROR_COPY[data?.error as string] ?? "Something went wrong. Please try again.");
        setState("idle");
        return;
      }

      setState("done");
      onSubmitted(target.bookingId);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/12 text-accent">
          <CheckCircle2 className="size-7" />
        </div>
        <h2 className="mt-5 text-xl font-bold tracking-tight">Thanks for the feedback</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Your review has been sent to our team. Once it&apos;s approved it&apos;ll appear on our
          reviews page.
        </p>
        <button
          onClick={onClose}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{target.code}</p>
      <h2 className="mt-2 pr-10 text-xl font-bold tracking-tight">
        How was your {target.appliance} service?
      </h2>

      {/* stars */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="rounded-md p-0.5 transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={cn(
                  "size-8 transition-colors",
                  n <= (hover || rating)
                    ? "fill-amber text-amber"
                    : "fill-surface-2 text-border-strong",
                )}
              />
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-muted">{RATING_LABEL[hover || rating]}</span>
      </div>

      {/* text */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
        rows={5}
        placeholder="What went well? Anything we could do better?"
        className="mt-5 w-full resize-none rounded-2xl border border-border bg-surface-2/50 p-4 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-2 focus:border-primary"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>
          {trimmed.length < MIN_LENGTH
            ? `At least ${MIN_LENGTH} characters`
            : "Published only after our team reviews it"}
        </span>
        <span>
          {text.length}/{MAX_LENGTH}
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      <div className="mt-6 flex justify-end gap-2.5">
        <button
          onClick={onClose}
          className="inline-flex h-11 items-center rounded-full border border-border-strong px-5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
        >
          {state === "saving" && <Loader2 className="size-4 animate-spin" />}
          {state === "saving" ? "Sending…" : "Submit review"}
        </button>
      </div>
    </>
  );
}
