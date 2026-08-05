"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Pixels per second the strip drifts on its own. */
const SPEED = 26;

/**
 * A strip that drifts on its own and can also be dragged.
 *
 * It scrolls a real overflow container rather than animating a transform, which
 * is what lets a visitor grab it: the drift, the hover pause and the drag all
 * move the same scrollLeft. The children are rendered twice as two identical
 * copies, so wrapping at the first copy's width is invisible.
 */
export function Marquee({
  children,
  reverse = false,
  className,
  trackClassName,
  fade = true,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  className?: string;
  /** Overrides on each copy — e.g. `items-stretch` for equal-height cards. */
  trackClassName?: string;
  fade?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);
  const drag = useRef({ active: false, startX: 0, startLeft: 0 });

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;

    // A reverse strip starts on the second copy so it has somewhere to go.
    if (reverse && copy.current) el.scrollLeft = copy.current.offsetWidth - 1;

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      // Clamped so a backgrounded tab doesn't resume with one enormous jump.
      const elapsed = Math.min(now - last, 50);
      last = now;

      const span = copy.current?.offsetWidth ?? 0;
      // Nothing to loop through until the copies have laid out.
      if (span > 0) {
        if (!hovering.current && !drag.current.active) {
          el.scrollLeft += ((reverse ? -1 : 1) * SPEED * elapsed) / 1000;
        }
        if (el.scrollLeft >= span) el.scrollLeft -= span;
        else if (el.scrollLeft < 0) el.scrollLeft += span;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reverse]);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = viewport.current;
    // Touch already pans the strip natively; driving scrollLeft as well would
    // fight it. This drag is for the cursor.
    if (!el || e.pointerType !== "mouse") return;
    drag.current = { active: true, startX: e.clientX, startLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = viewport.current;
    if (!el || !drag.current.active) return;
    el.scrollLeft = drag.current.startLeft - (e.clientX - drag.current.startX);
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  return (
    <div
      className={cn("group relative overflow-hidden", className)}
      style={
        fade
          ? {
              maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
            }
          : undefined
      }
    >
      <div
        ref={viewport}
        /* Lenis owns touch scrolling globally; without this it swallows a
           horizontal swipe and the strip never moves on a phone. */
        data-lenis-prevent
        onMouseEnter={() => (hovering.current = true)}
        onMouseLeave={() => {
          hovering.current = false;
          endDrag();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max">
          <div ref={copy} className={cn("flex shrink-0 items-center gap-16 pr-16", trackClassName)}>
            {children}
          </div>
          <div aria-hidden className={cn("flex shrink-0 items-center gap-16 pr-16", trackClassName)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
