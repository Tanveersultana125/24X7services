"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Zap, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Kicker } from "./TextReveal";
import { APPLIANCES } from "@/lib/data";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const PHOTO: Record<string, string> = {
  refrigerator: "/work/refrigerator.png",
  "washing-machine": "/work/washing-machine.png",
  microwave: "/work/microwave.png",
  ac: "/work/gallery/ac-3.png",
};

type Card = {
  title: string;
  img: string;
  price: number;
  rating: number;
  meta: string;
  instant?: boolean;
  href: string;
};

// AC leads the row (real photo, common service); the rest come straight from data.
const CARDS: Card[] = [
  {
    title: "AC repair & service",
    img: "/work/ac-service.png",
    price: 299,
    rating: 4.7,
    meta: "1.4M+ booked",
    instant: true,
    href: "/book",
  },
  {
    title: "AC installation",
    img: "/work/ac.png",
    price: 1099,
    rating: 4.7,
    meta: "620K+ booked",
    href: "/book",
  },
  ...APPLIANCES.filter((a) => PHOTO[a.id]).map((a) => ({
    title: `${a.name} repair`,
    img: PHOTO[a.id],
    price: a.startingPrice,
    rating: a.rating,
    meta: `${a.bookings} booked`,
    instant: a.id === "microwave",
    href: `/book?appliance=${a.id}`,
  })),
];

export function MostBooked() {
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
    // the gap is padding inside the card, so its own width is the whole step
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  /**
   * Drag-to-swipe for pointers. Touch already swipes natively, so this only
   * takes over for a mouse — grabbing the strip and pulling it sideways.
   */
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const el = scroller.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft, moved: 0 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = scroller.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    el.scrollLeft = drag.current.startLeft - dx;
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  // A drag that ends on a card would otherwise open it — swallow that click.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved > 6) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = 0;
    }
  };

  return (
    <section id="most-booked" className="relative scroll-mt-28 pb-10 pt-2 sm:pb-14 sm:pt-4">
      <div className="mx-auto max-w-[92rem] px-6 sm:px-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Kicker>Most booked</Kicker>
            <h2 className="font-display mt-6 max-w-xl text-[2.6rem] leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              Our most
              <br />
              booked services.
            </h2>
          </div>

          <Link
            href="/services"
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2 sm:inline-flex"
          >
            See all
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {/* carousel — floating edge arrows slide one card at a time */}
        <div className="relative mt-10 sm:mt-14">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => slide(-1)}
            disabled={atStart}
            className={cn(
              "absolute left-0 top-[42%] z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:grid",
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
              "absolute right-0 top-[42%] z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:grid",
              atEnd && "pointer-events-none opacity-30"
            )}
          >
            <ChevronRight className="size-4" />
          </button>

          {/* No arrows on a phone, so the strip keeps the full width; from sm
              up the margins are the arrows' lane and clip the neighbours. */}
          <div className="overflow-hidden sm:mx-12">
          <div
            ref={scroller}
            onScroll={update}
            /* Lenis owns touch scrolling globally; without this it swallows a
               horizontal swipe and the strip never moves on a phone. */
            data-lenis-prevent
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
            onClickCapture={onClickCapture}
            /* The strip runs wider than the box that clips it, so the next
               card's border and its 8px shadow both fall outside the edge
               instead of drawing a hairline in the arrow's gutter. */
            className="-mr-3 flex cursor-grab snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          >
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              data-card
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease }}
              /* The gap lives inside the card as padding, so the sizer can use
                 plain fractions and a row holds exactly 1 / 2 / 3 whole cards.
                 Subtracting a gap with w-[calc(...)] looked equivalent but
                 Tailwind never emitted those rules, leaving cards at their
                 content width and a sliver of the next one showing. */
              className="w-full shrink-0 grow-0 snap-start pr-5 sm:w-1/2 lg:w-1/3"
            >
              <Link
                href={c.href}
                className="group block overflow-hidden rounded-2xl border border-white/60 bg-surface shadow-premium-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-premium-md"
              >
                <div className="relative aspect-[5/4] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.img}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                  <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
                  {c.instant && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[0.62rem] font-semibold text-ink shadow-premium-sm backdrop-blur">
                      <Zap className="size-2.5 text-emerald" /> Instant
                    </span>
                  )}
                </div>

                <div className="p-3.5">
                  <h3 className="text-sm font-medium tracking-[-0.01em]">{c.title}</h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                    <span className="inline-flex items-center gap-1 font-medium text-ink">
                      <Star className="size-3 fill-amber text-amber" /> {c.rating}
                    </span>
                    <span className="size-1 rounded-full bg-border" />
                    <span>{c.meta}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    From <span className="text-sm font-semibold text-ink">₹{c.price}</span>
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
