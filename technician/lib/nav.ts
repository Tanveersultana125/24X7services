'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * The in-app pages the technician has walked through, so Back returns to the
 * page they came from rather than a fixed parent. Lives in memory: a reload or
 * a deep link starts empty, and Back then falls back to the screen's parent.
 */
const trail: string[] = []

/** AppShell calls this on every pathname change. */
export function recordPath(path: string, bare: boolean) {
  if (bare) {
    trail.length = 0
    return
  }
  if (trail.length >= 2 && trail[trail.length - 2] === path) trail.pop()
  else if (trail[trail.length - 1] !== path) trail.push(path)
}

/** Go to the previous in-app page, or to `fallback` when there is none. */
export function useBack(fallback: Route) {
  const router = useRouter()
  return useCallback(() => {
    if (trail.length >= 2) router.back()
    else router.replace(fallback)
  }, [router, fallback])
}
