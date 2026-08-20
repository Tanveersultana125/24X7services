"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Zap, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Kicker } from "./TextReveal";
import { useSiteImages } from "@/components/providers/SiteImagesProvider";
import type { SectionOverrides } from "@/lib/section-overrides-shared";
import { clean } from "@/lib/section-overrides-apply";
import { useServices } from "@/components/providers/ServicesProvider";
import { AddToCart } from "./AddToCart";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const PHOTO: Record<string, string> = {
  refrigerator: "/work/refrigerator.png",
  "washing-machine": "/work/washing-machine.png",
  microwave: "/work/microwave.png",
  ac: "/work/gallery/ac-3.png",
};

type Card = {
  /** Which site-image slot this card's photo comes from. */
  slot: string;
  title: string;
  img: string;
  price: number;
  rating: number;
  meta: string;
  instant?: boolean;
  href: string;
  /**
   * The catalogue service this card sells, so it can be added to the basket
   * and not only clicked through to the booking form. The card's own title and
   * price are what goes in — an admin who renames a card or reprices it has
   * changed what the visitor was offered, and that is what the basket owes
   * them.
   */
  service: string;
  /** The specific job, where the card is for one rather than the appliance at large. */
  problem?: string;
  problemLabel?: string;
};

// AC leads the row (real photo, common service); the rest follow the
// catalogue. Only the four that ship with the site appear here — each card's
// photo comes from a named image slot, and a service added from the panel has
// no slot of its own.
const HEAD: Card[] = [
  {
    title: "AC repair & service",
    img: "/work/ac-service.png",
    slot: "mostbooked-ac-service",
    price: 299,
    rating: 4.7,
    meta: "1.4M+ booked",
    instant: true,
    href: "/book",
    service: "ac",
  },
  {
    title: "AC installation",
    img: "/work/ac.png",
    slot: "mostbooked-ac-installation",
    price: 1099,
    rating: 4.7,
    meta: "620K+ booked",
    href: "/book",
    // Both AC cards sell the same appliance, so without naming the job they
    // would key to one basket line and adding the second would replace the
    // first. "installation" is a real repair id, so the booking form opens on
    // it too.
    service: "ac",
    problem: "installation",
    problemLabel: "Installation",
  },
];

export function MostBooked({
  overrides = {},
}: {
  overrides?: SectionOverrides;
}) {
  const images = useSiteImages();
  const services = useServices();
  const catalogue: Card[] = [
    ...HEAD,
    ...services
      .filter((a) => PHOTO[a.id])
      .map((a) => ({
        title: `${a.name} repair`,
        img: PHOTO[a.id],
        slot: `mostbooked-${a.id}`,
        price: a.startingPrice,
        rating: a.rating,
        meta: `${a.bookings} booked`,
        instant: a.id === "microwave",
        href: `/book?appliance=${a.id}`,
        service: a.id,
      })),
  ];
  const cards: Card[] = [
    ...catalogue.filter((c) => !overrides[c.slot]?.hidden).map((c) => ({ ...c, ...clean(overrides[c.slot]) })),
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
        {/* The heading fills a phone's width on its own, so "See all" drops to
            its own row there and only shares the line from sm up. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <Kicker>Most booked</Kicker>
            <h2 className="font-display mt-6 max-w-xl text-[2.6rem] leading-[1.15] sm:leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              Our most
              <br />
              booked services.
            </h2>
          </div>

          <Link
            href="/services"
            className="inline-flex shrink-0 items-center gap-1.5 self-end rounded-full border border-border px-4 py-2 text-[0.82rem] font-medium transition-colors hover:bg-surface-2 sm:self-auto sm:px-5 sm:py-2.5 sm:text-sm"
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
              "absolute left-0 top-[38%] z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:top-[42%] sm:size-10",
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
              "absolute right-0 top-[38%] z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface shadow-premium-lg transition-all hover:scale-110 hover:bg-surface-2 sm:top-[42%] sm:size-10",
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
          {cards.map((c, i) => (
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
              {/* The card is a link end to end, and a button inside an anchor
                  is neither valid nor clickable on its own — so Add sits
                  beside the link and floats over the photo's free corner. The
                  lift lives on this wrapper rather than on the link, or the
                  card would slide out from under a stationary button. */}
              <div className="group relative transition-transform duration-500 hover:-translate-y-1">
                <Link
                  href={c.href}
                  className="block overflow-hidden rounded-2xl border border-card-edge bg-surface shadow-premium-sm transition-shadow duration-500 group-hover:shadow-premium-md"
                >
                  <div className="relative aspect-[5/4] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images[c.slot] ?? c.img}
                      alt={c.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                    <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
                    {c.instant && (
                      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[0.62rem] font-semibold text-on-white shadow-premium-sm backdrop-blur">
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

                <AddToCart
                  variant="icon"
                  /* Position only — the button carries its own colours now,
                     so that "in the basket" cannot be painted back to "add"
                     by whatever card it happens to sit on. */
                  className="absolute right-2.5 top-2.5 z-10"
                  item={{
                    id: c.service,
                    name: c.title,
                    qty: 1,
                    price: c.price,
                    ...(c.problem ? { problem: c.problem, problemLabel: c.problemLabel } : {}),
                  }}
                />
              </div>
            </motion.div>
          ))}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
