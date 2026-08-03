"use client";

import { cn } from "@/lib/utils";

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
  /** Overrides on the moving track — e.g. `items-stretch` for equal-height cards. */
  trackClassName?: string;
  fade?: boolean;
}) {
  return (
    <div
      className={cn("group relative flex overflow-hidden", className)}
      style={
        fade
          ? { maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" }
          : undefined
      }
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-16 pr-16",
          reverse ? "animate-marquee-rev" : "animate-marquee",
          "group-hover:[animation-play-state:paused]",
          trackClassName
        )}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
