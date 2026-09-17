import type { Metadata } from 'next'
import { ReviewScreen } from './ReviewScreen'

export const metadata: Metadata = { title: 'Review your booking' }

export default function Page() {
  return <ReviewScreen />
}
