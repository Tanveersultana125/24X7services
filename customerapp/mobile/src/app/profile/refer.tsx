import { Gift } from 'lucide-react-native'
import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { Refer } from '@/screens/profile/refer/ReferBody'

/**
 * Your code, the ways to send it, and what it has earned.
 *
 * The promise is written the way the code actually pays: both people are
 * credited when the person who used it has had a job *finished*. Not on
 * sign-up, not on booking. "Get ₹250 when your friend signs up" and paying
 * three weeks later is how a referral scheme turns into a support queue, so
 * the sentence and the server agree here, word for word.
 *
 * The code is made by the server the first time this screen is opened. There
 * is nothing to generate, claim or activate — it exists because you asked to
 * see it, which is the only moment anyone needs one.
 *
 * Sending it is named channels rather than one Share button, because a share
 * sheet is a list of forty apps between somebody and the one they were always
 * going to use. WhatsApp is first and it is not a close-run thing here. The
 * sheet is still there, last, for everyone the three do not cover.
 */
export default function ReferScreen() {
  return (
    <ProfileShell
      title="Refer & earn"
      signedOut={
        <SignInPrompt
          icon={Gift}
          title="Your referral code"
          description="Refer a friend and you both get credits once their first job is finished. Log in for your code."
        />
      }
    >
      {() => <Refer />}
    </ProfileShell>
  )
}
