import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Invoice' }

export default function Page() {
  return <ScreenStub title={'Invoice'} route={'/bookings/invoice'} note={'The GST invoice for this job.'} />
}
