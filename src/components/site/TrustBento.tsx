"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Star,
  PackageCheck,
  Headset,
  Clock,
  Users,
  ArrowRight,
  Award,
  CircleCheck,
  Zap,
  Plus,
} from "lucide-react";
import { TESTIMONIALS } from "@/lib/content";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const ROYAL = "#2547d0";
const EMERALD = "#0b9a63";
const AMBER = "#d9821b";

/** Light tiles all share one shell so the bento reads as a single system. */
const SHELL =
  "border border-white/70 bg-gradient-to-b from-white to-surface shadow-[0_16px_36px_-18px_rgba(23,21,15,0.16),inset_0_1.5px_0_rgba(255,255,255,0.9)] hover:shadow-[0_32px_56px_-22px_rgba(23,21,15,0.26)]";

const ASSURANCES = [
  { icon: ShieldCheck, title: "Trusted & Secure", desc: "Your safety is our priority" },
  { icon: Award, title: "Transparent Pricing", desc: "No hidden charges" },
  { icon: CircleCheck, title: "Quality Guaranteed", desc: "Service you can rely on" },
  { icon: Zap, title: "Fast & Reliable", desc: "We're always nearby" },
];

const cardIn = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.06, ease },
  }),
};

function Card({ i, className, children }: { i: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      custom={i}
      variants={cardIn}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] transition-all duration-500 hover:-translate-y-1.5",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/** Round accent disc used as every tile's icon. */
function Disc({
  icon: Icon,
  tint,
  className,
}: {
  icon: typeof ShieldCheck;
  tint: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-14 shrink-0 place-items-center rounded-full transition-transform duration-500 group-hover:scale-105 sm:size-16",
        className
      )}
      style={{ background: `${tint}1a`, color: tint }}
    >
      <Icon className="size-6 sm:size-7" strokeWidth={1.8} />
    </span>
  );
}

/** Circular "go" affordance on the two action tiles. */
function GoArrow({ tint, onDark }: { tint: string; onDark?: boolean }) {
  return (
    <span
      className={cn(
        "ml-auto grid size-11 shrink-0 place-items-center rounded-full transition-transform duration-500 group-hover:translate-x-1 sm:size-12",
        onDark ? "bg-white" : "border border-border bg-surface"
      )}
      style={{ color: tint }}
    >
      <ArrowRight className="size-5" />
    </span>
  );
}

