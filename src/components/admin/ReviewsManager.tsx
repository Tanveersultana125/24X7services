"use client";

import { useState } from "react";
import { Star, Check, EyeOff, Trash2, Undo2 } from "lucide-react";
import type { Review, ReviewStatus } from "@/lib/reviews";

const FILTERS: ("all" | ReviewStatus)[] = ["all", "pending", "published", "hidden"];

const STATUS_STYLE: Record<ReviewStatus, string> = {
  published: "bg-emerald/12 text-emerald",
  pending: "bg-amber/15 text-amber",
  hidden: "bg-muted/15 text-muted",
};

function formatDate(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function ReviewsManager({ initial }: { initial: Review[] }) {
  const [rows, setRows] = useState<Review[]>(initial);
  const [filter, setFilter] = useState<"all" | ReviewStatus>("all");
  const [error, setError] = useState<string | null>(null);

  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  // Optimistically apply, persist to Firestore, revert on failure.
  const setStatus = async (id: string, status: ReviewStatus) => {
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setRows(prev);
      setError("Couldn't save that change. Please try again.");
    }
  };

  const remove = async (id: string) => {
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== id));
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setRows(prev);
      setError("Couldn't delete that review. Please try again.");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-[-0.02em]">Reviews</h1>
        <p className="mt-1 text-sm text-muted">
          Customers rate a service from their dashboard once the job is completed. Approve a review
          to publish it on the website.
          {pendingCount > 0 && (
            <span className="ml-1.5 font-medium text-amber">
              {pendingCount} waiting for approval.
            </span>
          )}
        </p>
      </div>

      <div className="mb-5 flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f ? "bg-ink text-white" : "border border-border bg-surface text-muted hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      <div className="space-y-3">
        {shown.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-surface p-5 shadow-premium-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{r.name}</p>
                  <span className="text-xs text-muted">
                    · {[r.city, [r.brand, r.appliance].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}
                  </span>
                  <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted">
                    {r.bookingCode}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-amber text-amber" : "text-border"}`} />
                  ))}
                  <span className="ml-2 text-xs text-muted">{formatDate(r.createdAt)}</span>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[r.status]}`}>
                {r.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-ink-soft">{r.text}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {r.status !== "published" && (
                <button onClick={() => setStatus(r.id, "published")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald/12 px-3 py-1.5 text-xs font-medium text-emerald hover:bg-emerald/20">
                  <Check className="size-3.5" /> Publish
                </button>
              )}
              {r.status === "published" && (
                <button onClick={() => setStatus(r.id, "hidden")} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-ink">
                  <EyeOff className="size-3.5" /> Hide
                </button>
              )}
              {r.status === "hidden" && (
                <button onClick={() => setStatus(r.id, "pending")} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-ink">
                  <Undo2 className="size-3.5" /> Back to pending
                </button>
              )}
              <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10">
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}

        {shown.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface py-14 text-center">
            <p className="font-medium">
              {rows.length === 0 ? "No reviews yet." : `No ${filter} reviews.`}
            </p>
            <p className="mt-1 text-sm text-muted">
              {rows.length === 0
                ? "Reviews arrive here as soon as a customer rates a completed booking."
                : "Try a different filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
