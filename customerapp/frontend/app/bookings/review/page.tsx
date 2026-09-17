import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Rate your service' }

export default function Page() {
  return <ScreenStub title={'Rate your service'} route={'/bookings/review'} note={'Rate the job and the expert.'} />
}
