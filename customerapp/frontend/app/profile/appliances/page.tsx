import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'My appliances' }

export default function Page() {
  return <ScreenStub title={'My appliances'} route={'/profile/appliances'} note={'Appliances you have saved, and their service history.'} />
}
