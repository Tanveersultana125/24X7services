"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Clock,
  IndianRupee,
  MapPin,
  Siren,
  Wrench,
} from "lucide-react";
import { STATUS_META, type BookingStatus } from "@/lib/admin/data";
import { todayKey } from "@/lib/booking-date";
import type { Booking } from "@/lib/bookings";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * A technician's own list of jobs.
 *
 * Sorted by when the visit is, not by when it was booked: the question on a
 * shift is "what is next", and a job taken this morning for Friday is not the
 * answer. Today comes first and is opened; the rest are behind their own tabs
 * so a long history never buries the two visits that are actually due.
 */

type Tab = "today" | "upcoming" | "done";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "done", label: "Finished" },
];

const CLOSED: BookingStatus[] = ["completed", "cancelled"];

export function JobBoard({ jobs }: { jobs: Booking[] }) {
  const today = todayKey();

  const groups = useMemo(() => {
    const open = jobs.filter((j) => !CLOSED.includes(j.status));
    // dateKey, never the label: "Sat, 8 Aug" sorts under S and "Today" under T,
    // so comparing labels put every job in the wrong pile.
    const byDate = (a: Booking, b: Booking) => a.dateKey.localeCompare(b.dateKey);
    return {
      // A visit whose day has passed and which nobody closed is still owed, so
      // it stays on today's list rather than disappearing into "upcoming".
      today: open.filter((j) => !j.dateKey || j.dateKey <= today).sort(byDate),
      upcoming: open.filter((j) => j.dateKey > today).sort(byDate),
      done: jobs
        .filter((j) => CLOSED.includes(j.status))
        .sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
    };
  }, [jobs, today]);

  const [tab, setTab] = useState<Tab>(groups.today.length || !groups.upcoming.length ? "today" : "upcoming");
  const rows = groups[tab];

  const dueToday = groups.today.length;
  const earned = groups.done
    .filter((j) => j.status === "completed")
    .reduce((sum, j) => sum + j.price, 0);

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[-0.02em]">
        {dueToday ? `${dueToday} job${dueToday === 1 ? "" : "s"} to do` : "Nothing due today"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {dueToday
          ? "Tap a job for the address, the fault and the customer's number."
          : "Anything the office assigns you turns up here."}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <Stat label="Due today" value={String(dueToday)} icon={CalendarClock} tint="#2547d0" />
        <Stat label="Upcoming" value={String(groups.upcoming.length)} icon={Clock} tint="#d9821b" />
        <Stat label="Earned" value={formatINR(earned)} icon={IndianRupee} tint="#0b9a63" />
      </div>

      <div className="mt-7 flex gap-1 rounded-full border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-[0.8rem] font-medium transition-colors",
              tab === t.id ? "bg-ink text-background" : "text-muted hover:text-ink",
            )}
          >
            {t.label}
            <span className={cn("ml-1.5 tabular-nums", tab === t.id ? "text-background/60" : "text-muted-2")}>
              {groups[t.id].length}
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted">
          {tab === "done" ? "No finished jobs yet." : "Nothing here."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((job) => (
            <li key={job.id}>
              <JobRow job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tint: string;
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-surface p-3 shadow-premium-sm"
      style={{ "--tint": tint } as React.CSSProperties}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--tint)_12%,transparent)] text-[var(--tint)]">
        <Icon className="size-4" strokeWidth={1.9} />
      </span>
      <p className="mt-2.5 truncate text-[1.05rem] font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-0.5 truncate text-[0.68rem] text-muted">{label}</p>
    </div>
  );
}

function JobRow({ job }: { job: Booking }) {
  const meta = STATUS_META[job.status];
  const what = job.items.length > 1 ? `${job.items.length} appliances` : `${job.brand} ${job.appliance}`.trim();

  return (
    <Link
      href={`/tech/jobs/${job.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-premium-md"
    >
      <span
        aria-hidden
        className="h-12 w-1 shrink-0 rounded-full"
        style={{ background: job.emergency ? "#d64545" : meta.color }}
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[0.95rem] font-semibold tracking-tight">{what || "Service visit"}</span>
          {job.emergency && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger/12 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-danger">
              <Siren className="size-2.5" /> Urgent
            </span>
          )}
        </span>

        <span className="mt-1 flex items-center gap-1.5 text-[0.78rem] text-muted">
          <Wrench className="size-3.5 shrink-0" />
          <span className="truncate">{job.problem || "Diagnosis"}</span>
        </span>

        <span className="mt-1 flex items-center gap-1.5 text-[0.78rem] text-muted">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {[job.address?.line1, job.city].filter(Boolean).join(", ") || "Address on the job"}
          </span>
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.7rem]">
          <span
            className="rounded-full px-2 py-0.5 font-semibold"
            style={{ background: `${meta.color}18`, color: meta.color }}
          >
            {meta.label}
          </span>
          <span className="text-muted-2">{job.date || "—"}</span>
          <span className="text-muted-2">{job.slot}</span>
          <span className="font-semibold tabular-nums text-ink">{formatINR(job.price)}</span>
        </span>
      </span>

      <ChevronRight className="size-5 shrink-0 text-muted-2 transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
}
