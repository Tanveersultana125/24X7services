import type { Metadata } from 'next'
import { SlotScreen } from './SlotScreen'

export const metadata: Metadata = { title: 'Pick a time' }

export default function Page() {
  return <SlotScreen />
}
