import type { Metadata } from 'next'
import { MembershipScreen } from './MembershipScreen'

export const metadata: Metadata = { title: 'Membership' }

export default function Page() {
  return <MembershipScreen />
}
