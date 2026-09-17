import type { Metadata } from 'next'
import { ComponentLibrary } from './ComponentLibrary'

export const metadata: Metadata = {
  title: 'Component library',
  // Nobody should find this from a search result.
  robots: { index: false, follow: false },
}

/**
 * Every component in the design system, in every state it has.
 *
 * This is the Phase 1 acceptance check, and it stays useful afterwards: when a
 * component changes, this page is where the empty, loading, error and selected
 * states are all visible at once, without walking the app to find a booking in
 * the right status.
 */
export default function ComponentsPage() {
  return <ComponentLibrary />
}
