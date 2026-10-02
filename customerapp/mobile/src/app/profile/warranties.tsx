import { ShieldCheck } from 'lucide-react-native'
import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { WarrantyList } from '@/screens/profile/warranties/WarrantyList'

/**
 * Every service warranty, soonest to lapse first.
 *
 * Ordered by expiry rather than by date issued, because the only question this
 * screen answers is "is this still covered" — and the one about to run out is
 * the one worth acting on today.
 */
export default function WarrantiesScreen() {
  return (
    <ProfileShell
      title="Warranties"
      signedOut={
        <SignInPrompt
          icon={ShieldCheck}
          title="Your warranties"
          description="Every completed repair carries a service warranty. Log in to see what is still covered."
        />
      }
    >
      {(user) => <WarrantyList uid={user.uid} />}
    </ProfileShell>
  )
}
