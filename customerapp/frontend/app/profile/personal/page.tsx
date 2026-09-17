import type { Metadata } from 'next'
import { PersonalScreen } from './PersonalScreen'

export const metadata: Metadata = { title: 'Personal details' }

export default function Page() {
  return <PersonalScreen />
}
