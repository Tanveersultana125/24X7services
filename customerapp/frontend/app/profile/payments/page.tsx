import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Payments' }

export default function Page() {
  return <ScreenStub title={'Payments'} route={'/profile/payments'} note={'Past payments and refunds.'} />
}
