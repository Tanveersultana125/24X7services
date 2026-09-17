import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Addresses' }

export default function Page() {
  return <ScreenStub title={'Addresses'} route={'/profile/addresses'} note={'Saved addresses.'} />
}
