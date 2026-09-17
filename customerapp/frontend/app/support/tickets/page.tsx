import type { Metadata } from 'next'
import { TicketsScreen } from './TicketsScreen'

export const metadata: Metadata = { title: 'Your conversations' }

export default function Page() {
  return <TicketsScreen />
}
