import type { Metadata } from 'next'
import { ReferScreen } from './ReferScreen'

export const metadata: Metadata = { title: 'Refer a friend' }

export default function Page() {
  return <ReferScreen />
}
