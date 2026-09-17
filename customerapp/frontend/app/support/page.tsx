import type { Metadata } from 'next'
import { SupportScreen } from './SupportScreen'

export const metadata: Metadata = { title: 'Support' }

export default function Page() {
  return <SupportScreen />
}
