import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Home' }

export default function Page() {
  return <ScreenStub title={'Home'} route={'/home'} note={'Location, search, banners, services, brands and saved appliances.'} />
}
