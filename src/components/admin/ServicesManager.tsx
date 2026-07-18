"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { SERVICES, type AdminService } from "@/lib/admin/data";

export function ServicesManager() {
  const [rows, setRows] = useState<AdminService[]>(SERVICES);
  const [saved, setSaved] = useState(false);

  const update = (id: string, patch: Partial<AdminService>) =>
    setRows((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[-0.02em]">Services & prices</h1>
          <p className="mt-1 text-sm text-muted">Edit starting prices, timing, and visibility.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRows(SERVICES)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:bg-surface-2"
          >
            <RotateCcw className="size-4" /> Reset
          </button>
          <button
            onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Check className="size-4" /> {saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-surface p-5 shadow-premium-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{s.name}</h3>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={s.active}
                  onChange={(e) => update(s.id, { active: e.target.checked })}
                  className="size-4 accent-emerald"
                />
                {s.active ? "Live" : "Hidden"}
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Starting price (₹)">
                <input
                  type="number"
                  value={s.startingPrice}
                  onChange={(e) => update(s.id, { startingPrice: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
                />
              </Field>
              <Field label="Service time">
                <input
                  value={s.serviceTime}
                  onChange={(e) => update(s.id, { serviceTime: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
                />
              </Field>
              <Field label="Rating">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={s.rating}
                  onChange={(e) => update(s.id, { rating: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
                />
              </Field>
              <Field label="Bookings label">
                <input
                  value={s.bookings}
                  onChange={(e) => update(s.id, { bookings: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-royal-bright"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Changes are in-memory for now — reset on refresh. Wire to a database to persist.</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
