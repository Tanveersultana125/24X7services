import { ScreenStub } from '@/components/dev/ScreenStub'

export const metadata = { title: 'Sign in' }

export default function Page() {
  return <ScreenStub title={'Sign in'} route={'/login'} note={'Phone OTP or Google, with the Terms and Privacy consent.'} />
}
