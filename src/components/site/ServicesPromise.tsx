"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Package, ClipboardCheck, Sparkles, Receipt, Timer } from "lucide-react";
import { useSiteImage } from "@/components/providers/SiteImagesProvider";

const ROYAL = "#2547d0";
const EMERALD = "#0b9a63";
const AMBER = "#d9821b";

const INCLUDES = [
  { icon: ClipboardCheck, tint: ROYAL, title: "Free diagnosis", desc: "A full inspection and honest assessment before any charge." },
  { icon: Package, tint: EMERALD, title: "Genuine parts", desc: "Only brand-approved, traceable spares — never local substitutes." },
  { icon: ShieldCheck, tint: ROYAL, title: "90-day warranty", desc: "Every repair and part covered in writing for 90 days." },
  { icon: Sparkles, tint: AMBER, title: "Clean finish", desc: "The technician tidies up and tests the appliance with you." },
  { icon: Receipt, tint: ROYAL, title: "Digital invoice", desc: "A transparent, itemised GST invoice sent instantly." },
  { icon: Timer, tint: EMERALD, title: "On-time promise", desc: "Live ETA tracking and a slot you actually choose." },
];

/**
 * What every visit includes, and the promise behind it.
 *
 * It used to share a file with the price list, which is why that file was
 * called ServicesDetail. The catalogue took the price list over, so this is
 * all that is left and the file is named after it.
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
