"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  PhoneCall,
  ShieldCheck,
  UserRoundCheck,
  Clock,
  PackageCheck,
  Star,
  Users,
  Wrench,
  MapPin,
} from "lucide-react";
import { BrandMark } from "@/components/ui/Icons";
import { BRANDS } from "@/lib/data";
import { TESTIMONIALS } from "@/lib/content";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const FAQS: { q: string; a: string; brands?: boolean }[] = [
  { q: "How fast can a technician reach me?", a: "Book by 2 PM for same-day service. Emergency requests are prioritised and average under 90 minutes in serviced cities." },
  { q: "Are the spare parts genuine?", a: "Always. We use only brand-approved, traceable components — and every part is covered by our 90-day warranty alongside the repair." },
  { q: "What does the 90-day warranty cover?", a: "If the same issue recurs within 90 days of the visit, we return and fix it at no cost — parts and labour included, no questions asked." },
  {
    q: "Which brands and appliances do you service?",
    a: "We service a wide range of leading brands including Samsung, LG, IFB and Bosch — across refrigerators, washing machines, microwaves, ovens and other major appliances. This includes installation, uninstallation and annual maintenance.",
    brands: true,
  },
  { q: "How is pricing decided?", a: "You see a transparent estimate before booking, tuned to your brand, model and city. There are no surprise charges — the technician confirms the final quote on site before any work begins." },
  { q: "Can I reschedule or cancel?", a: "Yes, free of charge any time before the technician is dispatched. You can manage everything from your dashboard or the AI assistant." },
];

const PROMISES = [
  { icon: ShieldCheck, title: "90-Day Warranty", desc: "On all services & spare parts" },
  { icon: UserRoundCheck, title: "Certified Technicians", desc: "Trained, verified & background checked" },
  { icon: Clock, title: "24/7 Support", desc: "We're available anytime, anywhere" },
  { icon: PackageCheck, title: "Genuine Parts", desc: "100% original parts from trusted brands" },
];

