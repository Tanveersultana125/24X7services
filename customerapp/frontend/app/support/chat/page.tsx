import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Chat' }

export default function Page() {
  return <ScreenStub title={'Chat'} route={'/support/chat'} note={'The assistant, with a human always one tap away.'} />
}
