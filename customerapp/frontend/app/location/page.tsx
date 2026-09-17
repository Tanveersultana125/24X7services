import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Location' }

export default function Page() {
  return <ScreenStub title={'Location'} route={'/location'} note={'Pick your location and check that we service the pincode.'} />
}
