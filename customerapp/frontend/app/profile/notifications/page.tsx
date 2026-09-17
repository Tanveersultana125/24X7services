import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Notifications' }

export default function Page() {
  return <ScreenStub title={'Notifications'} route={'/profile/notifications'} note={'Everything the app has told you.'} />
}
