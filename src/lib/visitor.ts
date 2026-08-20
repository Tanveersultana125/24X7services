"use client";

/**
 * A random id for this browser, so a visitor who hasn't signed in is still one
 * visitor rather than one per page.
 *
 * Shared by everything that reports back — the basket and the activity trail
 * both file under it, so the panel shows one person rather than two halves of
 * one. It is generated here and means nothing anywhere else: no name, no
 * address, nothing that outlives clearing the browser's storage.
 */

const VISITOR_KEY = "24x7-visitor";

export function visitorId(): string {
  try {
    const stored = window.localStorage.getItem(VISITOR_KEY);
    if (stored) return stored;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    // A blocked store means this browser cannot be followed across reloads.
    // Reporting nothing beats reporting a new visitor on every page view.
    return "";
  }
}
