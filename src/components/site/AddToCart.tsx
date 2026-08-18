"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { addToCart, type CartItem } from "@/lib/cart";
import { cn } from "@/lib/utils";

/**
 * The one way anything gets into the basket.
 *
 * Adding used to live only inside the service sheet's quantity tiers, which
 * meant a service without tiers could not be added at all and nobody found the
 * ones that could. Every place that knows a name and a price now uses this, so
 * the button looks and behaves the same wherever it appears — and confirms
 * itself in place rather than silently bumping a number in the nav.
 */
export function AddToCart({
  item,
  label = "Add",
  addedLabel = "Added",
  variant = "outline",
  className,
}: {
  item: CartItem;
  label?: string;
  addedLabel?: string;
  /** `icon` is the compact square used in dense price rows. */
  variant?: "outline" | "solid" | "invert" | "icon";
  className?: string;
}) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);

  // The confirmation is a timer, and the row it sits in can unmount while it
  // runs — clear it rather than setting state on a gone component.
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const base =
    "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-colors";
  const shape = {
    outline:
      "rounded-full border px-3.5 py-1.5 text-xs " +
      (added
        ? "border-emerald bg-emerald/10 text-emerald"
        : "border-royal-bright text-royal-bright hover:bg-royal-bright hover:text-white"),
    solid:
      "rounded-full px-5 py-2.5 text-sm text-background " +
      (added ? "bg-emerald text-white" : "bg-ink hover:opacity-90"),
    invert:
      "rounded-full px-6 py-3.5 text-sm " +
      (added ? "bg-white/25 text-white" : "bg-white/15 text-white backdrop-blur hover:bg-white/25"),
    icon:
      "size-7 rounded-full border sm:size-8 " +
      (added
        ? "border-emerald bg-emerald text-white"
        : "border-border text-muted hover:border-royal-bright hover:bg-royal-bright hover:text-white"),
  }[variant];

  return (
    <button
      type="button"
      onClick={(e) => {
        // In the price list this sits inside a row that is itself a link to
        // the booking form — adding must not also navigate away from it.
        e.preventDefault();
        e.stopPropagation();
        addToCart(item);
        setAdded(true);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setAdded(false), 1800);
      }}
      aria-label={variant === "icon" ? `Add ${item.name} to basket` : undefined}
      className={cn(base, shape, className)}
    >
      {added ? <Check className="size-3.5" strokeWidth={2.6} /> : <Plus className="size-3.5" strokeWidth={2.4} />}
      {variant !== "icon" && <span>{added ? addedLabel : label}</span>}
    </button>
  );
}
