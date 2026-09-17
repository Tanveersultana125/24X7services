'use client'

import type { Route } from 'next'
import type { PendingVerification } from './auth'

/**
 * The verification in progress, held in memory between the phone screen and
 * the code screen.
 *
 * Firebase's confirmation result is a live object with a callback inside it. It
 * cannot be serialised, so it cannot go into storage or a URL, which means
 * `/login/otp` is only reachable by having just come from `/login`. Reloading
 * that screen loses the attempt — and the screen says so and sends the customer
 * back a step, rather than sitting there accepting a code it cannot check.
 *
 * Holding it in memory is also the right thing on its own terms: this is the
 * live half of a sign-in, and it has no business outliving the tab.
 */

interface Pending {
  phoneE164: string
  verification: PendingVerification
}

let pending: Pending | null = null

export function setPendingSignIn(next: Pending): void {
  pending = next
}

export function takePendingSignIn(): Pending | null {
  return pending
}

export function clearPendingSignIn(): void {
  pending = null
}

/**
 * Where to go after signing in.
 *
 * Only a path inside this app. A `next` that starts a URL — `//evil.example`,
 * `https://…` — is dropped, because a login screen that will forward anywhere
 * is a login screen someone else can aim.
 */
export function safeNext(raw: string | null): Route {
  if (!raw) return '/home'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/home'
  return raw as Route
}
