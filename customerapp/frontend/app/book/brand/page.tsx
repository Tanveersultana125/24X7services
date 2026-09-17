import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Brand' }

export default function Page() {
  return <ScreenStub title={'Brand'} route={'/book/brand'} note={'Which manufacturer made the appliance.'} />
}
