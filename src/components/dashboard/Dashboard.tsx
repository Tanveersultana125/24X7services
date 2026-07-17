"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarClock, FileText, ShieldCheck, Sparkles, Navigation, Plus, Star,
  Download, MapPin, Heart, Bell, CreditCard, Wrench, ChevronRight,
} from "lucide-react";
import { StaggerGroup, staggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { formatINR, cn } from "@/lib/utils";

const STATS = [
  { icon: Wrench, label: "Total services", value: "14", tint: "text-primary bg-primary/10" },
  { icon: ShieldCheck, label: "Active warranties", value: "3", tint: "text-accent bg-accent/10" },
  { icon: FileText, label: "Invoices", value: "14", tint: "text-secondary bg-secondary/10" },
  { icon: Sparkles, label: "AMC plan", value: "Premium", tint: "text-warning bg-warning/10" },
];

const HISTORY = [
  { id: "24X7-482910", appliance: "Samsung Refrigerator", problem: "Not Cooling", date: "Today · 10–12 PM", status: "In progress", amount: 899, tone: "primary" },
  { id: "24X7-471203", appliance: "IFB Washing Machine", problem: "Drum Issue", date: "12 Jun 2026", status: "Completed", amount: 1499, tone: "accent" },
  { id: "24X7-455870", appliance: "LG Microwave", problem: "Not Heating", date: "28 May 2026", status: "Completed", amount: 749, tone: "accent" },
  { id: "24X7-441290", appliance: "Bosch Oven", problem: "Thermostat", date: "9 Apr 2026", status: "Completed", amount: 1199, tone: "accent" },
];

const TABS = ["Overview", "Bookings", "Invoices", "Warranty", "Addresses"] as const;

export function Dashboard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white shadow-premium-md">AR</div>
          <div>
            <p className="text-sm text-muted">Welcome back,</p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Ananya Rao</h1>
          </div>
        </div>
        <Button href="/book" size="md"><Plus className="size-4" /> New Booking</Button>
      </div>

      {/* Stats */}
      <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <motion.div key={s.label} variants={staggerItem} className="rounded-3xl border border-border bg-surface p-5 shadow-premium-sm">
            <div className={cn("grid size-11 place-items-center rounded-2xl", s.tint)}>
              <s.icon className="size-5" />
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </motion.div>
        ))}
      </StaggerGroup>

      {/* Active service banner */}
      <div className="mt-8 overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/8 to-accent/8 p-6 shadow-premium-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="relative grid size-12 place-items-center rounded-2xl bg-primary text-white">
              <Navigation className="size-6" />
              <span className="absolute inset-0 animate-pulse-ring rounded-2xl ring-2 ring-primary/50" />
            </div>
            <div>
              <p className="flex items-center gap-2 font-bold">
                Technician on the way
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">LIVE</span>
              </p>
              <p className="text-sm text-muted">Samsung Refrigerator · Not Cooling · Ravi K. · ETA 8 min</p>
            </div>
          </div>
          <Button href="/track" variant="primary" size="md">Track live <ChevronRight className="size-4" /></Button>
        </div>
      </div>

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
          <div className="space-y-4">
            {HISTORY.map((h) => (
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
                    h.tone === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
                  )}>{h.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Invoices" && (
          <div className="space-y-3">
            {HISTORY.map((h) => (
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
        )}

        {tab === "Warranty" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HISTORY.slice(0, 3).map((h, i) => (
              <div key={h.id} className="rounded-3xl border border-border bg-surface p-6 shadow-premium-sm">
                <div className="flex items-center justify-between">
                  <div className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent"><ShieldCheck className="size-5" /></div>
                  <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">Active</span>
                </div>
                <p className="mt-4 font-semibold">{h.appliance}</p>
                <p className="text-sm text-muted">{h.problem}</p>
                <div className="mt-4 border-t border-border pt-4 text-sm text-muted">
                  <p>90-day warranty</p>
                  <p className="mt-0.5 font-semibold text-foreground">{[62, 44, 20][i]} days remaining</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Addresses" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { tag: "Home", addr: "Flat 402, Prestige Residency, Indiranagar, Bengaluru 560038" },
              { tag: "Office", addr: "5th Floor, WeWork Galaxy, Residency Road, Bengaluru 560025" },
            ].map((a) => (
              <div key={a.tag} className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-premium-sm">
                <div className="grid size-11 place-items-center rounded-xl bg-surface-2 text-primary"><MapPin className="size-5" /></div>
                <div>
                  <p className="font-semibold">{a.tag}</p>
                  <p className="mt-0.5 text-sm text-muted">{a.addr}</p>
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
        <Star className="size-4 fill-warning text-warning" /> Premium AMC member since 2024
      </div>
    </div>
  );
}
