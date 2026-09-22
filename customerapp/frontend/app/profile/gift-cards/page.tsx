import type { Metadata } from 'next'
import { GiftCardsScreen } from './GiftCardsScreen'

export const metadata: Metadata = { title: 'Gift cards' }

export default function Page() {
  return <GiftCardsScreen />
}
