import type { Metadata } from 'next'
import { DiagnosisScreen } from './DiagnosisScreen'

export const metadata: Metadata = { title: 'Possible causes' }

export default function Page() {
  return <DiagnosisScreen />
}
