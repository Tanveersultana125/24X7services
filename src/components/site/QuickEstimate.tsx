"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronsRight,
  Star,
  Check,
  User,
  Phone,
  Mail,
  MapPin,
  Wrench,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
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
      {/* photo panel — full-bleed on the right, fading into the page on the left */}
      <div aria-hidden className="absolute inset-y-0 right-0 z-0 hidden w-[42%] overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/work/ac-tech-tablet.png"
          alt=""
          className="h-full w-full object-cover object-[85%_center]"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, var(--background) 0%, rgba(0,0,0,0) 38%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[92rem] px-6 py-14 sm:px-10 sm:py-20">
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
              Telangana&apos;s most-booked appliance specialists
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
            className="overflow-hidden rounded-[1.75rem] border border-hairline bg-surface shadow-premium-xl"
          >
            {/* the side photo is desktop-only — show it above the form on small screens */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/work/ac-tech-tablet.png"
              alt=""
              aria-hidden
              className="aspect-[16/9] w-full object-cover object-[center_28%] lg:hidden"
            />

            <div className="p-6 sm:p-7">
              <div className="text-center">
                <h3 className="font-display text-[1.7rem] leading-tight tracking-tight text-ink">
                  Book your free estimate
                </h3>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-muted">
                  Tell us what&apos;s wrong — an advisor calls back in
                  <span className="font-semibold text-ink"> under 10 minutes.</span>
                </p>
              </div>

              {sent ? (
                <div className="flex flex-col items-center py-12 text-center">
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
                  className="mt-6 space-y-2.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                >
                  <Field icon={<User />} name="name" placeholder="Full name" autoComplete="name" required />
                  <Field icon={<Phone />} name="phone" type="tel" placeholder="Phone number" autoComplete="tel" required />
                  <Field icon={<Mail />} name="email" type="email" placeholder="Email address" autoComplete="email" />

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-2">
                      <Wrench className="size-[1.05rem]" />
                    </span>
                    <select
                      name="service"
                      required
                      defaultValue=""
                      className="w-full appearance-none rounded-xl border border-border bg-background py-3.5 pl-11 pr-10 text-sm text-ink outline-none transition-colors focus:border-royal-bright focus:ring-2 focus:ring-royal-bright/15 [&:invalid]:text-muted-2"
                    >
                      <option value="" disabled>
                        Select a service
                      </option>
                      {APPLIANCES.map((a) => (
                        <option key={a.id} value={a.id} className="text-ink">
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-2">
                      <ChevronDown className="size-4" />
                    </span>
                  </div>

                  <Field icon={<MapPin />} name="address" placeholder="Street address" autoComplete="street-address" />
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Briefly describe the problem"
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-2 focus:border-royal-bright focus:ring-2 focus:ring-royal-bright/15"
                  />
                  <button
                    type="submit"
                    className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-royal-bright py-4 text-sm font-semibold text-white shadow-[0_14px_30px_-10px_var(--royal-bright)] transition-all hover:brightness-105"
                  >
                    Get a free estimate
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
              )}

              <p className="mt-5 flex items-center justify-center gap-1.5 border-t border-hairline pt-5 text-[0.72rem] text-muted">
                <ShieldCheck className="size-3.5 text-emerald" />
                Your details stay private — no spam, no obligation.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Field({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-2 [&>svg]:size-[1.05rem]">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-xl border border-border bg-background py-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted-2 focus:border-royal-bright focus:ring-2 focus:ring-royal-bright/15 ${
          icon ? "pl-11 pr-4" : "px-4"
        }`}
      />
    </div>
  );
}
