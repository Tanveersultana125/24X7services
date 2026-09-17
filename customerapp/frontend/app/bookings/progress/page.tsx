import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Service in progress' }

export default function Page() {
  return <ScreenStub title={'Service in progress'} route={'/bookings/progress'} note={'Inspection, diagnosis, repair, testing.'} />
}
