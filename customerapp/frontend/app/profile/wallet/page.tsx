import type { Metadata } from 'next'
import { WalletScreen } from './WalletScreen'

export const metadata: Metadata = { title: 'Credits' }

export default function Page() {
  return <WalletScreen />
}
