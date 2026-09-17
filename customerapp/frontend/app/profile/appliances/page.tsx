import type { Metadata } from 'next'
import { AppliancesScreen } from './AppliancesScreen'

export const metadata: Metadata = { title: 'My appliances' }

export default function Page() {
  return <AppliancesScreen />
}
