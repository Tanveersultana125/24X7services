import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Your reviews' }

export default function Page() {
  return <ScreenStub title={'Your reviews'} route={'/profile/reviews'} note={'Reviews you have left.'} />
}
