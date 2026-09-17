import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Payment' }

export default function Page() {
  return <ScreenStub title={'Payment'} route={'/book/payment'} note={'Pay the visit fee now, or after the service.'} />
}
