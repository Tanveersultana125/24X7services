import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Profile' }

export default function Page() {
  return <ScreenStub title={'Profile'} route={'/profile'} note={'Your account.'} />
}
