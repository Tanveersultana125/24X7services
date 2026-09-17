import type { Metadata } from 'next'
import { OfflineScreen } from './OfflineScreen'

export const metadata: Metadata = {
  title: 'Offline',
  // The service worker serves this when a page cannot be reached; it should
  // never be what a search result points at.
  robots: { index: false, follow: false },
}

export default function Page() {
  return <OfflineScreen />
}
