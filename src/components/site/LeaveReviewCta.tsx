import { Star, ArrowRight } from "lucide-react";

/**
 * Reviews can only be written from the dashboard, against a completed booking —
 * this points customers there rather than offering an open form.
 */
export function LeaveReviewCta() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="flex flex-col items-start gap-8 rounded-[1.75rem] border border-border bg-surface p-8 shadow-premium-sm sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-amber text-amber" />
              ))}
            </div>
            <h2 className="font-display mt-5 text-[1.9rem] leading-[1.1] tracking-[-0.03em] sm:text-4xl">
              Had a service with us?
            </h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
              Open your dashboard and rate any completed job. Every review here is tied to a real
              booking — that&apos;s why there are no fakes on this page.
            </p>
          </div>

          <a
            /* rate=1 opens the dashboard on the jobs that can be rated, rather
               than the overview's "book your first service" prompt */
            href="/dashboard?rate=1"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-ink px-7 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Rate your service <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
