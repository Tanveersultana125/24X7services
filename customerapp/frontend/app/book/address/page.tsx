import type { Metadata } from 'next'
import { AddressScreen } from './AddressScreen'

export const metadata: Metadata = { title: 'Service address' }

export default function Page() {
  return <AddressScreen />
}
