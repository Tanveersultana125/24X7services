import type { Metadata } from 'next'
import { AboutScreen } from './AboutScreen'

export const metadata: Metadata = { title: 'About 24X7' }

export default function Page() {
  return <AboutScreen />
}
