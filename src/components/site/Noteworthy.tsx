"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Kicker } from "./TextReveal";
import { useSiteImages } from "@/components/providers/SiteImagesProvider";
import type { SectionOverrides } from "@/lib/section-overrides-shared";
import { clean } from "@/lib/section-overrides-apply";
import { cn } from "@/lib/utils";

type Item = { title: string; img: string; slot: string; href: string; badge?: string; eta?: string };

const ITEMS: Item[] = [
  { title: "Foam-jet AC service", img: "/work/ac-service.png", slot: "noteworthy-ac-service", href: "/book", badge: "New" },
  { title: "Front-load washer care", img: "/work/gallery/washing-1.png", slot: "noteworthy-washer", href: "/book?appliance=washing-machine", eta: "In 60 mins" },
  { title: "Smart fridge diagnosis", img: "/work/gallery/fridge-1.png", slot: "noteworthy-fridge", href: "/book?appliance=refrigerator" },
  { title: "Microwave express fix", img: "/work/microwave.png", slot: "noteworthy-microwave", href: "/book?appliance=microwave", eta: "In 44 mins" },
  { title: "AC installation", img: "/work/ac.png", slot: "noteworthy-installation", href: "/book", badge: "New" },
  { title: "Refrigerator gas top-up", img: "/work/gallery/fridge-2.png", slot: "noteworthy-gas", href: "/book?appliance=refrigerator" },
];

export function Noteworthy({
  overrides = {},
}: {
  overrides?: SectionOverrides;
}) {
  const images = useSiteImages();
  const items: Item[] = [
    ...ITEMS.filter((i) => !overrides[i.slot]?.hidden).map((i) => {
      const o = clean(overrides[i.slot]);
      // the card calls it eta; the panel calls it meta, since most-booked uses
      // the same field for "1.2M+ booked"
      const meta = typeof o.meta === "string" ? o.meta : undefined;
      return { ...i, ...o, eta: meta ?? i.eta } as Item;
    }),
  ];
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
    const card = el.querySelector<HTMLElement>("[data-item]");
    // the gap is padding inside the card, so its own width is one step
    const step = card ? card.offsetWidth * 2 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="relative scroll-mt-28 pb-10 pt-2 sm:pb-14 sm:pt-4">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <Kicker>New &amp; noteworthy</Kicker>
        <h2 className="font-display mt-6 max-w-xl text-[2.6rem] leading-[1.15] sm:leading-[1.05] tracking-[-0.03em] sm:text-6xl">
          Fresh on the menu.
        </h2>

        <div className="relative mt-12">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => slide(-1)}
            disabled={atStart}
            className={cn(
              "absolute left-0 top-[38%] z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:size-10",
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
              "absolute right-0 top-[38%] z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:size-10",
              atEnd && "pointer-events-none opacity-30"
            )}
          >
            <ChevronRight className="size-4" />
          </button>

          {/* The margins are the arrows' lane at every size — they sit beside
              the card, never over the artwork, and clip the neighbours. */}
          <div className="mx-9 overflow-hidden sm:mx-12">
          <div
            ref={scroller}
            onScroll={update}
            data-lenis-prevent
            /* The strip runs wider than the box that clips it, so the next
               card's edge falls outside instead of drawing a hairline in the
               arrow's gutter. */
            className="-mr-3 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((it) => (
              <Link
                key={it.title}
                href={it.href}
                data-item
                /* gap as padding inside the card, so plain fractions give
                   exactly 1 / 2 / 4 whole cards per row */
                className="group w-full shrink-0 snap-start pr-5 sm:w-1/2 lg:w-1/4"
              >
                <div className="relative overflow-hidden rounded-2xl bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[it.slot] ?? it.img}
                    alt={it.title}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {it.badge && (
                    <span className="absolute left-3 top-3 rounded-lg bg-royal-bright px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white shadow-premium-sm">
                      {it.badge}
                    </span>
                  )}
                </div>
                <p className="mt-3 font-medium tracking-[-0.01em] transition-colors group-hover:text-royal-bright">{it.title}</p>
                {it.eta && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald">
                    <Zap className="size-3" /> {it.eta}
                  </p>
                )}
              </Link>
            ))}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
