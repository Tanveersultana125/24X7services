"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Package, ClipboardCheck, Sparkles, Receipt, Timer, Clock,
  Headset, ThumbsUp, ChevronRight, Tag,
} from "lucide-react";
import { ApplianceTile, APPLIANCE_ACCENT, BrandMark, problemIcon } from "@/components/ui/Icons";
import { useServices } from "@/components/providers/ServicesProvider";
import { bestSaving, brandsFor, priceFor, pricesDiffer } from "@/lib/catalogue-shared";
import { ServiceSheet } from "./ServiceSheet";
import { AddToCart } from "./AddToCart";
import { useBrands } from "@/components/providers/BrandsProvider";
import { formatINR, formatRange } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useSiteImage } from "@/components/providers/SiteImagesProvider";

const ROYAL = "#2547d0";
const EMERALD = "#0b9a63";
const AMBER = "#d9821b";
const VIOLET = "#6d5ae0";

const INCLUDES = [
  { icon: ClipboardCheck, tint: ROYAL, title: "Free diagnosis", desc: "A full inspection and honest assessment before any charge." },
  { icon: Package, tint: EMERALD, title: "Genuine parts", desc: "Only brand-approved, traceable spares — never local substitutes." },
  { icon: ShieldCheck, tint: ROYAL, title: "90-day warranty", desc: "Every repair and part covered in writing for 90 days." },
  { icon: Sparkles, tint: AMBER, title: "Clean finish", desc: "The technician tidies up and tests the appliance with you." },
  { icon: Receipt, tint: ROYAL, title: "Digital invoice", desc: "A transparent, itemised GST invoice sent instantly." },
  { icon: Timer, tint: EMERALD, title: "On-time promise", desc: "Live ETA tracking and a slot you actually choose." },
];

/** A shot of the actual unit, shown beside the appliance name. */
const APPLIANCE_UNIT: Record<string, { src: string; fit: "cover" | "contain"; pos?: string }> = {
  refrigerator: { src: "/work/unit-refrigerator.png", fit: "contain" },
  "washing-machine": { src: "/work/unit-washing-machine.png", fit: "cover", pos: "center 40%" },
  microwave: { src: "/work/unit-oven.png", fit: "cover", pos: "38% center" },
  ac: { src: "/work/unit-ac.png", fit: "cover" },
};

const PRICING_PROOF = [
  { icon: ShieldCheck, tint: ROYAL, title: "Certified Professionals", desc: "Skilled & verified experts" },
  { icon: Tag, tint: VIOLET, title: "Transparent Pricing", desc: "No hidden charges, ever" },
];

const PRICING_ASSURANCES = [
  { icon: ShieldCheck, tint: ROYAL, title: "90-Day Warranty", desc: "On all repairs & parts" },
  { icon: Tag, tint: EMERALD, title: "Upfront Pricing", desc: "You approve before we start" },
  { icon: Headset, tint: AMBER, title: "Quick Support", desc: "We're here when you need us" },
  { icon: ThumbsUp, tint: ROYAL, title: "Satisfaction Guaranteed", desc: "Quality service, always" },
];

/**
 * What every visit includes, and the promise behind it.
 *
 * Its own export, and the price list below is another: the services page puts
 * the price list first, before the eight-service index, and these two can no
 * longer be one block if only one of them is to move.
 */
