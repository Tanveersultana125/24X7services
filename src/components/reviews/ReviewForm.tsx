"use client";

import { useState } from "react";
import { Star, CheckCircle2, Loader2, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Kept in step with REVIEW_MIN_LENGTH / REVIEW_MAX_LENGTH in src/lib/reviews.ts. */
const MIN_LENGTH = 10;
const MAX_LENGTH = 600;
const NAME_MIN = 2;

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
  name_required: "Please tell us your name.",
  rate_limited: "That's a few reviews in a short while — try again a bit later.",
  server_not_configured: "Reviews aren't available right now. Please try later.",
};

export type ReviewTarget = {
  bookingId: string;
  code: string;
  appliance: string;
};

/**
 * The one review form: the dashboard shows it in a dialog, /reviews/new shows
 * it on the page.
 *
 * With a `target` it reviews that booking and is stored verified. Without one
 * it's an open review of the service — the visitor says who they are and what
 * they used us for. Either way /api/reviews re-checks everything and an admin
 * publishes it.
 */
export function ReviewForm({
  target,
  signedInAs,
  onSubmitted,
  onCancel,
  cancelLabel = "Cancel",
  done,
}: {
  /** The booking being reviewed, when there is one. */
  target?: ReviewTarget;
  /** Account name of a signed-in customer — reviews are published under it. */
  signedInAs?: string;
  /** Fired once the review is stored, so a list can flip the row to "Rated". */
  onSubmitted: (bookingId: string) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  /** Replaces the built-in thank-you panel — the page wants its own. */
  done?: React.ReactNode;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const trimmed = text.trim();
  // Only an anonymous visitor is asked for a name; everyone else already has one.
  const needsName = !target && !signedInAs;
  const canSubmit =
    trimmed.length >= MIN_LENGTH && (!needsName || name.trim().length >= NAME_MIN) && state === "idle";

  const submit = async () => {
    if (!canSubmit) return;
    setState("saving");
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          target
            ? { bookingId: target.bookingId, rating, text: trimmed }
            : { rating, text: trimmed, name: name.trim(), city: city.trim(), service: service.trim() },
        ),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(ERROR_COPY[data?.error as string] ?? "Something went wrong. Please try again.");
        setState("idle");
        return;
      }

      setState("done");
      onSubmitted(target?.bookingId ?? "");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setState("idle");
    }
  };

  if (state === "done") {
    if (done) return <>{done}</>;
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
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Done
          </button>
        )}
      </div>
    );
  }

  const field =
    "w-full rounded-2xl border border-border bg-surface-2/50 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-2 focus:border-primary";

  return (
    <>
      {target ? (
        <>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            <BadgeCheck className="size-3.5" /> {target.code}
          </p>
          <h2 className="mt-2 pr-10 text-xl font-bold tracking-tight">
            How was your {target.appliance} service?
          </h2>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Your experience
          </p>
          <h2 className="mt-2 pr-10 text-xl font-bold tracking-tight">How did we do?</h2>
        </>
      )}

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

      {/* who's writing, and about what — only when no booking carries those details */}
      {!target && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {needsName ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="Your name"
              autoComplete="name"
              className={field}
            />
          ) : (
            <p className="flex items-center rounded-2xl bg-surface-2/50 px-4 py-3 text-sm text-muted">
              Posting as <span className="ml-1 font-medium text-ink">{signedInAs}</span>
            </p>
          )}
          <input
            value={city}
            onChange={(e) => setCity(e.target.value.slice(0, 60))}
            placeholder="City (optional)"
            autoComplete="address-level2"
            className={field}
          />
          <input
            value={service}
            onChange={(e) => setService(e.target.value.slice(0, 60))}
            placeholder="What did we do for you? (optional)"
            className={cn(field, "sm:col-span-2")}
          />
        </div>
      )}

      {/* text */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
        rows={5}
        placeholder="What went well? Anything we could do better?"
        className="mt-3 w-full resize-none rounded-2xl border border-border bg-surface-2/50 p-4 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-2 focus:border-primary"
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
        {onCancel && (
          <button
            onClick={onCancel}
            className="inline-flex h-11 items-center rounded-full border border-border-strong px-5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
          >
            {cancelLabel}
          </button>
        )}
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
        >
          {state === "saving" && <Loader2 className="size-4 animate-spin" />}
          {state === "saving" ? "Sending…" : "Submit review"}
        </button>
      </div>
    </>
  );
}
