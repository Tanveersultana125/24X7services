import type { Metadata } from 'next'
import { BookingsScreen } from './BookingsScreen'

export const metadata: Metadata = { title: 'Your bookings' }

export default function Page() {
  return <BookingsScreen />
}
