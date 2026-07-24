"use client";

import Link from "next/link";
import { CalendarCheck, IndianRupee, Clock, Star, ArrowUpRight } from "lucide-react";
import { REVIEWS, STATUS_META } from "@/lib/admin/data";
import type { Booking } from "@/lib/bookings";

export function Overview({ bookings, customerCount = 0 }: { bookings: Booking[]; customerCount?: number }) {
  const active = bookings.filter((b) => b.status !== "completed" && b.status !== "cancelled");
  const revenue = bookings.filter((b) => b.status === "completed").reduce((s, b) => s + b.price, 0);
  const avgRating = REVIEWS.length
    ? (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1)
    : "—";

  const stats = [
    { label: "Active bookings", value: active.length, icon: CalendarCheck, tint: "#2547d0" },
    { label: "Revenue (completed)", value: `₹${revenue.toLocaleString("en-IN")}`, icon: IndianRupee, tint: "#0b9a63" },
    { label: "Customers", value: customerCount, icon: Clock, tint: "#d9821b" },
    { label: "Avg. rating", value: avgRating, icon: Star, tint: "#7c3aed" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-[-0.02em]">Overview</h1>
        <p className="mt-1 text-sm text-muted">A snapshot of your operations today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface p-5 shadow-premium-sm">
            <span className="grid size-10 place-items-center rounded-xl" style={{ background: `${s.tint}18`, color: s.tint }}>
              <s.icon className="size-5" />
            </span>
            <p className="mt-4 text-2xl font-semibold tracking-[-0.01em]">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-premium-sm">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="font-medium">Recent bookings</h2>
          <Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm text-royal-bright hover:underline">
            View all <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="divide-y divide-hairline">
          {bookings.slice(0, 5).map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{b.customer}</p>
                <p className="truncate text-muted">{b.appliance} · {b.problem || "—"} · {b.city}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ background: `${STATUS_META[b.status].color}18`, color: STATUS_META[b.status].color }}
              >
                {STATUS_META[b.status].label}
              </span>
            </div>
          ))}
          {bookings.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted">No bookings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
