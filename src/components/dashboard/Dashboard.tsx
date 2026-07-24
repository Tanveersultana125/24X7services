"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarClock, FileText, ShieldCheck, Sparkles, Navigation, Plus, Star,
  Download, MapPin, Heart, Bell, CreditCard, Wrench, ChevronRight, LogOut,
} from "lucide-react";
import { StaggerGroup, staggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { formatINR, cn } from "@/lib/utils";
import type { Booking } from "@/lib/bookings";

const TABS = ["Overview", "Bookings", "Invoices", "Warranty", "Addresses"] as const;

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

export function Dashboard({ user, bookings = [] }: { user?: DashboardUser; bookings?: Booking[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const name = user?.name ?? "there";

  const history = bookings.map((b) => ({
    id: b.code,
    appliance: `${b.brand ? `${b.brand} ` : ""}${b.appliance}`,
    problem: b.problem || "Service",
    date: b.slot ? `${b.date} · ${b.slot}` : b.date,
    status: STATUS_LABEL[b.status],
    amount: b.price,
    tone: b.status === "completed" ? "accent" : b.status === "cancelled" ? "danger" : "primary",
    address: [b.address?.line1, b.address?.line2, b.city, b.address?.pincode].filter(Boolean).join(", "),
  }));

  const completed = bookings.filter((b) => b.status === "completed");
  const live = bookings.find((b) => b.status === "assigned" || b.status === "in-progress");

  const stats = [
    { icon: Wrench, label: "Total services", value: String(bookings.length), tint: "text-primary bg-primary/10" },
    { icon: ShieldCheck, label: "Active warranties", value: String(completed.length), tint: "text-accent bg-accent/10" },
    { icon: FileText, label: "Invoices", value: String(bookings.length), tint: "text-secondary bg-secondary/10" },
    { icon: Sparkles, label: "AMC plan", value: "Free", tint: "text-warning bg-warning/10" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="flex items-center gap-4">
          {user?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.picture} alt="" className="size-14 rounded-2xl object-cover shadow-premium-md" />
          ) : (
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white shadow-premium-md">
              {initials(name)}
            </div>
          )}
          <div>
            <p className="text-sm text-muted">Welcome back,</p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{name}</h1>
            {user?.email && <p className="text-sm text-muted">{user.email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </form>
          <Button href="/book" size="md"><Plus className="size-4" /> New Booking</Button>
        </div>
      </div>

      {/* Stats */}
      <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={staggerItem} className="rounded-3xl border border-border bg-surface p-5 shadow-premium-sm">
            <div className={cn("grid size-11 place-items-center rounded-2xl", s.tint)}>
              <s.icon className="size-5" />
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </motion.div>
        ))}
      </StaggerGroup>

      {/* Active service banner — only when a job is actually live */}
      {live && (
        <div className="mt-8 overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/8 to-accent/8 p-6 shadow-premium-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="relative grid size-12 place-items-center rounded-2xl bg-primary text-white">
                <Navigation className="size-6" />
                <span className="absolute inset-0 animate-pulse-ring rounded-2xl ring-2 ring-primary/50" />
              </div>
              <div>
                <p className="flex items-center gap-2 font-bold">
                  {live.status === "in-progress" ? "Technician on the way" : "Technician assigned"}
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">LIVE</span>
                </p>
                <p className="text-sm text-muted">
                  {live.brand ? `${live.brand} ` : ""}{live.appliance} · {live.problem || "Service"}
                  {live.tech ? ` · ${live.tech}` : ""}
                </p>
              </div>
            </div>
            <Button href="/track" variant="primary" size="md">Track live <ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-10 flex gap-1 overflow-x-auto border-b border-border no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors",
              tab === t ? "text-primary" : "text-muted hover:text-foreground"
            )}
          >
            {t}
            {tab === t && <motion.span layoutId="dashtab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-8">
        {(tab === "Overview" || tab === "Bookings") && (
          history.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {history.map((h) => (
                <div key={h.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-premium-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid size-11 place-items-center rounded-xl bg-surface-2 text-primary"><Wrench className="size-5" /></div>
                    <div>
                      <p className="font-semibold">{h.appliance}</p>
                      <p className="text-sm text-muted">{h.problem} · {h.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 sm:gap-8">
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
                <div key={h.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-premium-sm">
                  <div className="flex items-center gap-4">
                    <div className="grid size-11 place-items-center rounded-xl bg-surface-2 text-secondary"><FileText className="size-5" /></div>
                    <div>
                      <p className="font-semibold">Invoice {h.id}</p>
                      <p className="text-sm text-muted">{h.appliance} · {formatINR(h.amount)}</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary">
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
                <div key={b.id} className="rounded-3xl border border-border bg-surface p-6 shadow-premium-sm">
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

        {tab === "Addresses" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {history.filter((h) => h.address).slice(0, 4).map((h) => (
              <div key={h.id} className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-premium-sm">
                <div className="grid size-11 place-items-center rounded-xl bg-surface-2 text-primary"><MapPin className="size-5" /></div>
                <div>
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

      {/* Quick links */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Heart, label: "Favourite services", href: "/#services" },
          { icon: Bell, label: "Notifications", href: "#" },
          { icon: CreditCard, label: "Payment methods", href: "#" },
        ].map((q) => (
          <Link key={q.label} href={q.href} className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm transition-all hover:-translate-y-0.5 hover:shadow-premium-md">
            <div className="grid size-10 place-items-center rounded-xl bg-surface-2 text-primary"><q.icon className="size-5" /></div>
            <span className="font-medium">{q.label}</span>
            <ChevronRight className="ml-auto size-4 text-muted transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted">
        <Star className="size-4 fill-warning text-warning" /> Thanks for choosing 24X7 Services
      </div>
    </div>
  );
}

function EmptyState({ label = "No bookings yet." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border-strong bg-surface p-12 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-primary">
        <Wrench className="size-6" />
      </div>
      <p className="mt-4 font-semibold">{label}</p>
      <p className="mt-1 text-sm text-muted">Book your first service and it&apos;ll show up here.</p>
      <Button href="/book" size="md" className="mt-5"><Plus className="size-4" /> Book a service</Button>
    </div>
  );
}
