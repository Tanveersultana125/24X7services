"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Pixels per second the strip drifts on its own. */
const SPEED = 26;

/**
 * A strip that drifts on its own and can also be dragged.
 *
 * One number drives everything: `offset`, applied to the track as a transform.
 * The drift advances it each frame, a drag sets it directly, and the cursor
 * resting on the strip freezes it. The children are rendered twice as two
 * identical copies, so wrapping at the first copy's width is invisible.
 *
 * Transform rather than scrollLeft because a scroll container only moves if the
 * browser agrees it's scrollable — this moves whatever the container thinks.
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
  const track = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const hovering = useRef(false);
  const drag = useRef({ active: false, startX: 0, startOffset: 0, moved: 0 });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      // Clamped so a backgrounded tab doesn't resume with one enormous jump.
      const elapsed = Math.min(now - last, 50);
      last = now;

      const span = copy.current?.offsetWidth ?? 0;
      if (span > 0) {
        if (!hovering.current && !drag.current.active) {
          offset.current += ((reverse ? -1 : 1) * SPEED * elapsed) / 1000;
        }
        // Keep the offset inside one copy — the second copy covers the gap.
        offset.current = ((offset.current % span) + span) % span;
        if (track.current) {
          track.current.style.transform = `translate3d(${-offset.current}px, 0, 0)`;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reverse]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { active: true, startX: e.clientX, startOffset: offset.current, moved: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    // Dragging right pulls the strip right, so the offset moves the other way.
    offset.current = drag.current.startOffset - dx;
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  /** A drag that ends on a card would otherwise open it — swallow that click. */
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved > 6) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = 0;
    }
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
        onMouseEnter={() => (hovering.current = true)}
        onMouseLeave={() => {
          hovering.current = false;
          endDrag();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        /* pan-y: a vertical swipe still scrolls the page, a horizontal one is
           ours. Without it the browser claims the gesture and the strip
           wouldn't follow a finger at all. */
        className="cursor-grab touch-pan-y select-none active:cursor-grabbing"
      >
        <div ref={track} className="flex w-max will-change-transform">
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
