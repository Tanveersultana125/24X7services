import type { Metadata } from 'next'
import { ProfileScreen } from './ProfileScreen'

export const metadata: Metadata = { title: 'Profile' }

export default function Page() {
  return <ProfileScreen />
}
