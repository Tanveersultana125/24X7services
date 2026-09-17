import type { Metadata } from 'next'
import { ReviewsScreen } from './ReviewsScreen'

export const metadata: Metadata = { title: 'Your reviews' }

export default function Page() {
  return <ReviewsScreen />
}
