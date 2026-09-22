import type { Metadata } from 'next'
import { CareScreen } from './CareScreen'

export const metadata: Metadata = { title: 'Care plans' }

export default function Page() {
  return <CareScreen />
}
