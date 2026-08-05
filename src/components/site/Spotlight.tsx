"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

type Spot = { title: string; sub: string; img: string; href: string; cta: string; tint: string };

const SPOTS: Spot[] = [
  { title: "Foam-jet AC deep clean", sub: "Cooling like new — from ₹599", img: "/work/ac-service.png", href: "/book", cta: "Book now", tint: "#16306e" },
  { title: "Annual Care Plan", sub: "2 free visits + 10% off every repair", img: "/work/gallery/fridge-1.png", href: "/plans", cta: "Explore plans", tint: "#0b4d33" },
  { title: "24×7 emergency repair", sub: "A tracked technician in under 90 min", img: "/work/gallery/washing-1.png", href: "/book?emergency=1", cta: "Book now", tint: "#7a1620" },
  { title: "Microwave & oven care", sub: "Heating restored, same visit — from ₹199", img: "/work/microwave.png", href: "/book?appliance=microwave", cta: "Book now", tint: "#6b3a12" },
];

export function Spotlight() {
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = () => {
    const el = scroller.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const slide = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-spot]");
    // the gap is padding inside the sizer, so its own width is one step
    const step = card ? card.offsetWidth : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="relative scroll-mt-28 pb-10 pt-2 sm:pb-14 sm:pt-4">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <Kicker>In the spotlight</Kicker>
        <h2 className="font-display mt-6 max-w-xl text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
          Handpicked for you.
        </h2>

        <div className="relative mt-12">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => slide(-1)}
            disabled={atStart}
            className={cn(
              "absolute left-0 top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:grid",
              atStart && "pointer-events-none opacity-30"
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => slide(1)}
            disabled={atEnd}
            className={cn(
              "absolute right-0 top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:grid",
              atEnd && "pointer-events-none opacity-30"
            )}
          >
            <ChevronRight className="size-4" />
          </button>

          {/* No arrows on a phone, so the strip keeps the full width and the
              card isn't squeezed into a lane between two empty gutters. */}
          <div className="overflow-hidden sm:mx-12">
          <div
            ref={scroller}
            onScroll={update}
            data-lenis-prevent
            /* -mr-0.5 keeps the next banner's rounding sliver outside the clip
               box, so no hairline shows next to the arrow */
            className="-mr-0.5 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {SPOTS.map((s) => (
              /* sizer carries the gap as padding, so plain fractions give
                 exactly 1 / 2 whole banners per row */
              <div key={s.title} data-spot className="w-full shrink-0 snap-start pr-5 sm:w-1/2">
              <Link
                href={s.href}
                className="group relative block h-60 w-full overflow-hidden rounded-[1.5rem] sm:h-72"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.img}
                  alt={s.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(95deg, ${s.tint}f2 0%, ${s.tint}cc 38%, ${s.tint}33 68%, transparent 100%)` }}
                />
                <div className="relative flex h-full flex-col justify-between p-7 text-white sm:p-8">
                  <div>
                    <h3 className="font-display text-2xl leading-tight tracking-[-0.01em] sm:text-3xl">{s.title}</h3>
                    <p className="mt-2 max-w-[16rem] text-sm text-white/85">{s.sub}</p>
                  </div>
                  <span className="inline-flex w-max items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-transform group-hover:scale-[1.03]">
                    {s.cta}
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
