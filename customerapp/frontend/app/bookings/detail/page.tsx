import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Booking' }

export default function Page() {
  return <ScreenStub title={'Booking'} route={'/bookings/detail'} note={'Everything about one booking.'} />
}
