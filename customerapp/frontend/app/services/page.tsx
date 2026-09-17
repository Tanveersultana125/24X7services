import type { Metadata } from 'next'
import { ServicesScreen } from './ServicesScreen'

export const metadata: Metadata = { title: 'All services' }

export default function Page() {
  return <ServicesScreen />
}
