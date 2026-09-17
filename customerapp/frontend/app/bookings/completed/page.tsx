import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Service complete' }

export default function Page() {
  return <ScreenStub title={'Service complete'} route={'/bookings/completed'} note={'The completion OTP and what was done.'} />
}
