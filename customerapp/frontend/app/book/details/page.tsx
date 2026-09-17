import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Appliance details' }

export default function Page() {
  return <ScreenStub title={'Appliance details'} route={'/book/details'} note={'Type, model number and the model sticker photo.'} />
}
