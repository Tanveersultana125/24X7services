import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Bookings' }

export default function Page() {
  return <ScreenStub title={'Bookings'} route={'/bookings'} note={'Upcoming, active and completed.'} />
}
