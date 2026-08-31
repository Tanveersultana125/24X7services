"use client";

import {
  Refrigerator, WashingMachine, Microwave, AirVent, Wrench, Snowflake, Droplets, Fuel,
  DoorOpen, Lock, Cog, Volume2, Disc3, RotateCw, Power, Zap, MonitorSmartphone, Flame,
  Thermometer, Fan, Sparkles, Cpu, PackageOpen, type LucideIcon,
} from "lucide-react";
import type { ApplianceId, BrandId } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Each fault gets its own glyph — a repeated wrench made every row look
 * identical. Shared, because the same repairs are listed on the services page
 * and on each brand's page, and a fault that changes its face between the two
 * reads as a different fault.
 */
export const PROBLEM_ICONS: Record<string, LucideIcon> = {
  "not-cooling": Snowflake,
  "water-leakage": Droplets,
  "gas-filling": Fuel,
  "door-issue": DoorOpen,
  "door-lock": Lock,
  compressor: Cog,
  "ice-build-up": Snowflake,
  noise: Volume2,
  installation: Wrench,
  "drum-issue": Disc3,
  "spin-issue": RotateCw,
  "motor-problem": Cog,
  "not-starting": Power,
  "power-problem": Zap,
  "display-issue": MonitorSmartphone,
  "display-problem": MonitorSmartphone,
  "heating-issue": Flame,
  "not-heating": Flame,
  "plate-not-rotating": RotateCw,
  spark: Zap,
  thermostat: Thermometer,
  "fan-issue": Fan,
  "deep-clean": Sparkles,
  "pcb-issue": Cpu,
  uninstallation: PackageOpen,
};

/** The glyph for a fault, falling back to a wrench for one we don't know. */
export function problemIcon(id: string): LucideIcon {
  return PROBLEM_ICONS[id] ?? Wrench;
}

export const APPLIANCE_ICONS: Record<ApplianceId, LucideIcon> = {
  refrigerator: Refrigerator,
  "washing-machine": WashingMachine,
  microwave: Microwave,
  ac: AirVent,
  other: Wrench,
};

/** Flat accent per appliance — used where a whole surface takes its colour. */
export const APPLIANCE_ACCENT: Record<ApplianceId, string> = {
  refrigerator: "#2547d0",
  "washing-machine": "#0b9a63",
  microwave: "#d9821b",
  ac: "#0ea5e9",
  other: "#64748b",
};

const APPLIANCE_GRADIENTS: Record<ApplianceId, string> = {
  refrigerator: "from-[#2547d0] to-[#1e3a8a]",
  "washing-machine": "from-[#0b9a63] to-[#0f766e]",
  microwave: "from-[#d9821b] to-[#b45309]",
  ac: "from-[#0ea5e9] to-[#0369a1]",
  other: "from-[#64748b] to-[#475569]",
};

export function ApplianceTile({
  id,
  size = "md",
  onAccent = false,
  className,
}: {
  id: ApplianceId;
  size?: "sm" | "md" | "lg";
  /** Sitting on the appliance's own accent — drop the gradient so the two do not clash. */
  onAccent?: boolean;
  className?: string;
}) {
  // An admin can coin an appliance the build has never heard of — it gets the
  // generic wrench and slate rather than a blank tile.
  const Icon = APPLIANCE_ICONS[id] ?? APPLIANCE_ICONS.other;
  const gradient = APPLIANCE_GRADIENTS[id] ?? APPLIANCE_GRADIENTS.other;
  const dims = size === "lg" ? "size-16" : size === "sm" ? "size-11" : "size-14";
  const icon = size === "lg" ? "size-8" : size === "sm" ? "size-5" : "size-7";
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-2xl text-white",
        onAccent
          ? "bg-white/20 ring-1 ring-inset ring-white/30"
          : cn("bg-gradient-to-br shadow-premium-md", gradient),
        dims,
        className
      )}
    >
      {!onAccent && (
        <div className="absolute inset-x-2 top-1 h-1/3 rounded-full bg-white/40 blur-md" />
      )}
      <Icon className={cn("relative", icon)} strokeWidth={1.6} />
    </div>
  );
}

/** Official brand colours, for on-brand logo rendering. */
export const BRAND_COLOR: Record<string, string> = {
  samsung: "#1428A0",
  lg: "#A50034",
  ifb: "#005EB8",
  bosch: "#EA0016",
  other: "#64748B",
};

/**
 * Brand logos rendered as clean vector marks — colour-accurate wordmarks
 * (Samsung / IFB / Bosch are wordmark logos) plus LG's circular face mark.
 *
 * `tone`:
 *  - "current" (default) inherits `currentColor` — keeps existing usages untouched.
 *  - "brand" paints each mark in its official brand colour.
 *  - "white" renders for use on a coloured background.
 *
 * A company added in the admin panel has no artwork in here, so `name` and
 * `accent` are what it is drawn from: its name set as a wordmark, in the house
 * colour that was picked for it. Pass them whenever the brand record is to
 * hand — for the four that ship with the build they are ignored.
 */
export function BrandMark({
  id,
  name,
  accent,
  className,
  tone = "current",
}: {
  id: BrandId;
  name?: string;
  accent?: string;
  className?: string;
  tone?: "current" | "brand" | "white";
}) {
  const marks: Record<string, { label: string; className: string }> = {
    samsung: { label: "SAMSUNG", className: "tracking-[0.12em] font-bold" },
    lg: { label: "LG", className: "tracking-tight font-extrabold text-2xl" },
    ifb: { label: "IFB", className: "tracking-[0.15em] font-extrabold" },
    bosch: { label: "BOSCH", className: "tracking-[0.22em] font-bold" },
    other: { label: "OTHER", className: "tracking-[0.12em] font-bold" },
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

  // An added company falls back to its own name, spaced like the wordmarks
  // beside it so a mixed row still reads as one set of logos.
  const m = marks[id] ?? {
    label: (name || String(id)).toUpperCase(),
    className: "tracking-[0.12em] font-bold",
  };
  const brandColor = BRAND_COLOR[id] ?? accent ?? BRAND_COLOR.other;
  const style =
    tone === "brand" ? { color: brandColor } : tone === "white" ? { color: "#ffffff" } : undefined;
  return (
    <span
      className={cn(tone === "current" && "text-foreground", m.className, className)}
      style={style}
    >
      {m.label}
    </span>
  );
}
