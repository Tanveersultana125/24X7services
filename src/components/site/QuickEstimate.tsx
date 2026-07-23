"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronsRight, Star, Check } from "lucide-react";
import { APPLIANCES } from "@/lib/data";

const ease = [0.16, 1, 0.3, 1] as const;

const PROMISES = [
  "No hidden cost — upfront, itemised pricing",
  "Brand-authorised, background-verified technicians",
  "Fast, flexible scheduling — same day if you need it",
];

const RATINGS = [
  { source: "Google", score: "4.9" },
  { source: "Justdial", score: "4.8" },
  { source: "Trustpilot", score: "4.7" },
];

export function QuickEstimate() {
  const [sent, setSent] = useState(false);

  return (
    <section className="relative overflow-hidden border-y border-hairline">
      {/* photo panel — right edge on desktop */}
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[40%] overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/work/ac-tech-tablet.png" alt="" className="h-full w-full object-cover object-center" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, var(--background) 0%, rgba(0,0,0,0) 34%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[92rem] px-6 py-14 sm:px-10 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_27rem] lg:gap-16">
          {/* copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
            className="max-w-xl"
          >
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted">
              India&apos;s most-booked appliance specialists
            </p>
            <h2 className="mt-4 font-display text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-[3.2rem]">
              Trusted repair and care
              <br />
              for every appliance.
            </h2>
            <p className="mt-6 text-pretty text-base leading-relaxed text-muted">
              From a fridge that stopped cooling to a full AC service before summer — our
              certified engineers arrive with genuine parts, quote before they start, and back
              every repair with a 90-day warranty. Tell us what&apos;s wrong and we&apos;ll
              come back with a free estimate.
            </p>

            <ul className="mt-8 space-y-3.5">
              {PROMISES.map((p) => (
                <li key={p} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-royal-bright text-white">
                    <ChevronsRight className="size-3.5" />
                  </span>
                  <span className="text-sm font-medium text-ink">{p}</span>
                </li>
              ))}
            </ul>

            {/* rating badges */}
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              {RATINGS.map((r) => (
                <div key={r.source} className="flex items-center gap-2.5">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-amber text-amber" />
                    ))}
                  </div>
                  <div className="leading-none">
                    <p className="text-sm font-semibold text-ink">{r.score} rating</p>
                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-muted">{r.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* form card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15, ease }}
            className="rounded-[1.75rem] border border-white/70 bg-white p-5 shadow-premium-xl sm:p-8"
          >
            {/* the side photo is desktop-only — show it above the form on small screens */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/work/ac-tech-tablet.png"
              alt=""
              aria-hidden
              className="mb-6 aspect-[16/10] w-full rounded-2xl object-cover object-[center_28%] lg:hidden"
            />
            <h3 className="text-center font-display text-2xl tracking-tight text-ink">Get in touch</h3>

            {sent ? (
              <div className="mt-8 flex flex-col items-center py-10 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-emerald/12 text-emerald">
                  <Check className="size-6" />
                </span>
                <p className="mt-5 text-base font-semibold text-ink">Request received</p>
                <p className="mt-2 max-w-xs text-sm text-muted">
                  A service advisor will call you within 10 minutes with your free estimate.
                </p>
              </div>
            ) : (
              <form
                className="mt-6 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <Field name="name" placeholder="Name" autoComplete="name" required />
                <Field name="phone" type="tel" placeholder="Phone number" autoComplete="tel" required />
                <Field name="email" type="email" placeholder="Email" autoComplete="email" />
                <select
                  name="service"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-royal-bright"
                >
                  <option value="" disabled>
                    Select service
                  </option>
                  {APPLIANCES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <Field name="address" placeholder="Street address" autoComplete="street-address" />
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Describe the problem"
                  className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-2 focus:border-royal-bright"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-royal-bright py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
                >
                  Get a free estimate
                </button>
              </form>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-hairline pt-5">
              {RATINGS.map((r) => (
                <div key={r.source} className="text-center">
                  <div className="flex justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-2.5 fill-amber text-amber" />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[0.6rem] uppercase tracking-[0.12em] text-muted">
                    {r.score} · {r.source}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-2 focus:border-royal-bright"
    />
  );
}
