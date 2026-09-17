import type { Metadata } from 'next'
import { PaymentsScreen } from './PaymentsScreen'

export const metadata: Metadata = { title: 'Invoices' }

export default function Page() {
  return <PaymentsScreen />
}