export function ServicesPromise() {
  const promiseShieldSrc = useSiteImage("promise-shield");

  return (
    <>
      {/* What's included */}
      <section className="relative overflow-hidden py-14 sm:py-20">
        {/* soft field behind the intro, echoing the promise mark on the right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-24 hidden size-[34rem] rounded-full opacity-70 blur-3xl lg:block"
          style={{ background: "radial-gradient(circle, rgba(37,71,208,0.14), transparent 65%)" }}
        />

        <div className="relative mx-auto max-w-[92rem] px-6 sm:px-10">
          {/* Two columns rather than two blocks pushed to opposite ends: a
              reading measure inside a 92rem row left the copy and the artwork
              stranded either side of half a screen of nothing. The columns
              share the row out, so the gap is the gutter and no more. */}
          <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-center lg:gap-12 xl:grid-cols-[1fr_30rem]">
            <div>
              <span className="inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-royal-bright">
                Our promise
                <ShieldCheck className="size-4" strokeWidth={2.2} />
              </span>

              {/* The copy column grows with the viewport, so the heading grows
                  with it — held at 3rem it stopped filling its own column. */}
              <h2 className="font-display mt-4 text-[2.4rem] leading-[1.15] sm:leading-[1.05] tracking-[-0.03em] sm:text-5xl 2xl:text-[3.4rem]">
                What&apos;s included in <span className="italic text-royal-bright">every</span> service.
              </h2>

              <span aria-hidden className="mt-5 block h-1 w-14 rounded-full bg-royal-bright" />

              <p className="mt-5 max-w-xl text-pretty leading-relaxed text-muted">
                We believe in complete transparency and providing the best experience at every step.
              </p>
            </div>

            {/* No border, no rounded box, no drop shadow — a frame turns the
                artwork into a card laid on the page. The illustration now
                ships cut off its ground, so it stands on the section itself,
                over nothing but a soft wash of the brand blue. */}
            {promiseShieldSrc && (
              <div aria-hidden className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
                <span
                  className="pointer-events-none absolute -inset-10 -z-10 rounded-full blur-3xl"
                  style={{ background: "radial-gradient(circle, rgba(37,71,208,0.13), transparent 68%)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={promiseShieldSrc} alt="" className="w-full" />
              </div>
            )}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-2.5 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {INCLUDES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                style={{ "--tint": f.tint } as React.CSSProperties}
                /* Six solid blue slabs, two rows deep, read as a wall of colour
                   with the writing pushed out from under it. The card is one
                   surface now — the lit card the rest of the site uses — and
                   the colour arrives as the icon's own tint and a wash in the
                   corner it comes from.
                   A column, so the rule can be pushed to the floor: the blurbs
                   run to different lengths, and a rule that simply followed the
                   last line sat at a different height in all six. */
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.1rem] border border-card-edge bg-gradient-to-b from-card to-surface p-4 shadow-[0_16px_36px_-18px_rgba(23,21,15,0.16),inset_0_1.5px_0_var(--card-edge)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_32px_56px_-22px_rgba(23,21,15,0.26)] dark:border-white/[0.12] dark:shadow-[0_26px_60px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:border-white/[0.2] sm:rounded-[1.5rem] sm:p-7"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-[0.14] blur-2xl transition-opacity duration-500 group-hover:opacity-25 dark:opacity-25 dark:group-hover:opacity-40"
                  style={{ background: "var(--tint)" }}
                />

                {/* A tint at 10% is a colour on paper and a smudge on black. */}
                <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--tint)_12%,transparent)] text-[var(--tint)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--tint)_22%,transparent)] transition-transform duration-500 group-hover:scale-105 dark:bg-[color-mix(in_srgb,var(--tint)_24%,transparent)] dark:text-[color-mix(in_srgb,var(--tint)_55%,white)] dark:ring-white/10 sm:size-12 sm:rounded-2xl">
                  <f.icon className="size-[1.05rem] sm:size-6" strokeWidth={1.7} />
                </span>

                <h3 className="relative mt-3 mb-3 hyphens-auto text-[0.7rem] font-semibold leading-tight tracking-tight sm:mt-5 sm:mb-0 sm:text-[1.05rem]">
                  {f.title}
                </h3>
                {/* no room for the blurb in a three-up column — it returns at sm */}
                <p className="relative hidden text-muted sm:mt-2 sm:mb-5 sm:block sm:text-[0.88rem] sm:leading-relaxed">
                  {f.desc}
                </p>

                {/* mt-auto, and the gap above it is the margin below — so the
                    six rules sit on one line across the row. */}
                <span
                  aria-hidden
                  className="relative mt-auto block h-0.5 w-5 shrink-0 rounded-full transition-all duration-500 group-hover:w-14 sm:w-8"
                  style={{ background: "var(--tint)" }}
                />
              </motion.div>
            ))}
          </div>

        </div>
      </section>
    </>
  );
}

