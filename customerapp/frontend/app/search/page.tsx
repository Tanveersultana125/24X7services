import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Search' }

export default function Page() {
  return <ScreenStub title={'Search'} route={'/search'} note={'Appliances, services and issues matched from the catalog.'} />
}
