import type { Metadata } from 'next'
import { WarrantiesScreen } from './WarrantiesScreen'

export const metadata: Metadata = { title: 'Warranties' }

export default function Page() {
  return <WarrantiesScreen />
}
