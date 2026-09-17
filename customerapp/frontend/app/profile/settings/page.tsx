import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Settings' }

export default function Page() {
  return <ScreenStub title={'Settings'} route={'/profile/settings'} note={'Notifications, language and account deletion.'} />
}
