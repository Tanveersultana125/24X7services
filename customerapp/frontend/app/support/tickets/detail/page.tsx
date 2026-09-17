import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Ticket' }

export default function Page() {
  return <ScreenStub title={'Ticket'} route={'/support/tickets/detail'} note={'One conversation.'} />
}
