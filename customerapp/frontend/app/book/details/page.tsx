import type { Metadata } from 'next'
import { DetailsScreen } from './DetailsScreen'

export const metadata: Metadata = { title: 'Appliance details' }

export default function Page() {
  return <DetailsScreen />
}
