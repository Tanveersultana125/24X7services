"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, CheckCircle2, Wrench, CalendarClock, ArrowRight } from "lucide-react";
import { ReviewForm, type ReviewTarget } from "@/components/reviews/ReviewForm";
import { cn } from "@/lib/utils";

export type RateableJob = ReviewTarget & {
  /** Human date of the visit, shown so a customer with several jobs can tell them apart. */
  when: string;
};

/**
 * The customer-facing review page. Reviews are tied to a completed booking, so
 * this lists the jobs that can be rated rather than offering an open form —
 * that's what keeps the public reviews page free of invented ones.
 */
export function WriteReview({
  jobs,
  ratedJobs,
}: {
  jobs: RateableJob[];
  /** Already-reviewed jobs, listed so the page explains itself rather than hiding them. */
  ratedJobs: RateableJob[];
}) {
  // One job to rate is the common case — start on its form.
  const [selected, setSelected] = useState<RateableJob | null>(jobs[0] ?? null);
  const [submitted, setSubmitted] = useState<string[]>([]);

  const pending = jobs.filter((j) => !submitted.includes(j.bookingId));

  if (jobs.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-border-strong bg-surface p-8 text-center sm:p-12">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface-2 text-primary">
          <Star className="size-6" />
        </div>
        <h2 className="mt-5 text-xl font-bold tracking-tight">
          {ratedJobs.length > 0 ? "You've rated every visit" : "Nothing to rate yet"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          {ratedJobs.length > 0
            ? "Thank you — every completed service on your account has a review. Your next visit will show up here."
            : "A review is tied to a real visit, which is why there are no invented ones on our reviews page. Once a technician completes a job on your account, you can rate it here."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/book"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Book a service <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-full border border-border-strong px-6 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            My bookings
          </Link>
        </div>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-border bg-surface p-8 text-center shadow-premium-sm sm:p-12">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/12 text-accent">
          <CheckCircle2 className="size-7" />
        </div>
        <h2 className="mt-5 text-xl font-bold tracking-tight">Thanks for the feedback</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Our team reads every review. Once it&apos;s approved it appears on the reviews page.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/reviews"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Read reviews <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-full border border-border-strong px-6 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            My bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
      {/* which visit — only worth a column when there's a choice to make */}
      {pending.length > 1 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Choose a visit
          </p>
          {pending.map((job) => (
            <button
              key={job.bookingId}
              onClick={() => setSelected(job)}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-2xl border bg-surface p-4 text-left transition-colors",
                selected?.bookingId === job.bookingId
                  ? "border-primary shadow-premium-sm"
                  : "border-border hover:border-border-strong",
              )}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary">
                <Wrench className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{job.appliance}</span>
                <span className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">
                  <CalendarClock className="size-3.5" /> {job.when} · {job.code}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "rounded-[1.75rem] border border-border bg-surface p-6 shadow-premium-sm sm:p-8",
          pending.length > 1 ? "" : "lg:col-span-2 lg:max-w-[36rem]",
        )}
      >
        {selected && (
          <ReviewForm
            key={selected.bookingId}
            target={selected}
            onSubmitted={(bookingId) => {
              setSubmitted((prev) => [...prev, bookingId]);
              const next = pending.find((j) => j.bookingId !== bookingId);
              setSelected(next ?? null);
            }}
            done={
              <div className="py-6 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/12 text-accent">
                  <CheckCircle2 className="size-7" />
                </div>
                <h2 className="mt-5 text-xl font-bold tracking-tight">Review sent</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                  It appears on the reviews page once our team approves it.
                </p>
              </div>
            }
          />
        )}
      </motion.div>
    </div>
  );
}
