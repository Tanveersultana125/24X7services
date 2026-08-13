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
  /** The catalogue service this line is for. */
  id: string;
  name: string;
  /** How many units — an offer's tier, or 1. */
  qty: number;
  /** What the whole line costs. */
  price: number;
};

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

/** Adding the same service again replaces its line rather than doubling it. */
export function addToCart(item: CartItem) {
  const rest = read().filter((i) => !(i.id === item.id && i.qty === item.qty));
  write([...rest, item]);
}

export function removeFromCart(id: string, qty: number) {
  write(read().filter((i) => !(i.id === id && i.qty === qty)));
}

export function clearCart() {
  write([]);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price, 0);
}
