import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Offline' }

export default function Page() {
  return <ScreenStub title={'Offline'} route={'/offline'} note={'Shown when the device has no connection and nothing is cached.'} />
}
