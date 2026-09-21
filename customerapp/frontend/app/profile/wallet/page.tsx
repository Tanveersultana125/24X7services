import type { Metadata } from 'next'
import { WalletScreen } from './WalletScreen'

export const metadata: Metadata = { title: 'Balance' }

export default function Page() {
  return <WalletScreen />
}
