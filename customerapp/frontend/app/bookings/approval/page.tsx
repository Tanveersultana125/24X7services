import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Approve repair' }

export default function Page() {
  return <ScreenStub title={'Approve repair'} route={'/bookings/approval'} note={'Approve or decline each line item.'} />
}
