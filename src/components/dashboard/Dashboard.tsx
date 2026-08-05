"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { motion } from "framer-motion";
import {
  CalendarClock, FileText, ShieldCheck, Sparkles, Navigation, Plus, Star,
  Download, MapPin, Heart, Bell, CreditCard, Wrench, ChevronRight, LogOut,
} from "lucide-react";
import { StaggerGroup, staggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ReviewDialog, type ReviewTarget } from "./ReviewDialog";
import { formatINR, cn } from "@/lib/utils";
import type { Booking } from "@/lib/bookings";

const TABS = [
  "Overview",
  "Bookings",
  "Invoices",
  "Warranty",
  "Notifications",
  "Payments",
  "Addresses",
] as const;

/** What each booking status means to the customer, for the notifications feed. */
const STATUS_NOTE: Record<Booking["status"], { title: string; body: string; tint: string }> = {
  new: {
    title: "Booking confirmed",
    body: "We're assigning a certified technician to your job.",
    tint: "text-primary bg-primary/10",
  },
  assigned: {
    title: "Technician assigned",
    body: "Your technician is scheduled — you can track them on the day.",
    tint: "text-warning bg-warning/12",
  },
  "in-progress": {
    title: "Technician on the way",
    body: "Follow the live location from the tracking page.",
    tint: "text-secondary bg-secondary/10",
  },
  completed: {
    title: "Service completed",
    body: "Your 90-day repair warranty is now active.",
    tint: "text-accent bg-accent/12",
  },
  cancelled: {
    title: "Booking cancelled",
    body: "This job was cancelled. Nothing was charged.",
    tint: "text-danger bg-danger/12",
  },
};

