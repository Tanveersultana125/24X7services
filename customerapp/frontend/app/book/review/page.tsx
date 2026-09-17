import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Review booking' }

export default function Page() {
  return <ScreenStub title={'Review booking'} route={'/book/review'} note={'Everything so far, with an Edit link on each step.'} />
}