const STATS = [
  { icon: Users, value: "100K+", label: "Happy Customers" },
  { icon: Wrench, value: "500+", label: "Expert Technicians" },
  { icon: MapPin, value: "25+", label: "Cities Covered" },
  { icon: ShieldCheck, value: "4.9 ★", label: "Average Rating" },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(3);

  return (
    <section id="faq" className="relative scroll-mt-28 overflow-hidden pb-12 pt-14 sm:pb-14 sm:pt-20">
      {/* technician photo rail — only once there is room for three columns */}
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[26%] xl:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/work/ac-faq-technician.png" alt="" className="h-full w-full object-cover object-center" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, var(--background) 0%, rgba(0,0,0,0) 30%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 xl:pr-[24%]">
          {/* ---------- left rail ---------- */}
          <aside>
            <Kicker>Questions</Kicker>
            <h2 className="font-display mt-5 text-[2.4rem] leading-[1.05] tracking-[-0.03em] sm:text-[3.2rem]">
              Everything,
              <br />
              answered.
            </h2>
            <p className="mt-5 max-w-sm text-pretty leading-relaxed text-muted">
              Can&apos;t find what you&apos;re looking for? Our AI assistant is here 24/7 to help
              you get answers instantly — anytime, day or night.
            </p>

            {/* promise cards */}
            <div className="mt-7 grid grid-cols-2 gap-3">
              {PROMISES.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm transition-transform duration-500 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-royal-bright/10 text-royal-bright">
                      <p.icon className="size-[1.05rem]" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-[0.78rem] font-semibold leading-tight tracking-tight text-ink">{p.title}</p>
                      <p className="mt-1.5 text-[0.68rem] leading-snug text-muted">{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* immediate help */}
            <a
              href="tel:18002000247"
              className="group mt-3 flex items-center gap-4 rounded-2xl bg-royal-bright p-4 text-white shadow-premium-lg transition-transform duration-500 hover:-translate-y-0.5"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/15">
                <PhoneCall className="size-5" strokeWidth={1.8} />
              </span>
              <span className="flex-1 leading-none">
                <span className="block text-[0.72rem] font-medium text-white/80">Need immediate help?</span>
                <span className="mt-1.5 block text-xl font-semibold tracking-tight">1800-200-247</span>
                <span className="mt-1.5 block text-[0.68rem] text-white/70">Available 24/7</span>
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 transition-transform duration-500 group-hover:scale-110">
                <PhoneCall className="size-4" strokeWidth={1.8} />
              </span>
            </a>

            {/* social proof */}
            <div className="mt-3 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-premium-sm">
              <div className="flex -space-x-2.5">
                {TESTIMONIALS.slice(0, 4).map((t) => (
                  <span
                    key={t.name}
                    className="grid size-8 place-items-center rounded-full border-2 border-surface text-[0.6rem] font-semibold text-white"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </span>
                ))}
              </div>
              <div className="leading-none">
                <p className="text-[0.78rem] text-muted">
                  Trusted by <span className="font-semibold text-ink">50,000+</span> happy customers
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-amber text-amber" />
                    ))}
                  </span>
                  <span className="text-[0.72rem] font-semibold text-ink">4.9/5</span>
                </div>
              </div>
            </div>
          </aside>

          {/* ---------- accordion ---------- */}
          {/* flex column + `grow` rows: leftover height is shared evenly between the rows
              instead of pooling as dead space under the last one */}
          <ul className="flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-premium-md sm:rounded-[1.75rem]">
            {FAQS.map((f, i) => {
              const active = open === i;
              return (
                <li
                  key={f.q}
                  className={cn(
                    "relative flex grow flex-col border-b border-hairline transition-colors last:border-b-0",
                    active ? "bg-royal-bright/[0.05]" : "hover:bg-surface-2/40"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 w-[3px] origin-top bg-royal-bright transition-transform duration-500",
                      active ? "scale-y-100" : "scale-y-0"
                    )}
                  />

                  <button
                    onClick={() => setOpen(active ? null : i)}
                    className="flex w-full grow items-center gap-4 px-5 py-5 text-left sm:gap-6 sm:px-7"
                    aria-expanded={active}
                  >
                    <span
                      className={cn(
                        "text-[0.8rem] font-medium tabular-nums transition-colors",
                        active ? "text-royal-bright" : "text-muted-2"
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-[1rem] font-semibold leading-snug tracking-tight sm:text-[1.1rem]">
                      {f.q}
                    </span>
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-300",
                        active
                          ? "bg-royal-bright/15 text-royal-bright"
                          : "border border-border text-muted"
                      )}
                    >
                      {active ? <Minus className="size-4" /> : <Plus className="size-4" />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 pl-[3.1rem] pr-6 sm:pl-[4.1rem] sm:pr-10">
                          <p className="max-w-xl text-pretty text-[0.92rem] leading-relaxed text-muted">
                            {f.a}
                          </p>

                          {f.brands && (
                            <div className="mt-5 flex flex-wrap gap-2.5">
                              {BRANDS.map((b) => (
                                <span
                                  key={b.id}
                                  className="grid h-12 min-w-[6.5rem] place-items-center rounded-xl border border-border bg-surface px-4 shadow-premium-sm"
                                >
                                  <BrandMark id={b.id} tone="brand" className="text-[0.8rem]" />
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ---------- stats bar ---------- */}
        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="relative z-10 mt-16 grid grid-cols-2 gap-y-6 rounded-[1.5rem] xl:mt-28 border border-border bg-surface px-6 py-7 shadow-premium-md sm:rounded-[1.75rem] sm:px-10 lg:grid-cols-4 lg:divide-x lg:divide-hairline"
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-3.5 lg:justify-center">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-royal-bright text-white shadow-premium-sm">
                <s.icon className="size-5" strokeWidth={1.8} />
              </span>
              <div className="leading-none">
                <dt className="font-display text-2xl tracking-tight sm:text-[1.6rem]">{s.value}</dt>
                <dd className="mt-1.5 text-[0.72rem] text-muted">{s.label}</dd>
              </div>
            </div>
          ))}
        </motion.dl>
      </div>

      {/* floating reassurance card over the photo */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2, ease }}
        className="absolute bottom-[17rem] right-8 hidden w-[17rem] rounded-2xl border border-border bg-surface p-5 shadow-premium-xl xl:block"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-royal-bright/10 text-royal-bright">
            <ShieldCheck className="size-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[0.85rem] font-semibold tracking-tight text-royal-bright">
              Safe. Reliable. Professional.
            </p>
            <p className="mt-2 text-[0.78rem] leading-relaxed text-muted">
              Your comfort is our priority. We make appliance care simple and worry-free.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
