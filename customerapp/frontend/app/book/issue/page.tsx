import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'What is wrong' }

export default function Page() {
  return <ScreenStub title={'What is wrong'} route={'/book/issue'} note={'The issues to look at.'} />
}
