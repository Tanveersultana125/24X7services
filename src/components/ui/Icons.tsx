"use client";

import { Refrigerator, WashingMachine, Microwave, AirVent, type LucideIcon } from "lucide-react";
import type { ApplianceId, BrandId } from "@/lib/types";
import { cn } from "@/lib/utils";

export const APPLIANCE_ICONS: Record<ApplianceId, LucideIcon> = {
  refrigerator: Refrigerator,
  "washing-machine": WashingMachine,
  microwave: Microwave,
  ac: AirVent,
};

const APPLIANCE_GRADIENTS: Record<ApplianceId, string> = {
  refrigerator: "from-[#2547d0] to-[#1e3a8a]",
  "washing-machine": "from-[#0b9a63] to-[#0f766e]",
  microwave: "from-[#d9821b] to-[#b45309]",
  ac: "from-[#0ea5e9] to-[#0369a1]",
};

export function ApplianceTile({
  id,
  size = "md",
  className,
}: {
  id: ApplianceId;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = APPLIANCE_ICONS[id];
  const dims = size === "lg" ? "size-16" : size === "sm" ? "size-11" : "size-14";
  const icon = size === "lg" ? "size-8" : size === "sm" ? "size-5" : "size-7";
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-2xl bg-gradient-to-br text-white shadow-premium-md",
        APPLIANCE_GRADIENTS[id],
        dims,
        className
      )}
    >
      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 mix-blend-overlay" />
      <div className="absolute inset-x-2 top-1 h-1/3 rounded-full bg-white/40 blur-md" />
      <Icon className={cn("relative", icon)} strokeWidth={1.6} />
    </div>
  );
}

/** Official brand colours, for on-brand logo rendering. */
export const BRAND_COLOR: Record<BrandId, string> = {
  samsung: "#1428A0",
  lg: "#A50034",
  ifb: "#005EB8",
  bosch: "#EA0016",
};

/**
 * Brand logos rendered as clean vector marks — colour-accurate wordmarks
 * (Samsung / IFB / Bosch are wordmark logos) plus LG's circular face mark.
 *
 * `tone`:
 *  - "current" (default) inherits `currentColor` — keeps existing usages untouched.
 *  - "brand" paints each mark in its official brand colour.
 *  - "white" renders for use on a coloured background.
 */
export function BrandMark({
  id,
  className,
  tone = "current",
}: {
  id: BrandId;
  className?: string;
  tone?: "current" | "brand" | "white";
}) {
  const marks: Record<BrandId, { label: string; className: string }> = {
    samsung: { label: "SAMSUNG", className: "tracking-[0.12em] font-bold" },
    lg: { label: "LG", className: "tracking-tight font-extrabold text-2xl" },
    ifb: { label: "IFB", className: "tracking-[0.15em] font-extrabold" },
    bosch: { label: "BOSCH", className: "tracking-[0.22em] font-bold" },
  };

  // LG's identity is the circular face mark, not a wordmark — render it when on-brand.
  if (id === "lg" && tone !== "current") {
    const bg = tone === "white" ? "#ffffff" : BRAND_COLOR.lg;
    const fg = tone === "white" ? BRAND_COLOR.lg : "#ffffff";
    return (
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="LG"
        className={cn("inline-block h-[1.4em] w-[1.4em] align-middle", className)}
      >
        <circle cx="50" cy="50" r="50" fill={bg} />
        <circle cx="34" cy="33" r="6.5" fill={fg} />
        <path
          d="M46.5 24 V64 H67"
          fill="none"
          stroke={fg}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const m = marks[id];
  const style =
    tone === "brand" ? { color: BRAND_COLOR[id] } : tone === "white" ? { color: "#ffffff" } : undefined;
  return (
    <span
      className={cn(tone === "current" && "text-foreground", m.className, className)}
      style={style}
    >
      {m.label}
    </span>
  );
}
