import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Track' }

export default function Page() {
  return <ScreenStub title={'Track'} route={'/bookings/track'} note={'Where the expert is, and when they arrive.'} />
}
