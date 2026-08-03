"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, BadgeCheck, ShieldCheck, Award, PackageCheck, Headset } from "lucide-react";
import { BrandMark } from "@/components/ui/Icons";
import { BRANDS } from "@/lib/data";
import type { BrandId } from "@/lib/types";

const ease = [0.16, 1, 0.3, 1] as const;

const NAVY = "#16295e";
const GOLD = "#c08a2e";

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
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* scrim on the copy side so the text stays readable */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: onDark
                ? "linear-gradient(100deg, rgba(18,20,24,0.88) 0%, rgba(18,20,24,0.74) 34%, rgba(18,20,24,0.34) 60%, rgba(18,20,24,0.12) 100%)"
                : "linear-gradient(100deg, rgba(245,243,238,0.95) 0%, rgba(245,243,238,0.82) 34%, rgba(245,243,238,0.35) 58%, rgba(245,243,238,0.05) 100%)",
            }}
          />
          {/* the scrim above fades left-to-right, which leaves nothing to read against on a
              narrow screen — lay an even veil under the copy below lg */}
          <div
            aria-hidden
            className="absolute inset-0 lg:hidden"
            style={{ background: onDark ? "rgba(18,20,24,0.6)" : "rgba(245,243,238,0.74)" }}
          />
        </>
      )}

      {/* full-bleed technician image (desktop) — sits on a soft blue wash so it blends */}
      {image && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{ background: "linear-gradient(105deg, transparent 40%, rgba(226,234,251,0.55) 64%, #e3ebfc 100%)" }}
          />
          <motion.img
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease }}
            src={image}
            alt="24X7 certified technician on the job"
            className="pointer-events-none absolute bottom-0 right-0 hidden w-[46%] max-w-[40rem] object-contain object-bottom [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_38%)] [mask-image:linear-gradient(to_right,transparent_0%,#000_38%)] lg:block"
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

        <div className={image || bgImage ? "mt-10 max-w-2xl" : "mt-8 grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-center"}>
          <div className={logos || collage ? "lg:order-2" : undefined}>
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
              className={"mt-6 max-w-xl text-pretty text-lg leading-relaxed " + (onDark ? "text-white/80" : "text-muted")}
            >
              {subtitle}
            </motion.p>

            {/* on brand pages the stats get their own panel with medal chips */}
            {logos && stats && (
              <motion.dl
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease }}
                className="mt-10 grid grid-cols-3 rounded-[1.5rem] border border-white/70 bg-white/70 px-3 py-5 shadow-premium-sm backdrop-blur sm:px-6 lg:divide-x lg:divide-hairline"
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

            {/* everywhere else they stay a simple row under the copy */}
            {!logos && (image || collage || bgImage) && stats && (
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
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_14px_30px_-16px_rgba(23,21,15,0.18),inset_0_1.5px_0_rgba(255,255,255,0.9)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_26px_46px_-20px_rgba(23,21,15,0.28)]"
                >
                  {/* wordmark plate */}
                  <div className="relative grid h-24 place-items-center sm:h-32">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.07]"
                      style={{ background: `radial-gradient(120% 90% at 70% 110%, ${b.accent}, transparent 62%)` }}
                    />
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-emerald/12 px-2 py-0.5 text-[0.55rem] font-semibold text-emerald sm:left-3 sm:top-3 sm:text-[0.58rem]">
                      <BadgeCheck className="size-3" /> Authorised
                    </span>
                    <CardMark id={b.id} />
                  </div>

                  {/* brand-colour footer */}
                  <div
                    className="flex items-center gap-2.5 px-3 py-3 text-white sm:gap-3 sm:px-4"
                    style={{ background: b.accent }}
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

          {/* photo collage */}
          {!image && !bgImage && collage && collage.length >= 4 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:order-1">
              <div className="flex flex-col gap-3 sm:gap-4">
                <CollageShot src={collage[0]} ratio="aspect-square" delay={0.25} />
                <CollageShot src={collage[1]} ratio="aspect-[4/5]" delay={0.4} />
              </div>
              <div className="flex flex-col gap-3 pt-8 sm:gap-4">
                <CollageShot src={collage[2]} ratio="aspect-[4/5]" delay={0.3} />
                <CollageShot src={collage[3]} ratio="aspect-square" delay={0.45} />
              </div>
            </div>
          )}

          {!image && !bgImage && !logos && !collage && stats && (
            <motion.dl
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease }}
              className="grid grid-cols-3 gap-x-4 gap-y-6 sm:gap-6 lg:justify-items-end"
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
            className="mt-10 grid grid-cols-2 gap-5 rounded-[1.5rem] border border-white/70 bg-white/70 px-5 py-6 shadow-premium-sm backdrop-blur sm:px-7 lg:grid-cols-4 lg:divide-x lg:divide-hairline"
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

function CollageShot({ src, ratio, delay }: { src: string; ratio: string; delay: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
      className={`overflow-hidden rounded-2xl border border-white/70 shadow-premium-md ${ratio}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="24X7 technician on the job" className="h-full w-full object-cover" />
    </motion.figure>
  );
}
