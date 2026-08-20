"use client";

import { useSyncExternalStore } from "react";

/**
 * The services someone has picked but not yet booked.
 *
 * Kept in localStorage rather than on the server: nothing here is private, a
 * visitor may not be signed in, and a basket that survives a refresh is the
 * whole point. The snapshot is cached so React sees the same array between
 * renders — recomputing it from JSON on every read would loop.
 */

export type CartItem = {
  /** What the booking form needs to preselect: an appliance id, or a plan id. */
  id: string;
  name: string;
  /** How many units — an offer's tier, or 1. */
  qty: number;
  /** What the whole line costs. */
  price: number;
  /** An appliance visit, or an annual contract. Absent reads as a service. */
  kind?: "service" | "plan";
  /** The fault this line is for, when it was added from the price list. */
  problem?: string;
  problemLabel?: string;
  /**
   * The make this line was picked for, when it came off a brand's page.
   *
   * Someone who opens /brands/samsung and adds a fridge has already told us
   * whose fridge it is; without carrying it, the booking form asks again and
   * the price they were shown — which is that brand's — is not the one it
   * quotes back.
   */
  brand?: string;
};

/**
 * What makes two lines the same line.
 *
 * The same appliance can sit in the basket twice for two different faults, so
 * the service id alone is not an identity — the fault, the make and the
 * quantity are all part of it. A Samsung fridge and an LG fridge are two jobs
 * at two prices, and collapsing them would quietly drop one.
 */
export function lineKey(item: Pick<CartItem, "id" | "qty" | "problem" | "brand">): string {
  return `${item.id}::${item.brand ?? ""}::${item.problem ?? ""}::${item.qty}`;
}

/** Where a line goes when someone books it. */
export function bookHref(item: CartItem): string {
  if (item.kind === "plan") return `/book?amc=${encodeURIComponent(item.id)}`;
  const params = new URLSearchParams({ appliance: item.id, qty: String(item.qty) });
  if (item.brand) params.set("brand", item.brand);
  if (item.problem) params.set("problem", item.problem);
  return `/book?${params.toString()}`;
}

/**
 * The basket panel lives in the nav and owns its own open state, so anything
 * else that wants to show it — the bar that confirms an addition — fires this
 * rather than threading a callback up through the layout.
 */
export const OPEN_CART_EVENT = "24x7:open-cart";

export function openCart() {
  window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT));
}

const KEY = "24x7-cart";
const EMPTY: CartItem[] = [];

let snapshot: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  if (loaded) return snapshot;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    snapshot = Array.isArray(parsed) ? parsed.filter(isItem) : EMPTY;
  } catch {
    snapshot = EMPTY;
  }
  return snapshot;
}

function isItem(value: unknown): value is CartItem {
  const v = value as CartItem;
  return Boolean(v && typeof v.id === "string" && typeof v.name === "string" && v.qty > 0);
}

function write(next: CartItem[]) {
  snapshot = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // A full or blocked store shouldn't stop the basket working this session.
  }
  for (const listen of listeners) listen();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab may change it — the count in the nav should follow.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Adding the same line again replaces it rather than doubling it. */
export function addToCart(item: CartItem) {
  const key = lineKey(item);
  write([...read().filter((i) => lineKey(i) !== key), item]);
}

export function removeFromCart(key: string) {
  write(read().filter((i) => lineKey(i) !== key));
}

export function clearCart() {
  write([]);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price, 0);
}
