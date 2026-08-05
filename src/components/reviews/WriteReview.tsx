"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Wrench, CalendarClock, ArrowRight, BadgeCheck, MessageSquareText } from "lucide-react";
import { ReviewForm, type ReviewTarget } from "@/components/reviews/ReviewForm";
import { cn } from "@/lib/utils";

export type RateableJob = ReviewTarget & {
  /** Human date of the visit, shown so a customer with several jobs can tell them apart. */
  when: string;
};

/**
 * The review page. Anyone can write one about the service; a signed-in customer
 * with a completed visit can attach the review to that job instead, which
 * publishes it with a verified mark.
 */
export function WriteReview({
  jobs,
  signedInAs,
}: {
  /** The customer's completed, not-yet-reviewed visits. Empty for a visitor. */
  jobs: RateableJob[];
  /** Account name of a signed-in customer, so the form can say who is posting. */
  signedInAs?: string;
}) {
  // "" is the open review — the default, since most visitors have no booking.
  const [selectedId, setSelectedId] = useState<string>("");
  const [sent, setSent] = useState(false);

  const selected = jobs.find((j) => j.bookingId === selectedId);

  if (sent) {
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
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-border-strong px-6 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", jobs.length > 0 && "lg:grid-cols-[22rem_1fr] lg:items-start")}>
      {/* Only a customer with a completed visit gets a choice to make. */}
      {jobs.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            What are you reviewing?
          </p>

          {jobs.map((job) => (
            <button
              key={job.bookingId}
              onClick={() => setSelectedId(job.bookingId)}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-2xl border bg-surface p-4 text-left transition-colors",
                selectedId === job.bookingId
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
                  <CalendarClock className="size-3.5" /> {job.when}
                </span>
                <span className="mt-1.5 inline-flex items-center gap-1 text-[0.7rem] font-semibold text-accent">
                  <BadgeCheck className="size-3.5" /> Publishes as verified
                </span>
              </span>
            </button>
          ))}

          <button
            onClick={() => setSelectedId("")}
            className={cn(
              "flex w-full items-center gap-3.5 rounded-2xl border bg-surface p-4 text-left transition-colors",
              selectedId === ""
                ? "border-primary shadow-premium-sm"
                : "border-border hover:border-border-strong",
            )}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary">
              <MessageSquareText className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">Something else</span>
              <span className="mt-0.5 block text-sm text-muted">
                General feedback about our service
              </span>
            </span>
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "rounded-[1.75rem] border border-border bg-surface p-6 shadow-premium-sm sm:p-8",
          jobs.length === 0 && "max-w-[40rem]",
        )}
      >
        <ReviewForm
          key={selectedId || "open"}
          target={selected}
          signedInAs={signedInAs}
          onSubmitted={() => setSent(true)}
          done={<></>}
        />
      </motion.div>
    </div>
  );
}
