import type { Metadata } from 'next'
import { PaymentScreen } from './PaymentScreen'

export const metadata: Metadata = { title: 'Payment' }

export default function Page() {
  return <PaymentScreen />
}
