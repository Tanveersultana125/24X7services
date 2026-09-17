import type { Metadata } from 'next'
import { AddressesScreen } from './AddressesScreen'

export const metadata: Metadata = { title: 'Saved addresses' }

export default function Page() {
  return <AddressesScreen />
}