const STATUS_LABEL: Record<Booking["status"], string> = {
  new: "New",
  assigned: "Assigned",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

type DashboardUser = { name: string; email: string; picture?: string };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

export function Dashboard({
  user,
  bookings = [],
  reviewedBookingIds = [],
  intent,
}: {
  user?: DashboardUser;
  bookings?: Booking[];
  /** Booking ids this customer has already reviewed — those rows show "Rated". */
  reviewedBookingIds?: string[];
  /** "rate" — arrived from a review CTA, so open on the jobs that can be rated. */
  intent?: "rate";
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(intent === "rate" ? "Bookings" : "Overview");
  const [rated, setRated] = useState<string[]>(reviewedBookingIds);
  // Arriving from "Rate your service" opens the form on the job waiting to be
  // rated, so the customer doesn't have to hunt for it among their bookings.
  const [reviewing, setReviewing] = useState<ReviewTarget | null>(() => {
    if (intent !== "rate") return null;
    const next = bookings.find((b) => b.status === "completed" && !reviewedBookingIds.includes(b.id));
    return next
      ? {
          bookingId: next.id,
          code: next.code,
          appliance: `${next.brand ? `${next.brand} ` : ""}${next.appliance}`,
        }
      : null;
  });
  const tabsRef = useRef<HTMLDivElement>(null);
  const name = user?.name ?? "there";

  const history = bookings.map((b) => ({
    id: b.code,
    bookingId: b.id,
    appliance: `${b.brand ? `${b.brand} ` : ""}${b.appliance}`,
    problem: b.problem || "Service",
    date: b.slot ? `${b.date} · ${b.slot}` : b.date,
    status: STATUS_LABEL[b.status],
    amount: b.price,
    tone: b.status === "completed" ? "accent" : b.status === "cancelled" ? "danger" : "primary",
    address: [b.address?.line1, b.address?.line2, b.city, b.address?.pincode].filter(Boolean).join(", "),
    // Only a finished job can be rated, and only once.
    canReview: b.status === "completed" && !rated.includes(b.id),
    isRated: rated.includes(b.id),
  }));

  const completed = bookings.filter((b) => b.status === "completed");
  const live = bookings.find((b) => b.status === "assigned" || b.status === "in-progress");

  // Payment methods the customer has actually used, with what each has cost them.
  const totalPaid = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.price, 0);

  const payments = Object.values(
    bookings
      .filter((b) => b.payment && b.status !== "cancelled")
      .reduce<Record<string, { method: string; count: number; total: number }>>((acc, b) => {
        const entry = acc[b.payment] ?? { method: b.payment, count: 0, total: 0 };
        entry.count += 1;
        entry.total += b.price;
        acc[b.payment] = entry;
        return acc;
      }, {}),
  ).sort((a, b) => b.count - a.count);

  const stats = [
    { icon: Wrench, label: "Total services", value: String(bookings.length), tint: "text-primary bg-primary/10" },
    { icon: ShieldCheck, label: "Active warranties", value: String(completed.length), tint: "text-accent bg-accent/10" },
    { icon: FileText, label: "Invoices", value: String(bookings.length), tint: "text-secondary bg-secondary/10" },
    { icon: Sparkles, label: "AMC plan", value: "Free", tint: "text-warning bg-warning/10" },
  ];

  return (
    <div>
      {/* The dashboard is often a detour — from a review CTA, a warranty link —
          so it offers the way back rather than only the site nav. */}
      <div className="mb-6">
        <BackLink />
      </div>

      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        {/* min-w-0 + truncate: without it a long email can't shrink and pushes
            the whole page into a horizontal scroll on phones */}
        <div className="flex min-w-0 items-center gap-4">
          {user?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.picture}
              alt=""
              referrerPolicy="no-referrer"
              className="size-14 shrink-0 rounded-2xl object-cover shadow-premium-md"
            />
          ) : (
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white shadow-premium-md">
              {initials(name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[0.8rem] text-muted">Welcome back,</p>
            <h1 className="mt-0.5 truncate text-[1.4rem] font-extrabold leading-tight tracking-tight sm:text-3xl">{name}</h1>
            {user?.email && <p className="mt-0.5 truncate text-[0.8rem] text-muted">{user.email}</p>}
          </div>
        </div>
        {/* Both actions share the row evenly on phones. `min-w-0` matters:
            without it each button's own text sets a floor it can't shrink past,
            and the pair pushes off the right edge on a narrow screen. */}
        <div className="flex w-full items-center gap-2.5 sm:w-auto sm:shrink-0">
          <form action="/api/auth/logout" method="post" className="min-w-0 flex-1 sm:flex-none">
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border-strong px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 sm:px-4"
            >
              <LogOut className="size-4 shrink-0" />
              <span className="truncate">Log out</span>
            </button>
          </form>
          <Button href="/book" size="md" className="min-w-0 flex-1 px-4 sm:flex-none sm:px-6">
            <Plus className="size-4 shrink-0" />
            <span className="truncate">New Booking</span>
          </Button>
        </div>
      </div>

      {/* Stats — 2×2 on phones; one per row made the page needlessly long */}
      <StaggerGroup className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={staggerItem}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:block sm:rounded-3xl sm:p-5"
          >
            <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl sm:rounded-2xl", s.tint)}>
              <s.icon className="size-5" />
            </div>
            <div className="min-w-0 sm:mt-4">
              <p className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">{s.value}</p>
              <p className="mt-0.5 truncate text-[0.8rem] text-muted sm:text-sm">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </StaggerGroup>

      {/* Active service banner — only when a job is actually live */}
      {live && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 to-accent/8 p-5 shadow-premium-sm sm:rounded-3xl sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
              <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-white sm:size-12">
                <Navigation className="size-5 sm:size-6" />
                <span className="absolute inset-0 animate-pulse-ring rounded-2xl ring-2 ring-primary/50" />
              </div>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {live.status === "in-progress" ? "Technician on the way" : "Technician assigned"}
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">LIVE</span>
                </p>
                <p className="text-sm text-muted">
                  {live.brand ? `${live.brand} ` : ""}{live.appliance} · {live.problem || "Service"}
                  {live.tech ? ` · ${live.tech}` : ""}
                </p>
              </div>
            </div>
            <Button href="/track" variant="primary" size="md" className="w-full sm:w-auto">
              Track live <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tabs — seven of these can't fit a phone, so the strip scrolls. The
          right-edge fade is the only thing telling you there's more than
          "Warranty" over there; without it those tabs are invisible. */}
      <div ref={tabsRef} className="relative mt-10 scroll-mt-24 border-b border-border">
        <div data-lenis-prevent className="flex gap-1 overflow-x-auto overscroll-x-contain no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              ref={(el) => {
                if (el && tab === t) el.scrollIntoView({ block: "nearest", inline: "nearest" });
              }}
              onClick={() => setTab(t)}
              className={cn(
                "relative whitespace-nowrap px-4 py-3.5 text-sm font-semibold transition-colors",
                tab === t ? "text-primary" : "text-muted hover:text-foreground"
              )}
            >
              {t}
              {tab === t && <motion.span layoutId="dashtab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
          {/* keeps the last tab clear of the fade */}
          <span aria-hidden className="w-6 shrink-0 sm:hidden" />
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent sm:hidden"
        />
      </div>

      {/* Content */}
      <div className="mt-8">
        {(tab === "Overview" || tab === "Bookings") && (
          history.length === 0 ? (
            intent === "rate" ? (
              <EmptyState
                label="Nothing to rate yet."
                hint="Reviews are tied to a real visit — rate a job here once a technician has completed it."
              />
            ) : (
              <EmptyState />
            )
          ) : (
            <div className="space-y-4">
              {/* Arrived to leave a review with no completed job to review. */}
              {intent === "rate" && !history.some((h) => h.canReview || h.isRated) && (
                <p className="rounded-2xl border border-dashed border-border-strong bg-surface px-4 py-3 text-sm text-muted">
                  You can rate a service once the visit is completed — your open bookings are below.
                </p>
              )}
              {history.map((h) => (
                <div key={h.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary"><Wrench className="size-5" /></div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{h.appliance}</p>
                      <p className="truncate text-sm text-muted">{h.problem} · {h.id}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="text-sm text-muted">
                      <p className="flex items-center gap-1.5"><CalendarClock className="size-3.5" /> {h.date}</p>
                      <p className="mt-0.5 font-semibold text-foreground">{formatINR(h.amount)}</p>
                    </div>
                    <span className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      h.tone === "accent" ? "bg-accent/15 text-accent"
                        : h.tone === "danger" ? "bg-danger/15 text-danger"
                        : "bg-primary/15 text-primary"
                    )}>{h.status}</span>

                    {h.canReview && (
                      <button
                        onClick={() => setReviewing({ bookingId: h.bookingId, code: h.id, appliance: h.appliance })}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-strong px-4 text-xs font-semibold transition-colors hover:border-warning hover:text-warning"
                      >
                        <Star className="size-3.5" /> Rate service
                      </button>
                    )}
                    {h.isRated && (
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-warning/12 px-4 text-xs font-semibold text-warning">
                        <Star className="size-3.5 fill-warning" /> Rated
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "Invoices" && (
          history.length === 0 ? (
            <EmptyState label="No invoices yet." />
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
                  <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-secondary"><FileText className="size-5" /></div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">Invoice {h.id}</p>
                      <p className="truncate text-sm text-muted">{h.appliance} · {formatINR(h.amount)}</p>
                    </div>
                  </div>
                  <button className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border-strong px-3.5 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary sm:px-4">
                    <Download className="size-4" /> PDF
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "Warranty" && (
          completed.length === 0 ? (
            <EmptyState label="Warranties activate once a repair is completed." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completed.slice(0, 6).map((b) => (
                <div key={b.id} className="rounded-2xl border border-border bg-surface p-5 shadow-premium-sm sm:rounded-3xl sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent"><ShieldCheck className="size-5" /></div>
                    <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">Active</span>
                  </div>
                  <p className="mt-4 font-semibold">{b.brand ? `${b.brand} ` : ""}{b.appliance}</p>
                  <p className="text-sm text-muted">{b.problem || "Service"}</p>
                  <div className="mt-4 border-t border-border pt-4 text-sm text-muted">
                    <p>90-day warranty</p>
                    <p className="mt-0.5 font-semibold text-foreground">Registered on repair</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "Notifications" && (
          bookings.length === 0 ? (
            <EmptyState label="Nothing to report yet." />
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const note = STATUS_NOTE[b.status];
                return (
                  <div key={b.id} className="flex gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:gap-4 sm:p-5">
                    <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", note.tint)}>
                      <Bell className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="font-semibold">{note.title}</p>
                        <span className="text-xs text-muted">{b.date}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{note.body}</p>
                      <p className="mt-2 text-xs text-muted">
                        {b.brand ? `${b.brand} ` : ""}{b.appliance} · {b.code}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "Payments" && (
          payments.length === 0 ? (
            <EmptyState label="No payments yet." />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
                <p className="text-sm text-muted">Total paid across {bookings.length} booking{bookings.length === 1 ? "" : "s"}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{formatINR(totalPaid)}</p>
              </div>

              {payments.map((p) => (
                <div key={p.method} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:gap-4 sm:p-5">
                  <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary">
                      <CreditCard className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.method}</p>
                      <p className="text-sm text-muted">
                        Used on {p.count} booking{p.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold">{formatINR(p.total)}</p>
                </div>
              ))}

              {/* Saved cards need a payment provider on file — say so rather than
                  showing an "add card" form that can't store anything. */}
              <p className="rounded-2xl border border-dashed border-border-strong px-5 py-4 text-sm text-muted">
                These are the methods you&apos;ve paid with so far. Saving a card for one-tap
                checkout arrives with online payments — for now you choose your method during
                each booking.
              </p>
            </div>
          )
        )}

        {tab === "Addresses" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {history.filter((h) => h.address).slice(0, 4).map((h) => (
              <div key={h.id} className="flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:gap-4 sm:p-5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary"><MapPin className="size-5" /></div>
                <div className="min-w-0">
                  <p className="font-semibold">Service address</p>
                  <p className="mt-0.5 text-sm text-muted">{h.address}</p>
                </div>
              </div>
            ))}
            <button className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong p-5 text-sm font-semibold text-muted transition-colors hover:border-primary hover:text-primary">
              <Plus className="size-4" /> Add new address
            </button>
          </div>
        )}
      </div>

      {/* Quick links — the two that have a panel switch to it rather than
          pointing at a dead anchor. */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <Link
          href="/#services"
          className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm transition-all hover:-translate-y-0.5 hover:shadow-premium-md"
        >
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary"><Heart className="size-5" /></div>
          <span className="min-w-0 truncate font-medium">Favourite services</span>
          <ChevronRight className="ml-auto size-4 text-muted transition-transform group-hover:translate-x-0.5" />
        </Link>

        {([
          { icon: Bell, label: "Notifications", target: "Notifications" },
          { icon: CreditCard, label: "Payment methods", target: "Payments" },
        ] as const).map((q) => (
          <button
            key={q.label}
            onClick={() => {
              setTab(q.target);
              tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-premium-sm transition-all hover:-translate-y-0.5 hover:shadow-premium-md"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary"><q.icon className="size-5" /></div>
            <span className="min-w-0 truncate font-medium">{q.label}</span>
            <ChevronRight className="ml-auto size-4 text-muted transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted">
        <Star className="size-4 fill-warning text-warning" /> Thanks for choosing 24X7 Services
      </div>

      <ReviewDialog
        target={reviewing}
        onClose={() => setReviewing(null)}
        onSubmitted={(bookingId) => setRated((prev) => [...prev, bookingId])}
      />
    </div>
  );
}

function EmptyState({
  label = "No bookings yet.",
  hint = "Book your first service and it'll show up here.",
}: {
  label?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-10 text-center sm:rounded-3xl sm:p-12">
      <div className="grid size-13 place-items-center rounded-2xl bg-surface-2 text-primary sm:size-14">
        <Wrench className="size-6" />
      </div>
      <p className="mt-4 font-semibold">{label}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>
      <Button href="/book" size="md" className="mt-5"><Plus className="size-4" /> Book a service</Button>
    </div>
  );
}
