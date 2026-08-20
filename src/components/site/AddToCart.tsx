"use client";

import { Check, Minus, Plus } from "lucide-react";
import { addToCart, lineKey, removeFromCart, useCart, type CartItem } from "@/lib/cart";
import { cn } from "@/lib/utils";

/**
 * The one way anything gets into the basket — or back out of it.
 *
 * Adding used to live only inside the service sheet's quantity tiers, which
 * meant a service without tiers could not be added at all and nobody found the
 * ones that could. Every place that knows a name and a price now uses this, so
 * the button looks and behaves the same wherever it appears.
 *
 * It reads the basket rather than remembering that it was clicked. A button
 * that flashed "Added" for a second and went back to a plus told you what had
 * happened but never what was true: a card already in the basket looked
 * exactly like one that wasn't, adding again did nothing visible, and taking
 * something out meant opening the panel in the nav to find it. Now the two
 * states are the two states, and the same press undoes itself.
 *
 * `item` takes a list as well as a single line, because one choice does not
 * always mean one line: the booking form lets somebody tick three faults on
 * the same fridge, and each fault is its own job at its own price. Three lines
 * is what the basket already models, so three lines is what it gets — added
 * and removed together.
 */
export function AddToCart({
  item,
  label = "Add",
  addedLabel = "Added",
  variant = "outline",
  className,
}: {
  item: CartItem | CartItem[];
  label?: string;
  addedLabel?: string;
  /** `icon` is the compact square used on cards and in dense price rows. */
  variant?: "outline" | "solid" | "invert" | "icon";
  className?: string;
}) {
  const basket = useCart();
  const lines = Array.isArray(item) ? item : [item];
  // Every line, not any: a partly-added group is still something to add.
  const inBasket =
    lines.length > 0 && lines.every((l) => basket.some((b) => lineKey(b) === lineKey(l)));

  const what = lines.length === 1 ? lines[0].name : `${lines.length} services`;

  const base =
    "group/cart inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-colors";

  // Hover on a line that is already in turns the button the colour of the
  // thing it would do — taking it out — so the second press is never a
  // surprise. The states carry their own colour rather than taking it from
  // wherever the button sits, or a card could paint "added" back to "add".
  const shape = {
    outline: cn(
      "rounded-full border px-3.5 py-1.5 text-xs",
      inBasket
        ? "border-emerald bg-emerald/10 text-emerald hover:border-danger hover:bg-danger/10 hover:text-danger"
        : "border-royal-bright text-royal-bright hover:bg-royal-bright hover:text-white",
    ),
    solid: cn(
      "rounded-full px-5 py-2.5 text-sm",
      inBasket ? "bg-emerald text-white hover:bg-danger" : "bg-ink text-background hover:opacity-90",
    ),
    invert: cn(
      "rounded-full px-6 py-3.5 text-sm text-white",
      inBasket ? "bg-emerald hover:bg-danger" : "bg-white/15 backdrop-blur hover:bg-white/25",
    ),
    icon: cn(
      "size-8 rounded-full shadow-premium-sm ring-1 ring-inset sm:size-9",
      inBasket
        ? "bg-emerald text-white ring-emerald hover:bg-danger hover:ring-danger"
        : "bg-white text-on-white ring-black/[0.07] hover:bg-royal-bright hover:text-white hover:ring-royal-bright",
    ),
  }[variant];

  return (
    <button
      type="button"
      onClick={(e) => {
        // In the price list this sits inside a row that is itself a link to
        // the booking form — pressing it must not also navigate away.
        e.preventDefault();
        e.stopPropagation();
        for (const line of lines) {
          if (inBasket) removeFromCart(lineKey(line));
          else addToCart(line);
        }
      }}
      aria-pressed={inBasket}
      aria-label={`${inBasket ? "Remove" : "Add"} ${what} ${inBasket ? "from" : "to"} basket`}
      title={inBasket ? "Remove from basket" : undefined}
      className={cn(base, shape, className)}
    >
      {inBasket ? (
        /* The icon button has no room for a word and a fixed width to spend,
           so it says "remove" by becoming a minus under the cursor. The ones
           with a label keep their tick — swapping the word would move the
           button out from under the pointer. */
        <span className="relative grid size-3.5 shrink-0 place-items-center">
          <Check
            className={cn(
              "size-3.5 transition-opacity",
              variant === "icon" && "group-hover/cart:opacity-0",
            )}
            strokeWidth={2.6}
          />
          {variant === "icon" && (
            <Minus
              className="absolute size-3.5 opacity-0 transition-opacity group-hover/cart:opacity-100"
              strokeWidth={2.6}
            />
          )}
        </span>
      ) : (
        <Plus className="size-3.5 shrink-0" strokeWidth={2.4} />
      )}
      {variant !== "icon" && <span>{inBasket ? addedLabel : label}</span>}
    </button>
  );
}
