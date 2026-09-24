'use client'

import { useEffect, useState } from 'react'
import { demoMode } from '@/lib/firebase'
import { loadDemoData } from '@/lib/demo'

/**
 * Holds the app back until the demo catalog is in Firestore's cache.
 *
 * Outside demo mode it renders its children straight through and costs nothing.
 * Inside it, every screen's first read has to find the bundle already loaded:
 * an offline read of an empty cache comes back empty immediately, and the
 * screen would settle on "nothing here" instead of waiting.
 *
 * The prerendered HTML is the blank state either way, so a demo page shows the
 * page background for the moment the bundle takes, then the app.
 */
export function DemoGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(
    'loading'
  )

  useEffect(() => {
    if (!demoMode) return
    loadDemoData().then(
      () => setState('ready'),
      () => setState('failed')
    )
  }, [])

  if (!demoMode) return children

  if (state === 'failed') {
    return (
      <p className="mx-auto max-w-sm px-4 pt-24 text-center text-sm text-muted">
        The demo could not load. Check your connection and reload the page.
      </p>
    )
  }

  if (state === 'loading') {
    return (
      <div role="status" className="flex min-h-dvh items-center justify-center">
        <span className="sr-only">Loading</span>
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
      </div>
    )
  }

  return children
}
