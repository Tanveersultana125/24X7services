import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'All services' }

export default function Page() {
  return <ScreenStub title={'All services'} route={'/services'} note={'Every appliance we service.'} />
}
