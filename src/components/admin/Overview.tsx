"use client";

import Link from "next/link";
import { CalendarCheck, IndianRupee, Clock, Star, ArrowUpRight } from "lucide-react";
import { STATUS_META } from "@/lib/admin/data";
import type { Booking } from "@/lib/bookings";
import type { Review } from "@/lib/reviews";

export function Overview({
  bookings,
  customerCount = 0,
  reviews = [],
}: {
  bookings: Booking[];
  customerCount?: number;
  reviews?: Review[];
}) {
  const active = bookings.filter((b) => b.status !== "completed" && b.status !== "cancelled");
  const revenue = bookings.filter((b) => b.status === "completed").reduce((s, b) => s + b.price, 0);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  const stats = [
    { label: "Active bookings", value: active.length, icon: CalendarCheck, tint: "#2547d0" },
    { label: "Revenue (completed)", value: `₹${revenue.toLocaleString("en-IN")}`, icon: IndianRupee, tint: "#0b9a63" },
    { label: "Customers", value: customerCount, icon: Clock, tint: "#d9821b" },
    { label: "Avg. rating", value: avgRating, icon: Star, tint: "#7c3aed" },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-muted">A snapshot of your operations today.</p>
      </div>

      {/* 2×2 on phones — four full-width tiles pushed everything below the fold */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
            <span className="grid size-9 place-items-center rounded-xl sm:size-10" style={{ background: `${s.tint}18`, color: s.tint }}>
              <s.icon className="size-4.5 sm:size-5" />
            </span>
            <p className="mt-3 truncate text-xl font-semibold tracking-[-0.01em] sm:mt-4 sm:text-2xl">{s.value}</p>
            <p className="mt-1 text-[0.78rem] leading-snug text-muted sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-premium-sm">
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-4 sm:px-5">
          <h2 className="font-medium">Recent bookings</h2>
          <Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm text-royal-bright hover:underline">
            View all <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="divide-y divide-hairline">
          {bookings.slice(0, 5).map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm sm:gap-4 sm:px-5">
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
