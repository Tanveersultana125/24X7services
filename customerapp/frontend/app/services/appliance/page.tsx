import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Appliance services' }

export default function Page() {
  return <ScreenStub title={'Appliance services'} route={'/services/appliance'} note={'The services available for one appliance.'} />
}
