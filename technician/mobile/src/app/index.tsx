import { Redirect } from 'expo-router'
import { useStore } from '@/lib/store'

/** The front door: straight to work if signed in, otherwise to sign-in. */
export default function Index() {
  const { signedIn } = useStore()
  return <Redirect href={signedIn ? '/home' : '/login'} />
}
