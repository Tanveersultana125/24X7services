import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Possible causes' }

export default function Page() {
  return <ScreenStub title={'Possible causes'} route={'/book/diagnosis'} note={'Rule-based causes, verified on site.'} />
}
