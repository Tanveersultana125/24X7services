import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Verify code' }

export default function Page() {
  return <ScreenStub title={'Verify code'} route={'/login/otp'} note={'Enter the six-digit code sent to the phone.'} />
}
