"use client";

import { Refrigerator, WashingMachine, Microwave, CookingPot, type LucideIcon } from "lucide-react";
import type { ApplianceId, BrandId } from "@/lib/types";
import { cn } from "@/lib/utils";

export const APPLIANCE_ICONS: Record<ApplianceId, LucideIcon> = {
  refrigerator: Refrigerator,
  "washing-machine": WashingMachine,
  microwave: Microwave,
  oven: CookingPot,
};

const APPLIANCE_GRADIENTS: Record<ApplianceId, string> = {
  refrigerator: "from-[#2547d0] to-[#1e3a8a]",
  "washing-machine": "from-[#0b9a63] to-[#0f766e]",
  microwave: "from-[#d9821b] to-[#b45309]",
  oven: "from-[#334155] to-[#1e293b]",
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

/** Minimal, tasteful brand wordmark rendered as styled text (no third-party logos). */
export function BrandMark({ id, className }: { id: BrandId; className?: string }) {
  const marks: Record<BrandId, { label: string; className: string }> = {
    samsung: { label: "SAMSUNG", className: "tracking-[0.12em] font-bold" },
    lg: { label: "LG", className: "tracking-tight font-extrabold text-2xl" },
    ifb: { label: "IFB", className: "tracking-[0.15em] font-extrabold" },
    bosch: { label: "BOSCH", className: "tracking-[0.22em] font-bold" },
  };
  const m = marks[id];
  return <span className={cn("text-foreground", m.className, className)}>{m.label}</span>;
}
