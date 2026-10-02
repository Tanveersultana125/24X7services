import { ProfileShell } from '@/components/ProfileShell'
import { Plans, PlansOnOffer } from '@/screens/profile/plans/PlansBody'

/**
 * Annual plans: the ones this customer holds, and the ones on offer.
 *
 * A plan is a number of service visits on named appliances, for a year, paid
 * for up front. Visits come off it when a job is *finished*, not when it is
 * booked — a booking that gets cancelled has cost nobody a visit, and a plan
 * that debited at booking time would have to give one back on every
 * cancellation, which is a refund path written twice for a thing that is not
 * money.
 *
 * What a plan covers at checkout is the visit fee on the appliances it names.
 * It is not a discount on parts, and nothing on this screen implies it is.
 *
 * The offer list is public. It is a price list, and a price list you have to
 * sign in to read is a shop with the shutters down.
 */
export default function PlansScreen() {
  return (
    <ProfileShell title="Plans" signedOut={<PlansOnOffer />}>
      {(user) => <Plans uid={user.uid} />}
    </ProfileShell>
  )
}
