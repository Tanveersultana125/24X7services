"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, BadgeCheck, ShieldCheck, Award, PackageCheck, Headset } from "lucide-react";
import { BrandMark } from "@/components/ui/Icons";
import { BRANDS } from "@/lib/data";
import type { BrandId } from "@/lib/types";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const NAVY = "#16295e";
const GOLD = "#c08a2e";

/** Shared by the headers that ask for a dark scrim and by every header in dark mode. */
const DARK_SCRIM =
  "linear-gradient(100deg, rgba(18,20,24,0.88) 0%, rgba(18,20,24,0.74) 34%, rgba(18,20,24,0.34) 60%, rgba(18,20,24,0.12) 100%)";
const DARK_VEIL = "rgba(18,20,24,0.66)";

const BRAND_ASSURANCES = [
  { icon: ShieldCheck, tint: NAVY, title: "Certified Experts", desc: "Trained & verified professionals" },
  { icon: PackageCheck, tint: GOLD, title: "Genuine Parts", desc: "100% original parts with warranty" },
  { icon: BadgeCheck, tint: NAVY, title: "Trusted Service", desc: "Transparent & reliable repairs" },
  { icon: Headset, tint: GOLD, title: "Dedicated Support", desc: "We're here when you need us" },
];

export function PageHeader({
  crumb,
  title,
  subtitle,
  stats,
  image,
  logos,
  collage,
  bgImage,
  bgDark,
}: {
  crumb: string;
  title: React.ReactNode;
  subtitle: string;
  stats?: { value: string; label: string }[];
  image?: string;
  logos?: boolean;
  collage?: string[];
  bgImage?: string;
  /** show the photo at full strength under a dark scrim, with white copy on top */
  bgDark?: boolean;
}) {
  const onDark = Boolean(bgImage && bgDark);

  return (
    <header
      className={
        "relative overflow-hidden border-b border-hairline pt-32 pb-14 sm:pt-40 sm:pb-20" +
        (image ? " lg:min-h-[34rem]" : bgImage ? " lg:min-h-[26rem] lg:pb-14" : "")
      }
    >
      {!bgImage && (
        <div className="pointer-events-none absolute -top-24 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-royal-bright/8 blur-[120px]" />
      )}

      {/* full-bleed background photo with a light scrim for readable text */}
      {bgImage && (
        <>
          <motion.img
            initial={{ scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.3, ease }}
            src={bgImage}
            alt=""
            aria-hidden
            /* A phone header is tall and narrow while these photographs are
               wide, so filling it meant showing a thin vertical slice of the
               scene. Below sm the picture keeps its own shape at the full
               width of the page — the whole scene, as on a laptop — and fades
               out at its foot rather than stopping on a line. */
            className={
              "absolute inset-x-0 top-0 h-auto w-full object-cover object-center " +
              "[-webkit-mask-image:linear-gradient(to_bottom,#000_68%,transparent_100%)] " +
              "[mask-image:linear-gradient(to_bottom,#000_68%,transparent_100%)] " +
              "sm:inset-0 sm:h-full sm:[-webkit-mask-image:none] sm:[mask-image:none]" +
              // on light headers the phone veil washes the photo out, so deepen
              // the image itself there rather than thinning the veil any further
              (onDark ? "" : " brightness-[0.84] lg:brightness-100")
            }
          />
          {/* Scrim on the copy side so the text stays readable. The copy takes
              its colour from the theme, so the scrim has to as well — a cream
              veil in both themes left near-white type on a near-white wash. */}
          <div
            aria-hidden
            className={"absolute inset-0" + (onDark ? "" : " dark:hidden")}
            style={{
              background: onDark
                ? DARK_SCRIM
                : "linear-gradient(100deg, rgba(245,243,238,0.95) 0%, rgba(245,243,238,0.82) 34%, rgba(245,243,238,0.35) 58%, rgba(245,243,238,0.05) 100%)",
            }}
          />
          {!onDark && (
            <div aria-hidden className="absolute inset-0 hidden dark:block" style={{ background: DARK_SCRIM }} />
          )}
          {/* the scrim above fades left-to-right, which leaves nothing to read against on a
              narrow screen — lay an even veil under the copy below lg */}
          <div
            aria-hidden
            className={"absolute inset-0 lg:hidden" + (onDark ? "" : " dark:hidden")}
            style={{ background: onDark ? DARK_VEIL : "rgba(245,243,238,0.54)" }}
          />
          {!onDark && (
            <div aria-hidden className="absolute inset-0 hidden dark:max-lg:block" style={{ background: DARK_VEIL }} />
          )}
        </>
      )}

      {/* full-bleed technician image (desktop) — sits on a soft blue wash so it blends */}
      {image && (
        <>
          {/* The wash is what a cut-out photo used to stand on. A photo that
              brings its own background covers it, and on a dark page it would
              only read as a pale slab — so light keeps it, dark doesn't. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden lg:block dark:lg:hidden"
            style={{ background: "linear-gradient(105deg, transparent 40%, rgba(226,234,251,0.55) 64%, #e3ebfc 100%)" }}
          />
          {/* Fills the right of the header rather than sitting on its floor:
              a scene photo is wider than it is tall, so anchoring it to the
              bottom left a band of empty header above it. */}
          <motion.img
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease }}
            src={image}
            alt="24X7 certified technician on the job"
            className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[52%] max-w-[46rem] object-cover object-left [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_24%)] [mask-image:linear-gradient(to_right,transparent_0%,#000_24%)] lg:block"
          />
        </>
      )}

      <div className="relative z-10 mx-auto max-w-[92rem] px-6 sm:px-10">
        {/* breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={"flex items-center gap-1.5 text-sm " + (onDark ? "text-white/60" : "text-muted")}
          aria-label="Breadcrumb"
        >
          <Link href="/" className={"transition-colors " + (onDark ? "hover:text-white" : "hover:text-ink")}>Home</Link>
          <ChevronRight className={"size-3.5 " + (onDark ? "text-white/40" : "text-muted-2")} />
          <span className={onDark ? "text-white" : "text-ink"}>{crumb}</span>
        </motion.nav>

        {/* The logo wall carries four tiles and needs the room to show them;
            0.7fr squeezed them into stamps beside an oversized column. */}
        <div
          className={
            image || bgImage
              ? "mt-10 max-w-2xl"
              : cn(
                  "mt-8 grid gap-12",
                  collage ? "lg:items-start" : "lg:items-center",
                  logos
                    ? "lg:grid-cols-[0.95fr_1.05fr]"
                    // The collage is a supporting picture, so the copy leads on
                    // the left and it follows on the right at a fixed, modest
                    // width — as a fraction it grew with the viewport until
                    // four photographs filled half the header.
                    : collage
                      ? "lg:grid-cols-[1fr_25rem]"
                      : "lg:grid-cols-[0.7fr_1.3fr]",
                )
          }
        >
          <div className={logos ? "lg:order-2" : undefined}>
            {logos && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-5 flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-amber"
              >
                <span aria-hidden className="h-px w-7 bg-amber/50" />
                <Award className="size-4" strokeWidth={2} />
                Brands we trust
                <span aria-hidden className="h-px w-7 bg-amber/50" />
              </motion.span>
            )}
            <h1 className={"font-display text-[2.5rem] leading-[1.04] tracking-[-0.03em] sm:text-[4.5rem]" + (onDark ? " text-white" : "")}>
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.1em]">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.9, ease }}
                >
                  {title}
                </motion.span>
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease }}
              /* Beside the collage the copy has the wider column, and holding
                 it to max-w-xl there would leave the slack sitting between the
                 two as a gap. */
              className={
                "mt-6 text-pretty text-lg leading-relaxed " +
                (collage ? "max-w-2xl " : "max-w-xl ") +
                (onDark ? "text-white/80" : "text-muted")
              }
            >
              {subtitle}
            </motion.p>

            {/* on brand pages the stats get their own panel with medal chips */}
            {logos && stats && (
              <motion.dl
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease }}
                className="mt-10 grid grid-cols-3 rounded-[1.5rem] border border-card-edge bg-card/70 px-3 py-5 shadow-premium-sm backdrop-blur sm:px-6 lg:divide-x lg:divide-hairline"
              >
                {stats.map((st, i) => (
                  <div key={st.label} className="px-1 text-center sm:px-4">
                    <span className="mx-auto grid size-10 place-items-center rounded-full bg-amber/12 text-amber sm:size-12">
                      {i === 0 ? (
                        <ShieldCheck className="size-5" strokeWidth={1.8} />
                      ) : i === 1 ? (
                        <Award className="size-5" strokeWidth={1.8} />
                      ) : (
                        <BadgeCheck className="size-5" strokeWidth={1.8} />
                      )}
                    </span>
                    <dt className="font-display mt-3 text-2xl tracking-tight sm:text-3xl">{st.value}</dt>
                    <dd className="mt-1.5 text-[0.68rem] leading-snug text-muted sm:text-xs">{st.label}</dd>
                  </div>
                ))}
              </motion.dl>
            )}

            {/* Beside the collage the figures span the copy column rather than
                clustering at its left. A paragraph held to a reading measure
                leaves the column's right half empty, and that emptiness sits
                exactly where the collage begins — which is the gap. Three even
                columns of figures occupy it. */}
            {collage && stats && (
              <motion.dl
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease }}
                className="mt-10 grid grid-cols-3 gap-6 border-t border-hairline pt-7"
              >
                {stats.map((st) => (
                  <div key={st.label}>
                    <dt className="font-display text-3xl tracking-tight sm:text-4xl">{st.value}</dt>
                    <dd className="mt-1.5 text-xs text-muted sm:text-sm">{st.label}</dd>
                  </div>
                ))}
              </motion.dl>
            )}

            {/* Everywhere else they stay a simple row under the copy. */}
            {!logos && !collage && (image || bgImage) && stats && (
              <motion.dl
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease }}
                className="mt-12 flex flex-wrap gap-x-12 gap-y-4"
              >
                {stats.map((st) => (
                  <div key={st.label}>
                    <dt className={"font-display text-3xl tracking-tight sm:text-4xl" + (onDark ? " text-white" : "")}>{st.value}</dt>
                    <dd className={"mt-1 text-xs " + (onDark ? "text-white/65" : "text-muted")}>{st.label}</dd>
                  </div>
                ))}
              </motion.dl>
            )}
          </div>

          {/* brand-logo cards */}
          {!image && !bgImage && logos && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:order-1">
              {BRANDS.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-card-edge bg-card shadow-[0_14px_30px_-16px_rgba(23,21,15,0.18),inset_0_1.5px_0_var(--card-edge)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_26px_46px_-20px_rgba(23,21,15,0.28)]"
                >
                  {/* Wordmark plate — white in both themes. A brand mark is
                      fixed artwork: Samsung's navy on a near-black card reads
                      as a different, muddier logo, which is not ours to do. */}
                  <div className="relative grid h-28 place-items-center bg-white sm:h-36">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.07]"
                      style={{ background: `radial-gradient(120% 90% at 70% 110%, ${b.accent}, transparent 62%)` }}
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-emerald ring-1 ring-inset ring-emerald/20 sm:text-[0.6rem]">
                      <BadgeCheck className="size-3" /> Authorised
                    </span>
                    <CardMark id={b.id} />
                  </div>

                  {/* brand-colour footer */}
                  {/* A flat slab of brand colour is loud on a dark page —
                      lit from above and deepened at the foot, it reads as part
                      of the card instead of a highlighter stripe. */}
                  <div
                    className="relative flex items-center gap-2.5 px-3 py-3.5 text-white sm:gap-3 sm:px-4 sm:py-4"
                    style={{
                      background: `linear-gradient(160deg, ${b.accent}, color-mix(in srgb, ${b.accent} 72%, #0b1020))`,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
                    }}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/20 ring-1 ring-inset ring-white/30 sm:size-9">
                      <ShieldCheck className="size-3.5 sm:size-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1 leading-none">
                      <span className="block text-[0.78rem] font-semibold tracking-tight sm:text-[0.9rem]">{b.name}</span>
                      <span className="mt-1 block text-[0.6rem] leading-snug text-white/80 sm:text-[0.68rem]">
                        Genuine parts &amp; certified service
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 transition-transform duration-500 group-hover:translate-x-0.5" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Photo collage — four tiles on one grid, same shape and same gap.
              Staggered columns of two different ratios read as four pictures
              that didn't line up rather than as a composition. */}
          {!image && !bgImage && collage && collage.length >= 4 && (
            <div className="grid grid-cols-2 gap-2.5 lg:order-2">
              {collage.slice(0, 4).map((src, i) => (
                <CollageShot key={src + i} src={src} delay={0.25 + i * 0.07} />
              ))}
            </div>
          )}

          {!image && !bgImage && !logos && !collage && stats && (
            <motion.dl
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease }}
              className="grid grid-cols-2 gap-x-4 gap-y-6 min-[420px]:grid-cols-3 sm:gap-6 lg:justify-items-end"
            >
              {stats.map((s) => (
                <div key={s.label} className="lg:text-right">
                  <dt className="font-display text-3xl tracking-tight sm:text-4xl">{s.value}</dt>
                  <dd className="mt-1 text-xs text-muted">{s.label}</dd>
                </div>
              ))}
            </motion.dl>
          )}
        </div>

        {/* brand assurances close the header */}
        {logos && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease }}
            className="mt-10 grid grid-cols-2 gap-5 rounded-[1.5rem] border border-card-edge bg-card/70 px-5 py-6 shadow-premium-sm backdrop-blur sm:px-7 lg:grid-cols-4 lg:divide-x lg:divide-hairline"
          >
            {BRAND_ASSURANCES.map((a) => (
              <div key={a.title} className="flex items-center gap-3 lg:justify-center lg:px-4">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full text-white sm:size-11"
                  style={{ background: a.tint }}
                >
                  <a.icon className="size-[1.05rem]" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 leading-none">
                  <span className="block text-[0.82rem] font-semibold tracking-tight">{a.title}</span>
                  <span className="mt-1.5 block text-[0.7rem] leading-snug text-muted">{a.desc}</span>
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* stacked image on mobile */}
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            aria-hidden
            className="mt-10 w-full rounded-2xl [-webkit-mask-image:linear-gradient(to_right,transparent,#000_18%)] [mask-image:linear-gradient(to_right,transparent,#000_18%)] lg:hidden"
          />
        )}
      </div>
    </header>
  );
}

/** LG's identity is the face mark plus the wordmark — render both on the brand card. */
function CardMark({ id }: { id: BrandId }) {
  if (id === "lg") {
    return (
      <span className="relative flex items-center gap-2">
        <BrandMark id="lg" tone="brand" className="text-xl sm:text-2xl" />
        <span className="text-xl font-extrabold tracking-tight text-muted sm:text-2xl">LG</span>
      </span>
    );
  }
  return <BrandMark id={id} tone="brand" className="relative text-lg sm:text-2xl" />;
}

function CollageShot({ src, delay }: { src: string; delay: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
      /* A hairline rather than a card edge, and no drop shadow: on a dark
         header a shadow does nothing but blur the corner. */
      className="aspect-[4/5] overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="24X7 technician on the job" className="h-full w-full object-cover" />
    </motion.figure>
  );
}
