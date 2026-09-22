import type { Metadata } from 'next'
import { PlansScreen } from './PlansScreen'

export const metadata: Metadata = { title: 'Plans' }

export default function Page() {
  return <PlansScreen />
}
