"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Kicker } from "./TextReveal";
import { cn } from "@/lib/utils";

type Item = { title: string; img: string; href: string; badge?: string; eta?: string };

const ITEMS: Item[] = [
  { title: "Foam-jet AC service", img: "/work/ac-service.png", href: "/book", badge: "New" },
  { title: "Front-load washer care", img: "/work/gallery/washing-1.png", href: "/book?appliance=washing-machine", eta: "In 60 mins" },
  { title: "Smart fridge diagnosis", img: "/work/gallery/fridge-1.png", href: "/book?appliance=refrigerator" },
  { title: "Microwave express fix", img: "/work/microwave.png", href: "/book?appliance=microwave", eta: "In 44 mins" },
  { title: "AC installation", img: "/work/ac.png", href: "/book", badge: "New" },
  { title: "Refrigerator gas top-up", img: "/work/gallery/fridge-2.png", href: "/book?appliance=refrigerator" },
];

export function Noteworthy() {
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
    const step = card ? (card.offsetWidth + 20) * 2 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="relative scroll-mt-28 pb-10 pt-2 sm:pb-14 sm:pt-4">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <Kicker>New &amp; noteworthy</Kicker>
        <h2 className="font-display mt-6 max-w-xl text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
          Fresh on the menu.
        </h2>

        <div className="relative mt-12">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => slide(-1)}
            disabled={atStart}
            className={cn(
              "absolute left-1 top-[38%] z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:left-0 sm:-translate-x-1/2",
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
              "absolute right-1 top-[38%] z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:right-0 sm:translate-x-1/2",
              atEnd && "pointer-events-none opacity-30"
            )}
          >
            <ChevronRight className="size-4" />
          </button>

          <div
            ref={scroller}
            onScroll={update}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {ITEMS.map((it) => (
              <Link
                key={it.title}
                href={it.href}
                data-item
                className="group w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-[21%]"
              >
                <div className="relative overflow-hidden rounded-2xl bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.img}
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
    </section>
  );
}
