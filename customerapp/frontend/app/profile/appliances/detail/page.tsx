import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Appliance' }

export default function Page() {
  return <ScreenStub title={'Appliance'} route={'/profile/appliances/detail'} note={'One saved appliance.'} />
}
