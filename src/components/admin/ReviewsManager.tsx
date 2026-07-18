"use client";

import { useState } from "react";
import { Star, Check, EyeOff, Trash2 } from "lucide-react";
import { REVIEWS, type AdminReview } from "@/lib/admin/data";

export function ReviewsManager() {
  const [rows, setRows] = useState<AdminReview[]>(REVIEWS);
  const [filter, setFilter] = useState<"all" | "published" | "pending">("all");

  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  const setStatus = (id: string, status: AdminReview["status"]) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  const remove = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-[-0.02em]">Reviews</h1>
        <p className="mt-1 text-sm text-muted">Approve, hide, or remove customer reviews.</p>
      </div>

      <div className="mb-5 flex gap-1.5">
        {(["all", "pending", "published"] as const).map((f) => (
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

      <div className="space-y-3">
        {shown.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-surface p-5 shadow-premium-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{r.name}</p>
                  <span className="text-xs text-muted">· {r.city} · {r.appliance}</span>
                </div>
                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-amber text-amber" : "text-border"}`} />
                  ))}
                  <span className="ml-2 text-xs text-muted">{r.date}</span>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  r.status === "published" ? "bg-emerald/12 text-emerald" : "bg-amber/15 text-amber"
                }`}
              >
                {r.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-ink-soft">{r.text}</p>

            <div className="mt-4 flex gap-2">
              {r.status === "pending" ? (
                <button onClick={() => setStatus(r.id, "published")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald/12 px-3 py-1.5 text-xs font-medium text-emerald hover:bg-emerald/20">
                  <Check className="size-3.5" /> Approve
                </button>
              ) : (
                <button onClick={() => setStatus(r.id, "pending")} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-ink">
                  <EyeOff className="size-3.5" /> Unpublish
                </button>
              )}
              <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10">
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="py-10 text-center text-muted">No reviews here.</p>}
      </div>
      <p className="mt-4 text-xs text-muted">Changes are in-memory for now — reset on refresh. Wire to a database to persist.</p>
    </div>
  );
}
