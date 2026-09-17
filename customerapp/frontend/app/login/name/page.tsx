import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Your name' }

export default function Page() {
  return <ScreenStub title={'Your name'} route={'/login/name'} note={'Optional, and skippable.'} />
}
