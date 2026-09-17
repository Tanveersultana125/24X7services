import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Warranty' }

export default function Page() {
  return <ScreenStub title={'Warranty'} route={'/bookings/warranty'} note={'What is covered, and until when.'} />
}
