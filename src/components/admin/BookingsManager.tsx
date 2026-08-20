"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TECHNICIANS, STATUS_META, type BookingStatus } from "@/lib/admin/data";
import type { Booking } from "@/lib/bookings";

const STATUSES: BookingStatus[] = ["new", "assigned", "in-progress", "completed", "cancelled"];

export function BookingsManager({ initial }: { initial: Booking[] }) {
  const [rows, setRows] = useState<Booking[]>(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BookingStatus | "all">("all");

  const filtered = useMemo(() => {
    return rows.filter((b) => {
      const matchesQuery =
        !query ||
        [b.customer, b.code, b.appliance, b.city, b.phone, b.email].some((v) =>
          (v ?? "").toLowerCase().includes(query.toLowerCase()),
        );
      const matchesFilter = filter === "all" || b.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [rows, query, filter]);

  // Optimistically apply, persist to Firestore, revert on failure.
  const update = async (id: string, patch: Partial<Booking>) => {
    const prev = rows;
    setRows((r) => r.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: patch.status, tech: patch.tech ?? null }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setRows(prev); // revert
    }
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Bookings</h1>
        <p className="mt-1 text-sm text-muted">Assign technicians and update job status.</p>
      </div>

      {/* toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 sm:w-72">
          <Search className="size-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ID, city, email…"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === s ? "bg-ink text-background" : "border border-border bg-surface text-muted hover:text-ink"
              }`}
            >
              {s === "all" ? "All" : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Phones get a card per booking. The table needs 46rem to stay readable,
          which on a phone means sideways scrolling past columns you can't see. */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((b) => (
          <div key={b.id} className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{b.customer}</p>
                <p className="truncate text-xs text-muted">{b.code} · {b.phone}</p>
                <p className="truncate text-xs text-muted-2">{b.email}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                ₹{b.price.toLocaleString("en-IN")}
              </p>
            </div>

            {/* One visit can cover several appliances, and the technician
                needs all of them — the count included, since that is what
                decides what goes in the van. */}
            <div className="mt-3 space-y-1 text-sm">
              {b.items.map((item, i) => (
                <p key={`${item.appliance}-${i}`}>
                  {item.brand ? `${item.brand} ` : ""}{item.appliance}
                  {/* The kind decides what goes in the van as much as the
                      count does, so it is said beside the name. */}
                  {item.variant && <span className="text-muted"> · {item.variant}</span>}
                  {item.units > 1 && (
                    <span className="ml-2 rounded-full bg-royal-bright/12 px-2 py-0.5 text-[0.68rem] font-bold text-royal-bright">
                      × {item.units}
                    </span>
                  )}
                </p>
              ))}
            </div>
            <p className="text-xs text-muted">{b.problem || "—"} · {b.city}</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[0.65rem] font-medium uppercase tracking-wider text-muted">Technician</span>
                <select
                  value={b.tech ?? ""}
                  onChange={(e) => update(b.id, { tech: e.target.value || undefined, status: e.target.value && b.status === "new" ? "assigned" : b.status })}
                  className="w-full rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs outline-none focus:border-royal-bright"
                >
                  <option value="">Unassigned</option>
                  {TECHNICIANS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[0.65rem] font-medium uppercase tracking-wider text-muted">Status</span>
                <select
                  value={b.status}
                  onChange={(e) => update(b.id, { status: e.target.value as BookingStatus })}
                  className="w-full rounded-lg border px-2 py-2 text-xs font-medium outline-none"
                  style={{ color: STATUS_META[b.status].color, borderColor: `${STATUS_META[b.status].color}55`, background: `${STATUS_META[b.status].color}12` }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} style={{ color: "#111" }}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border-strong bg-surface py-10 text-center text-muted">
            No bookings yet.
          </p>
        )}
      </div>

      {/* table — lg and up, where the columns actually fit */}
      <div data-lenis-prevent className="hidden overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-surface shadow-premium-sm lg:block">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Technician</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-surface-2/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{b.customer}</p>
                  <p className="text-xs text-muted">{b.code} · {b.phone}</p>
                  <p className="text-xs text-muted-2">{b.email}</p>
                </td>
                <td className="px-4 py-3">
                  {b.items.map((item, i) => (
                    <p key={`${item.appliance}-${i}`}>
                      {item.brand ? `${item.brand} ` : ""}{item.appliance}
                      {item.variant && <span className="text-muted"> · {item.variant}</span>}
                      {item.units > 1 && (
                        <span className="ml-2 rounded-full bg-royal-bright/12 px-2 py-0.5 text-[0.68rem] font-bold text-royal-bright">
                          × {item.units}
                        </span>
                      )}
                    </p>
                  ))}
                  <p className="text-xs text-muted">{b.problem || "—"} · {b.city}</p>
                </td>
                <td className="px-4 py-3 tabular-nums">₹{b.price.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <select
                    value={b.tech ?? ""}
                    onChange={(e) => update(b.id, { tech: e.target.value || undefined, status: e.target.value && b.status === "new" ? "assigned" : b.status })}
                    className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-royal-bright"
                  >
                    <option value="">Unassigned</option>
                    {TECHNICIANS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={b.status}
                    onChange={(e) => update(b.id, { status: e.target.value as BookingStatus })}
                    className="rounded-lg border px-2 py-1.5 text-xs font-medium outline-none"
                    style={{ color: STATUS_META[b.status].color, borderColor: `${STATUS_META[b.status].color}55`, background: `${STATUS_META[b.status].color}12` }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} style={{ color: "#111" }}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No bookings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Live from Firestore · changes save automatically.</p>
    </div>
  );
}
