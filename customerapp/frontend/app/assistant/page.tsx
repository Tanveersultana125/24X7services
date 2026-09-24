import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AssistantScreen } from './AssistantScreen'

export const metadata: Metadata = { title: 'Assistant' }

/**
 * `useSearchParams` cannot be read during prerender, so the screen behind it
 * renders on the client and needs a boundary to prerender up to.
 */
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <AssistantScreen />
    </Suspense>
  )
}
