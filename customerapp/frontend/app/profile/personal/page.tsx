import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Personal details' }

export default function Page() {
  return <ScreenStub title={'Personal details'} route={'/profile/personal'} note={'Name, phone and email.'} />
}
