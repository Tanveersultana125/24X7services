import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Your tickets' }

export default function Page() {
  return <ScreenStub title={'Your tickets'} route={'/support/tickets'} note={'Every conversation you have opened.'} />
}
