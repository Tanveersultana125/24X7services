"use client";

import { useMemo } from "react";
import { CalendarRange, CheckCircle2, IndianRupee, TrendingUp } from "lucide-react";
import type { Booking } from "@/lib/bookings";
import { formatINR } from "@/lib/utils";

/**
 * What the month came to.
 *
 * Only completed visits count — a job on the list is not money, and a figure
 * that included the ones still open would be a promise the technician then has
 * to explain. Grouped by month, newest first, because that is the unit a
 * payout is settled in.
 */

const MONTH = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

/** "2026-07-18" → "July 2026". Parsed by hand: `new Date(s)` reads it as UTC. */
function monthLabel(date: string): string {
  const [y, m] = date.split("-").map(Number);
  if (!y || !m) return "Undated";
  return MONTH.format(new Date(y, m - 1, 1));
}

export function Earnings({ jobs }: { jobs: Booking[] }) {
  const { months, total, count } = useMemo(() => {
    const done = jobs.filter((j) => j.status === "completed");
    const map = new Map<string, { label: string; jobs: Booking[]; total: number }>();

    for (const job of done) {
      const key = job.date.slice(0, 7) || "0000-00";
      const row = map.get(key) ?? { label: monthLabel(job.date), jobs: [], total: 0 };
      row.jobs.push(job);
      row.total += job.price;
      map.set(key, row);
    }

    return {
      months: [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([, v]) => v),
      total: done.reduce((sum, j) => sum + j.price, 0),
      count: done.length,
    };
  }, [jobs]);

  const average = count ? Math.round(total / count) : 0;

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[-0.02em]">Earnings</h1>
      <p className="mt-1 text-sm text-muted">
        Every visit you finished, and what it was billed at.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-ink p-6 text-background shadow-premium-md">
        <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-background/60">
          <IndianRupee className="size-3.5" strokeWidth={2.4} /> Total billed
        </p>
        <p className="font-display mt-2 text-4xl tabular-nums tracking-tight">{formatINR(total)}</p>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-background/15 pt-4">
          <span>
            <span className="flex items-center gap-1.5 text-[0.68rem] text-background/60">
              <CheckCircle2 className="size-3.5" /> Jobs finished
            </span>
            <span className="mt-1 block text-lg font-semibold tabular-nums">{count}</span>
          </span>
          <span>
            <span className="flex items-center gap-1.5 text-[0.68rem] text-background/60">
              <TrendingUp className="size-3.5" /> Average job
            </span>
            <span className="mt-1 block text-lg font-semibold tabular-nums">{formatINR(average)}</span>
          </span>
        </div>
      </div>

      {months.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted">
          Nothing finished yet. Completed jobs and their value show up here.
        </p>
      ) : (
        months.map((month) => (
          <section key={month.label} className="mt-7">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted">
                <CalendarRange className="size-3.5" strokeWidth={2.2} /> {month.label}
              </h2>
              <span className="text-sm font-semibold tabular-nums">{formatINR(month.total)}</span>
            </div>

            <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-2xl border border-border bg-surface">
              {month.jobs.map((job) => (
                <li key={job.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.88rem] font-medium">
                      {`${job.brand} ${job.appliance}`.trim() || "Service visit"}
                    </span>
                    <span className="mt-0.5 block truncate text-[0.72rem] text-muted">
                      {job.date} · {job.city || job.problem}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.88rem] font-semibold tabular-nums">
                    {formatINR(job.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