export function TrustBento() {
  return (
    <section className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="max-w-2xl">
          <Kicker>Why 24X7</Kicker>
          <h2 className="font-display mt-6 text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            Trust, engineered
            <br />
            into every visit.
          </h2>
        </div>

        <div className="mt-10 grid auto-rows-[minmax(10rem,auto)] grid-cols-2 gap-4 sm:mt-14 lg:grid-cols-4">
          {/* ---------- A — 90-day warranty, photo tile ---------- */}
          <Card i={0} className="col-span-2 row-span-2 bg-[#0a1533] text-white shadow-[0_32px_60px_-24px_rgba(11,21,51,0.6)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/work/ac-hero.png"
              alt="Certified technician servicing an air conditioner"
              className="absolute inset-0 size-full object-cover object-[62%_center] transition-transform duration-[1.4s] group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(100deg, rgba(8,18,48,0.96) 0%, rgba(9,22,60,0.9) 34%, rgba(12,30,80,0.55) 58%, rgba(12,30,80,0.12) 100%)",
              }}
            />

            <div className="relative flex h-full flex-col justify-between p-7 sm:p-9">
              {/* promise badge */}
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 backdrop-blur">
                  <ShieldCheck className="size-5" strokeWidth={1.8} />
                </span>
                <span className="text-[0.68rem] font-semibold uppercase leading-[1.5] tracking-[0.16em] text-white/85">
                  Your trust,
                  <br />
                  our promise
                </span>
              </div>

              <div className="mt-10">
                <p className="font-display text-[4.5rem] leading-[0.82] tracking-tighter sm:text-[6rem]">90</p>
                <p className="mt-2 text-lg font-semibold uppercase tracking-[0.08em] sm:text-xl">Day warranty</p>

                <p className="mt-5 max-w-sm text-pretty text-[0.92rem] leading-relaxed text-white/80">
                  If it breaks again within 90 days, we fix it free. Everything we do is backed
                  in writing — parts, labour and peace of mind.
                </p>
              </div>
            </div>
          </Card>

          {/* ---------- B — verified technicians ---------- */}
          <Card i={1} className={cn(SHELL, "col-span-2 p-6 sm:p-7")}>
            <div className="flex h-full flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
              <Disc icon={Users} tint={ROYAL} />

              <div className="flex-1">
                <p className="font-display text-[2.2rem] leading-none tracking-tight sm:text-4xl">12,000+</p>
                <p className="mt-1.5 text-[0.95rem] font-semibold text-royal-bright">Verified technicians</p>
                <p className="mt-1.5 text-[0.88rem] leading-snug text-muted">
                  Police-verified, brand-certified technicians on the ground.
                </p>
              </div>

              <span aria-hidden className="hidden h-16 w-px shrink-0 bg-hairline lg:block" />

              <div className="flex shrink-0 -space-x-2.5">
                {TESTIMONIALS.slice(0, 3).map((t) => (
                  <span
                    key={t.name}
                    className="grid size-10 place-items-center rounded-full text-[0.65rem] font-semibold text-white ring-2 ring-[var(--surface)]"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </span>
                ))}
                <span className="grid size-10 place-items-center rounded-full border border-border bg-surface text-muted ring-2 ring-[var(--surface)]">
                  <Plus className="size-4" />
                </span>
              </div>
            </div>
          </Card>

          {/* ---------- C — genuine parts ---------- */}
          <Card
            i={2}
            className="border border-emerald/20 bg-gradient-to-b from-emerald/[0.10] to-emerald/[0.02] p-4 shadow-[0_16px_36px_-18px_rgba(11,154,99,0.22)] hover:shadow-[0_30px_54px_-22px_rgba(11,154,99,0.32)] sm:p-7"
          >
            <div className="flex h-full flex-col justify-between gap-5 sm:gap-6">
              <Disc icon={PackageCheck} tint={EMERALD} className="size-11 bg-emerald/15 sm:size-16" />
              <div>
                <p className="text-[0.95rem] font-semibold tracking-tight sm:text-xl">Genuine parts</p>
                <p className="mt-1.5 text-[0.8rem] leading-snug text-muted sm:mt-2 sm:text-[0.88rem]">
                  Only brand-approved, traceable components.
                </p>
              </div>
            </div>
          </Card>

          {/* ---------- D — rating ---------- */}
          <Card
            i={3}
            className="border border-amber/25 bg-gradient-to-b from-amber/[0.12] to-amber/[0.02] p-4 shadow-[0_16px_36px_-18px_rgba(217,130,27,0.22)] hover:shadow-[0_30px_54px_-22px_rgba(217,130,27,0.32)] sm:p-7"
          >
            <div className="flex h-full flex-col justify-between gap-5 sm:gap-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Disc icon={Star} tint={AMBER} className="size-11 bg-amber/18 sm:size-16 [&_svg]:fill-amber" />
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3 fill-amber text-amber sm:size-4" />
                  ))}
                </span>
              </div>
              <div>
                <p className="font-display text-[2rem] leading-none tracking-tight sm:text-4xl">4.9</p>
                <p className="mt-1.5 text-[0.8rem] leading-snug text-muted sm:mt-2 sm:text-[0.88rem]">Across 128k verified reviews</p>
              </div>
            </div>
          </Card>

          {/* ---------- E — 24×7 support (dark) ---------- */}
          <Card
            i={4}
            className="col-span-2 bg-[#0a1533] p-6 text-white shadow-[0_24px_50px_-22px_rgba(11,21,51,0.6)] sm:p-7"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -left-10 top-1/2 size-52 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
              style={{ background: "#2547d0" }}
            />
            <Link href="/book" className="relative flex h-full items-center gap-4 sm:gap-6">
              <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-transform duration-500 group-hover:scale-105 sm:size-16">
                <Headset className="size-6 sm:size-7" strokeWidth={1.7} />
                <span className="absolute -right-0.5 -top-0.5 flex size-3.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald/60" />
                  <span className="relative inline-flex size-3.5 rounded-full bg-emerald ring-2 ring-[#0a1533]" />
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-xl font-semibold tracking-tight sm:text-2xl">24 × 7 support</span>
                <span className="mt-1.5 block text-[0.88rem] leading-snug text-white/70">
                  Real humans — any appliance, any hour, any day of the year.
                </span>
              </span>
              <GoArrow tint={ROYAL} onDark />
            </Link>
          </Card>

          {/* ---------- F — same-day service ---------- */}
          <Card i={5} className={cn(SHELL, "col-span-2 p-6 sm:p-7")}>
            <Link href="/book" className="flex h-full items-center gap-4 sm:gap-6">
              <Disc icon={Clock} tint={AMBER} />
              <span className="min-w-0">
                <span className="block text-xl font-semibold tracking-tight sm:text-2xl">Same-day service</span>
                <span className="mt-1.5 block text-[0.88rem] leading-snug text-muted">
                  Book by 2 PM and a certified pro is at your door by evening.
                </span>
              </span>
              <GoArrow tint={AMBER} />
            </Link>
          </Card>

          {/* ---------- G — assurance strip ---------- */}
          <Card i={6} className={cn(SHELL, "col-span-2 !row-auto px-6 py-6 sm:px-8 lg:col-span-4")}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4 lg:divide-x lg:divide-hairline">
              {ASSURANCES.map((a) => (
                <div key={a.title} className="flex items-center gap-3 lg:justify-center lg:px-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-background sm:size-11">
                    <a.icon className="size-[1.1rem]" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 leading-none">
                    <span className="block text-[0.82rem] font-semibold tracking-tight">{a.title}</span>
                    <span className="mt-1.5 block text-[0.72rem] text-muted">{a.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
