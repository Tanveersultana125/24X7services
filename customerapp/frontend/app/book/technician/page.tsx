import type { Metadata } from 'next'
import { TechnicianScreen } from './TechnicianScreen'

export const metadata: Metadata = { title: 'Choose an expert' }

export default function Page() {
  return <TechnicianScreen />
}
