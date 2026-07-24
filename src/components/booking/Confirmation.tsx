"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2, UserCheck, Navigation, Wrench, FileText, ShieldCheck, Star, PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { brandLabel, applianceLabel } from "@/lib/data";
import { formatINR } from "@/lib/utils";
import type { BookingDraft } from "@/lib/types";

const TIMELINE = [
  { icon: CheckCircle2, title: "Booking Confirmed", desc: "Payment secured. You'll get an SMS & email receipt.", state: "done" },
  { icon: UserCheck, title: "Technician Assigned", desc: "Ravi Kumar · 4.9★ · 8 yrs · Certified specialist", state: "done" },
  { icon: Navigation, title: "Live Tracking", desc: "Track arrival in real time on the map.", state: "active" },
  { icon: Wrench, title: "Service Completed", desc: "Repair done with genuine parts.", state: "upcoming" },
  { icon: FileText, title: "Digital Invoice", desc: "GST invoice generated automatically.", state: "upcoming" },
  { icon: ShieldCheck, title: "Warranty Registered", desc: "90-day warranty activated on your repair.", state: "upcoming" },
  { icon: Star, title: "Feedback", desc: "Rate your experience & help us improve.", state: "upcoming" },
];

export function Confirmation({ draft, total }: { draft: BookingDraft; total: number }) {
  const appliance = applianceLabel(draft);
  const brand = brandLabel(draft);
  const id = `24X7-${String(Math.floor(100000 + Math.random() * 899999))}`;

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="flex flex-col items-center text-center"
      >
        <div className="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-accent to-success text-white shadow-[0_12px_40px_-8px_rgba(0,200,83,0.6)]">
          <span className="absolute inset-0 animate-pulse-ring rounded-full ring-4 ring-accent/40" />
          <PartyPopper className="size-9" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Booking Confirmed!</h1>
        <p className="mt-3 text-balance text-muted">
          Your {brand} {appliance} service is booked for{" "}
          <span className="font-semibold text-foreground">{draft.date}</span> ·{" "}
          <span className="font-semibold text-foreground">{draft.slot}</span>.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full glass px-4 py-2 text-sm font-semibold">
            Booking ID: <span className="text-primary">{id}</span>
          </span>
          <span className="rounded-full bg-accent/15 px-4 py-2 text-sm font-semibold text-accent">
            {formatINR(total)} paid
          </span>
        </div>
      </motion.div>

      <div className="mt-12 rounded-3xl border border-border bg-surface p-6 shadow-premium-md sm:p-8">
        <h2 className="text-lg font-bold tracking-tight">Your service journey</h2>
        <ol className="mt-6 space-y-1">
          {TIMELINE.map((t, i) => {
            const Icon = t.icon;
            const done = t.state === "done";
            const active = t.state === "active";
            return (
              <motion.li
                key={t.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="relative flex gap-4 pb-6 last:pb-0"
              >
                {i < TIMELINE.length - 1 && (
                  <span
                    className={`absolute left-[19px] top-11 h-[calc(100%-2.75rem)] w-0.5 ${
                      done ? "bg-accent" : "bg-border"
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full ${
                    done
                      ? "bg-accent text-white"
                      : active
                        ? "bg-primary text-white shadow-premium-md"
                        : "bg-surface-2 text-muted-2"
                  }`}
                >
                  {active && <span className="absolute inset-0 animate-pulse-ring rounded-full ring-2 ring-primary/50" />}
                  <Icon className="size-5" />
                </div>
                <div className="pt-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{t.title}</h3>
                    {active && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{t.desc}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href="/track" size="lg" className="flex-1">
          <Navigation className="size-5" /> Track Technician
        </Button>
        <Button href="/dashboard" size="lg" variant="outline" className="flex-1">
          Go to Dashboard
        </Button>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Need help? <Link href="/#ai" className="font-semibold text-primary">Chat with our AI assistant</Link> or call 1800-200-247.
      </p>
    </div>
  );
}
