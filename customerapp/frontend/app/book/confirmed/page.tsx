import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Booking confirmed' }

export default function Page() {
  return <ScreenStub title={'Booking confirmed'} route={'/book/confirmed'} note={'What happens next.'} />
}