/** What each fault costs, per appliance and per make. */
export function ServicesPricing() {
  const brands = useBrands();
  const applianceLineupSrc = useSiteImage("appliance-lineup");
  const services = useServices();
  const [active, setActive] = useState<string>("refrigerator");
  const [sheet, setSheet] = useState<string | null>(null);
  // The chosen tab can be hidden from the panel while someone is on the page.
  const appliance = services.find((a) => a.id === active) ?? services[0];

  return (
    <>
      {/* Problems & pricing */}
      <section className="bg-surface py-14 sm:py-20">
        <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
          {/* ---------- intro panel ---------- */}
          <div className="relative overflow-hidden rounded-[1.75rem] border border-card-edge bg-gradient-to-br from-card to-royal-bright/10 px-6 py-8 shadow-premium-md sm:rounded-[2rem] sm:px-10 sm:py-10">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(37,71,208,0.14), transparent 64%)" }}
            />

            <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.95fr_0.72fr] lg:items-center lg:gap-8">
              <div>
                <span className="inline-flex items-center gap-2.5 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-royal-bright">
                  <span aria-hidden className="h-0.5 w-6 rounded-full bg-royal-bright" />
                  Transparent pricing
                </span>

                <h2 className="font-display mt-4 text-[2.2rem] leading-[1.15] sm:leading-[1.05] tracking-[-0.03em] sm:text-[3.2rem]">
                  Faults we fix —
                  <br />
                  and what they <span className="italic text-royal-bright">cost.</span>
                </h2>

                <span aria-hidden className="mt-5 block h-1 w-14 rounded-full bg-royal-bright" />

                <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted">
                  Real price bands for real problems. You&apos;ll always see an exact estimate
                  before you confirm.
                </p>

                <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-5">
                  {PRICING_PROOF.map((p, i) => (
                    <div key={p.title} className="flex items-center gap-2.5 sm:gap-3">
                      {i > 0 && <span aria-hidden className="mr-5 hidden h-10 w-px bg-hairline sm:block" />}
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-lg sm:size-11 sm:rounded-xl"
                        style={{ background: `${p.tint}16`, color: p.tint }}
                      >
                        <p.icon className="size-[1.05rem] sm:size-5" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 leading-none">
                        <span className="block text-[0.76rem] font-semibold leading-tight tracking-tight sm:text-[0.88rem]">
                          {p.title}
                        </span>
                        <span className="mt-1.5 block text-[0.66rem] leading-snug text-muted sm:text-[0.76rem]">
                          {p.desc}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* the range we service, on its plinth */}
              {applianceLineupSrc && (
                <div aria-hidden className="relative mx-auto w-full max-w-sm lg:max-w-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={applianceLineupSrc} alt="" className="w-full" />
                </div>
              )}

              {/* promise note */}
              <div className="relative">
                <div className="relative z-10 overflow-hidden rounded-[1.5rem] border border-card-edge bg-card p-6 shadow-premium-md">
                  <span className="grid size-11 place-items-center rounded-xl bg-royal-bright/10 text-royal-bright">
                    <Receipt className="size-5" strokeWidth={1.8} />
                  </span>
                  <p className="mt-4 text-[1.05rem] font-semibold leading-snug tracking-tight">
                    Real price bands for real problems.
                  </p>
                  <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
                    You&apos;ll always see an exact estimate before you confirm.
                  </p>
                  <svg
                    aria-hidden
                    viewBox="0 0 300 60"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full text-royal-bright/10"
                  >
                    <path d="M0 34c48-26 96 22 150 6s102-30 150-4v24H0z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- appliance tabs ---------- */}
          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
            {services.map((a) => (
              <button
                key={a.id}
                onClick={() => setActive(a.id)}
                style={
                  active === a.id
                    ? {
                        background: APPLIANCE_ACCENT[a.id],
                        boxShadow: `0 14px 30px -12px ${APPLIANCE_ACCENT[a.id]}99`,
                      }
                    : undefined
                }
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-[0.78rem] font-medium transition-all sm:gap-2.5 sm:px-4 sm:py-2.5 sm:text-sm",
                  active === a.id
                    ? "border-transparent text-white"
                    : "border-card-edge bg-card text-ink shadow-premium-sm hover:-translate-y-0.5"
                )}
              >
                <ApplianceTile
                  id={a.id}
                  size="sm"
                  onAccent={active === a.id}
                  className="size-9 shrink-0 rounded-xl sm:size-11 sm:rounded-2xl"
                />
                <span className="truncate">{a.name}</span>
              </button>
            ))}
          </div>

          {/* ---------- price list ---------- */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="mt-4 overflow-hidden rounded-[1.75rem] border border-card-edge bg-card shadow-premium-md"
            >
              <div className="relative flex min-h-[8.5rem] flex-col items-start gap-3 overflow-hidden border-b border-hairline p-5 sm:min-h-[9.5rem] sm:flex-row sm:items-center sm:gap-4 sm:p-6">
                <ApplianceTile id={appliance.id} size="lg" className="size-11 shrink-0 sm:size-16" />
                {/* reserve the strip the photo occupies so the copy wraps instead of clipping */}
                <div className="relative w-full min-w-0 pr-[40%] sm:w-auto sm:flex-1 sm:pr-0">
                  <h3 className="font-display text-pretty text-[1.15rem] leading-tight tracking-tight sm:text-2xl">
                    {appliance.name}
                  </h3>
                  <p className="mt-1.5 text-pretty text-[0.75rem] leading-snug text-muted sm:mt-0 sm:text-sm">
                    {appliance.blurb}
                  </p>
                  {/* The list below is faults and prices. Everything else this
                      service is — what two units cost, what the visit covers —
                      is a tap away rather than crammed into the card. */}
                  <button
                    onClick={() => setSheet(appliance.id)}
                    className="mt-2 inline-flex items-center gap-1 text-[0.78rem] font-semibold text-royal-bright hover:underline sm:text-sm"
                  >
                    View details
                    {bestSaving(appliance.tiers) > 0 && (
                      <span className="ml-1 rounded-full bg-emerald/12 px-1.5 py-0.5 text-[0.6rem] font-bold text-emerald">
                        SAVE {bestSaving(appliance.tiers)}%
                      </span>
                    )}
                  </button>
                </div>
                {/* the unit itself, bleeding in from the right of the header band */}
                {APPLIANCE_UNIT[appliance.id] && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 w-[42%] sm:w-1/2 lg:w-2/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={APPLIANCE_UNIT[appliance.id].src}
                      alt=""
                      className={cn(
                        "size-full object-contain object-right",
                        APPLIANCE_UNIT[appliance.id].fit === "contain" ? "p-3" : ""
                      )}
                    />
                    <span
                      className="absolute inset-0"
                      /* Fades the unit photo into the card it sits on — so it
                         has to fade to the card's colour, not to white, or the
                         scrim paints a bright wash across a dark card. */
                      style={{
                        background:
                          "linear-gradient(90deg, var(--card) 0%, color-mix(in srgb, var(--card) 88%, transparent) 22%, color-mix(in srgb, var(--card) 25%, transparent) 52%, transparent 78%)",
                      }}
                    />
                  </span>
                )}
              </div>

              {/* Who we are authorised for on this appliance — the question a
                  customer asks before the price, not after. */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-hairline px-5 py-3 sm:px-6">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Authorised for
                </span>
                {brands.filter((b) => brandsFor(appliance).includes(b.id)).map((b) => (
                  <span key={b.id} className="flex items-center gap-1.5">
                    {/* Sized to the wordmark, not to a fixed box: SAMSUNG and
                        BOSCH carry wide letter-spacing and were being clipped
                        by a width picked for the shortest of them. */}
                    <span className="inline-flex h-6 items-center rounded-md bg-white px-2 ring-1 ring-black/5">
                      <BrandMark
                        id={b.id}
                        name={b.name}
                        accent={b.accent}
                        tone="brand"
                        className={b.id === "lg" ? "text-base" : "text-[0.55rem]"}
                      />
                    </span>
                    {/* Only worth printing when the makes don't all start at
                        the same number — otherwise it's the same figure four
                        times over. */}
                    {pricesDiffer(appliance) && (
                      <span className="text-[0.7rem] font-medium text-muted">
                        from {formatINR(priceFor(appliance, b.id))}
                      </span>
                    )}
                  </span>
                ))}
              </div>

              <ul className="divide-y divide-hairline">
                {appliance.problems.map((p) => (
                  // The row books the job; the button beside it drops the job in
                  // the basket instead. A button nested inside the row's link
                  // would be invalid markup, so they are siblings and the row
                  // carries the hover.
                  <li
                    key={p.id}
                    className="flex items-center gap-2 pr-4 transition-colors hover:bg-surface-2/40 sm:gap-3 sm:pr-6"
                  >
                    <Link
                      href={`/book?appliance=${appliance.id}&problem=${p.id}`}
                      className="group flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 sm:gap-4 sm:py-4 sm:pl-6"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-royal-bright/10 text-royal-bright sm:size-9">
                        {(() => {
                          const Glyph = problemIcon(p.id);
                          return <Glyph className="size-4" strokeWidth={1.9} />;
                        })()}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[0.88rem] font-medium leading-snug sm:text-base">
                            {p.label}
                          </span>
                          {p.common && (
                            <span className="rounded-full bg-royal-bright/12 px-2 py-0.5 text-[9px] font-bold tracking-wider text-royal-bright sm:text-[10px]">
                              POPULAR
                            </span>
                          )}
                        </span>
                        {/* the eta column is desktop-only, so carry it under the label here */}
                        <span className="mt-1 flex items-center gap-1.5 text-[0.7rem] text-muted sm:hidden">
                          <Clock className="size-3 text-royal-bright" /> {p.eta}
                        </span>
                      </span>

                      <span className="hidden items-center gap-1.5 text-sm text-muted sm:flex">
                        <Clock className="size-3.5 text-royal-bright" /> {p.eta}
                      </span>

                      <span className="shrink-0 whitespace-nowrap text-right text-[0.82rem] font-bold tracking-tight sm:w-40 sm:text-base">
                        {formatRange(p.price[0], p.price[1])}
                      </span>

                      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted transition-all group-hover:border-royal-bright group-hover:bg-royal-bright group-hover:text-white sm:size-8">
                        <ChevronRight className="size-4" />
                      </span>
                    </Link>

                    <AddToCart
                      variant="icon"
                      item={{
                        id: appliance.id,
                        name: appliance.name,
                        qty: 1,
                        // The row shows a band; the basket has to carry one
                        // figure, so it carries the one the band starts at.
                        price: p.price[0],
                        problem: p.id,
                        problemLabel: p.label,
                      }}
                    />
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          {/* ---------- pricing assurances ---------- */}
          <div className="mt-4 grid grid-cols-1 gap-6 rounded-[1.75rem] border border-card-edge bg-card px-5 py-6 shadow-premium-sm sm:grid-cols-2 sm:px-7 lg:grid-cols-4 lg:divide-x lg:divide-hairline">
            {PRICING_ASSURANCES.map((a) => (
              <div key={a.title} className="flex items-center gap-3.5 lg:justify-center lg:px-4">
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-full"
                  style={{ background: `${a.tint}16`, color: a.tint }}
                >
                  <a.icon className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 leading-none">
                  <span className="block text-[0.88rem] font-semibold tracking-tight">{a.title}</span>
                  <span className="mt-1.5 block text-[0.75rem] leading-snug text-muted">{a.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ServiceSheet
        service={services.find((a) => a.id === sheet) ?? null}
        photo={APPLIANCE_UNIT[sheet ?? ""]?.src}
        onClose={() => setSheet(null)}
      />
    </>
  );
}
